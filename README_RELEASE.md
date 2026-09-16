# README_RELEASE.md — EAS 云端打包 + GitHub Release 分发

本工程通过 **EAS（Expo Application Services）云构建 + GitHub Actions** 实现「打 tag 自动出包 + 上传 GitHub Release」：

- **触发**：仅推送 `v*` 开头的 git tag（如 `v1.0.0`）。普通 commit / PR 不会触发。
- **Android 产物**：`countdown-day.apk`（签名、可直接安装），**免费可行**。
- **iOS 模拟器产物**：`countdown-day-simulator.ipa`（**无签名**、免费、无需 Apple 账号），只能装进 Mac 的 Xcode 模拟器。
- **iOS 真机产物**：`countdown-day.ipa`，**默认关闭**——真机分发包必须付费 Apple 开发者账号（见下文「iOS 的现实」）。
- **不做**：不上架 App Store / Google Play。

流水线文件：`.github/workflows/release.yml`。

---

## ⚠️ 0. iOS 的现实（必读）

苹果强制所有装进 **iPhone** 的应用签名。但「iOS 应用包」分两类，处理和代价完全不同：

| 目标 | 产物 | 费用 / 是否需要 Apple 账号 | 能装在哪 |
|---|---|---|---|
| **Xcode 模拟器** | `countdown-day-simulator.ipa`（本 CI 默认免费产出） | 免费、无需 Apple 账号（无签名） | 仅 macOS 上的 Xcode 模拟器 |
| **真实 iPhone** | `countdown-day.ipa`（默认关闭） | $99/年 付费开发者账号 | 已登记 UDID 的 iPhone |
| 免费 Apple ID 侧载（AltStore/爱思） | 自用 | 免费 | 你自己 ≤3 台 iPhone，7 天续签 |

> 结论 1：**无签名的 IPA 永远装不上真实 iPhone**——这是苹果签名机制决定的，不是打包工具的差异。
> 结论 2：想免费拿一个「iOS 格式包」放 GitHub Release，**模拟器 IPA 就是能做到的极限**，适合演示/预览；想让别人真机安装，必须付费账号。

Android 完全没有这些限制，APK 直接装。

---

## ① 前置条件（必须）

### 1.1 GitHub Actions Secret：`EXPO_TOKEN`

EAS 云端构建需要登录凭证。生成方式：

1. 打开 https://expo.dev → 右上角头像 → **Account Settings**。
2. **Access Tokens** → 创建新 token（权限读写皆可），复制。
3. 仓库 → `Settings` → `Secrets and variables` → `Actions` → **New repository secret**：
   - Name：`EXPO_TOKEN`
   - Value：粘贴刚才的 token

没有这个 Secret，Android 任务会直接报错退出。

### 1.2 本地 EAS 登录（首次配置用，日常打包不需要）

```powershell
# 全局安装 EAS CLI（本机已装可跳过）
npm i -g eas-cli

# 登录一次即可
eas login

# 工程已关联 projectId（app.json 的 extra.eas.projectId），确认连接状态
eas whoami
```

### 1.3 远端仓库推送

确保 `origin` 是 GitHub 仓库，且本地提交都已推送（GitHub Actions 基于推送的 tag 上的代码构建）。

---

## ② 启用 iOS（可选，需付费 Apple 账号）

**免费账号到此为止即可，直接跳到第 ③ 节。**

付费开发者账号的启用步骤（自选）：

1. 仓库 → `Settings` → `Secrets and variables` → **Variables** → 新建仓库变量 `ENABLE_IOS_BUILD`，值填 `true`。
2. 配置 9 个 Actions Secrets（值均为**严格按以下说明**的内容）：

| Secret | 内容 |
|---|---|
| `IOS_CERTIFICATE_BASE64` | Apple Distribution 证书 `.p12`（含私钥）转 Base64 |
| `IOS_CERTIFICATE_PASSWORD` | 导出 .p12 时的密码 |
| `IOS_MOBILEPROVISION_BASE64` | **AdHoc** 描述文件 `.mobileprovision` 转 Base64 |
| `IOS_TEAM_ID` | Apple Membership 页的 Team ID（10 位字母数字） |
| `IOS_PROVISIONING_PROFILE_NAME` | 描述文件在苹果后台显示的名称 |

> 补充：EAS 也可以自己托管 Apple 凭证（`eas build:configure` 时选 EAS 托管），那样只需保证 EXPO_TOKEN 对应的账号是付费开发者即可，不必手动塞上面 5 个 iOS Secrets——两者选其一。

3. 在 `eas.json` 里给所使用的 profile 加 `"distribution": "internal"`（AdHoc 内部分发）：
   ```json
   "preview": {
     "distribution": "internal",
     "android": { "buildType": "apk" }
   }
   ```
4. 苹果后台先登记要装包的设备 UDID，再生成 AdHoc 描述文件（顺序不能反）。

Base64 转换命令（PowerShell）：
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("你的文件路径"))
```

---

## ③ 发布操作步骤（打 tag 触发）

```powershell
# 1. 打 tag，版本号示例 v1.0.0
git tag v1.0.0

# 2. 推送 tag（只有推送 tag 才会触发 release.yml）
git push origin v1.0.0
```

随即在仓库 `Actions` 页看到 `Build & Release` 工作流。只有 Android 启用时流程为：

```
build-android（EAS 云构建大约 10~20 分钟） ──► release（创建 Release + 上传 APK）
```

全部绿色后，仓库 `Releases` 页出现 `v1.0.0`，展开即可下载 `countdown-day.apk`。

> - 想重新触发出包：`git tag -d v1.0.0` + `git push --delete origin v1.0.0` 后重新打 tag 再推。
> - 新版本直接打新 tag（如 `v1.0.1`）。
> - EAS 免费额度：每月 Android 30 次 / iOS 30 次，日常够用。

---

## ④ 分发说明

### Android（APK，免费）

1. Release 页面下载 `countdown-day.apk`，微信/网盘/数据线传到手机。
2. 手机开启「允许安装未知来源应用」（设置 → 安全 → 安装未知应用）。
3. 点击直接安装。

### iOS 模拟器 IPA（免费，macOS 上预览）

1. Release 页面下载 `countdown-day-simulator.ipa`，解压得到 `Payload/<App名>.app`。
2. Mac 打开 Xcode → 打开任一 iOS 模拟器（或命令行 `xcrun simctl boot "iPhone 16"`）。
3. 把 `.app` 直接拖进模拟器窗口即可安装运行。

> 只装得上模拟器，装不进真实 iPhone（无签名，见第 ⑥ 节答疑）。

### iOS 真机 IPA（需付费账号，见 ② 和 ⑤）

- 付费账号 + AdHoc：只能装进已登记 UDID 的设备，首次使用要在 iPhone「设置 → 通用 → VPN与设备管理 → 信任开发者证书」。
- 免费账号：见第 ⑤ 节侧载方案，自用且 7 天续签。

---

## ⑤ 免费自用 iOS 侧载（不产生可分发产物）

只适用于**自己的一台 iPhone**，7 天续签一次：

1. 手机连 Mac（免费签名需要 Mac + Xcode 或 Mac + AltServer）。
2. 三种工具任选：**爱思助手**（Windows/macOS 均可用，自动签名安装）、**AltStore/AltServer**（勾选后 7 天自动续签）、**Sideloadly**。
3. 首次安装后在 iPhone：设置 → 通用 → VPN与设备管理 → 信任该开发者。

> 产出环境需有一台 Mac。Windows 上无法完成 iOS 签名。若坚持「完全不碰苹果生态」，那就只发 Android APK。

---

## ⑥ 常见问题速查

| 现象 | 原因 / 处理 |
|---|---|
| Actions 没触发 | tag 名不是 `v*`；或本地 tag 未 push |
| 模拟器 `.ipa` 装不进我的 iPhone | 正常：无签名包只能装 Xcode 模拟器；真机必须签名（免费自装见 ⑤，付费 AdHoc 见 ②） |
| Android 报 `不是 Expo 授权用户` | `EXPO_TOKEN` 未配置或已过期；expo.dev 重新生成 |
| 报 `app.json 未关联 EAS` | 仓库里 `extra.eas.projectId` 缺失；本地 `eas init` 补齐后提交 |
| iOS 真机任务始终跳过 | 未设置仓库变量 `ENABLE_IOS_BUILD=true`（免费账号跳过是正常的） |
| iOS 真机构建报证书/No profiles | 未付费开发者账号；或 Secrets 没配全 / 描述文件不含目标机 UDID |
| Release 附件里没有真机 ipa | 属正常：默认只发布 APK + 模拟器 IPA |
| 同名 tag 已发布导致失败 | 删旧 tag + 旧 Release 后重推 |