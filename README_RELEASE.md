# README_RELEASE.md — GitHub Actions 自动化打包与分发说明

本工程通过 GitHub Actions 实现「打 tag 自动出包 + 上传 GitHub Release」：

- **触发**：仅推送 `v*` 开头的 git tag（如 `v1.0.0`）。普通 commit / PR 不会触发。
- **产物**：Android **release 签名 APK**（`app-release.apk`，直接安装）＋ iOS **AdHoc IPA**（只能装进预先登记 UDID 的 iPhone）。
- **不做**：不上架 App Store、不用企业证书、不打 AAB。

流水线文件：`.github/workflows/release.yml`。

---

## ⚠️ 0. 当前仓库状态说明（必读）

本仓库 **countdown-day 当前是 Expo 托管工程**（使用 expo ~57，没有 `android/`、`ios/` 原生目录）。而本打包方案按你要求的「裸 React Native 原生工程」编写，直接跑会在 `cd android` / `cmake` / `xcodebuild` 处失败。**要让它生效，请先用 Expo 的 CNG（Continuous Native Generation）生成原生目录并提交到仓库：**

```bash
npx expo prebuild -p android -p ios
```

- 生成后，`android/`、`ios/` 会进入仓库（`.gitignore` 默认会忽略它们，如需 CI 使用必须 `git add -f android ios` 强制提交，或临时从 `.gitignore` 移除）。
- prebuild 后的 iOS target / scheme 通常为 `countdown-day`，Bundle ID 沿用 `app.json` 里的 `com.countdownday.app`（与 `release.yml` 里 `IOS_BUNDLE_ID` 一致即可）。
- 若你的目标工程本身就是裸 RN，则跳过本节。

---

## ① 需要在仓库配置的 GitHub Secrets

仓库 → `Settings` → `Secrets and variables` → `Actions` → `New repository secret`，逐条添加：

| Secret 名称 | 内容 | 是否必填 |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | Android release keystore 文件的 **Base64 编码**（不是明文密码） | ✅ |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 的存储密码（store password） | ✅ |
| `ANDROID_KEY_ALIAS` | keystore 生成时指定的别名（alias） | ✅ |
| `ANDROID_KEY_PASSWORD` | 该别名对应的密钥密码（key password） | ✅ |
| `IOS_CERTIFICATE_BASE64` | Apple Distribution 证书 **.p12（含私钥）** 的 Base64 | ✅ |
| `IOS_CERTIFICATE_PASSWORD` | 导出 .p12 时设置的密码 | ✅ |
| `IOS_MOBILEPROVISION_BASE64` | iOS **AdHoc** 描述文件 `.mobileprovision` 的 Base64 | ✅ |
| `IOS_TEAM_ID` | Apple Developer Team ID（后台 Membership 页可见，10 位字母数字） | ✅ |
| `IOS_PROVISIONING_PROFILE_NAME` | AdHoc 描述文件在 Apple 后台显示的名称（如 `CountdownDay AdHoc`） | ✅ |

> 密钥全程只存于 Secrets，`release.yml` 内不硬编码任何密码。

---

## ② 本地需要提前准备的文件

### 2.1 Android：keystore（生成一次，永久保留）

```bash
# 生成 keystore（有效期建议 25~100 年）
keytool -genkeypair -v \
  -keystore release.keystore.jks \
  -alias release \
  -keyalg RSA -keysize 2048 \
  -validity 36500
```

**务必把 `release.keystore.jks`、store 密码、alias、key 密码安全备份**——丢了就再也无法更新已上架应用（此处无商店，但更新要用同一个签名）。把它转成 Base64 填入 Secret：

```bash
# Linux / macOS
base64 -w0 release.keystore.jks

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release.keystore.jks"))
```

### 2.2 gradle 签名配置改造（一次性，随代码提交）

在 `android/app/build.gradle`（groovy 模板）里加：

```groovy
// 文件顶部（已经有类似块就只补缺）
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            storeFile file(keystoreProperties['KEYSTORE_FILE'])
            storePassword keystoreProperties['KEYSTORE_PASSWORD']
            keyAlias keystoreProperties['KEY_ALIAS']
            keyPassword keystoreProperties['KEY_PASSWORD']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release   // ← 关键：release 走签名
            // minifyEnabled / proguard 按需开启
        }
    }
}
```

> CI 会用 Secrets 现场生成 `android/keystore.properties`，`keystore.jks` 由 `ANDROID_KEYSTORE_BASE64` 还原到 `android/app/keystore.jks`，**不要把你的 private keystore 提交进 git**。

### 2.3 iOS：Apple 开发者证书（.p12）

1. 电脑「钥匙串访问 → 我的证书」找到 **Apple Distribution** 证书（带私钥）。
2. 右键导出为 `.p12`，设置一个导出密码 → 得到 `Dist_Cert.p12`。
3. 转 Base64（同上节命令）→ 填入 `IOS_CERTIFICATE_BASE64`，密码填入 `IOS_CERTIFICATE_PASSWORD`。
4. Team ID（`developer.apple.com` → Account → Membership）→ 填入 `IOS_TEAM_ID`。

### 2.4 iOS：AdHoc 描述文件（`.mobileprovision`）

**流程顺序不能反**：先登记设备，再生成描述文件。

1. `developer.apple.com` → Certificates → 确认已有 Distribution 证书（.p12 对应的那枚）。
2. **Devices**：把测试机连 Mac/Xcode，或用爱思助手里显示的 **UDID**，逐个 Add（`iTunes/finder` 里可直接拷贝 UDID）。
3. **Provisioning Profiles** → Distribution → **Ad Hoc**，选择上一步的证书 + 设备，命名如 `CountdownDay AdHoc` → 下载 `.mobileprovision`。
4. 转 Base64 → 填入 `IOS_MOBILEPROVISION_BASE64`；后台显示的名称填入 `IOS_PROVISIONING_PROFILE_NAME`。

> Working Copy 里 Release 的 scheme 名（`IOS_SCHEME`）、Bundle ID（`IOS_BUNDLE_ID`）与 `release.yml` 顶部 env 保持一致。

---

## ③ 发布操作步骤（打 tag 触发）

```bash
# 1. 版本号示例：v1.0.0
git tag v1.0.0

# 2. 推送 tag（推送 tag 才会触发 release.yml）
git push origin v1.0.0
```

随即在仓库 `Actions` 页可看到 `Build & Release` 工作流，三个任务顺序执行：

```
build-android（ubuntu） ─┐
                         ├─► release（创建 Release + 上传统一附件）
build-ios（macos）    ──┘
```

全部绿色后，仓库 `Releases` 页出现 `v1.0.0`，展开可见并下载 `app-release.apk` 与 `xxx.ipa`。

> - Android 依赖**本地一次性的 gradle 改造**；iOS 依赖 **9 个 Secrets** 完整且描述文件包含目标设备 UDID。
> - 想重新触发出包：先 `git tag -d v1.0.0 && git push --delete origin v1.0.0`，重新打 tag 再推（网络原因偶尔会"已存在"报错）。
> - **版本号没变就改 tag 名推出新版本**（如 `v1.0.1`），Release 附件会以新 tag 展示。

---

## ④ 分发说明

### Android（APK）

1. 在 Release 页面下载 `app-release.apk`，传到手机（微信/网盘/数据线）。
2. 手机开启「允许安装未知来源应用」（不同厂商路径：设置 → 安全/应用 → 安装未知应用）。
3. 点击 apk 直接安装。

### iOS（AdHoc IPA）——先看 UDID 限制

> **AdHoc 包只能装进「Apple 后台已登记 UDID」的 iPhone。**
> 有没有登记，任何安装工具都无法绕过；没登记先补登记 → 重新生成描述文件 → 重跑 CI。

确认 UDID 已登记的常见问题：
- 描述文件是在登记**这台手机**之后生成的；
- 证书未过期 / 未被吊销（Apple 后台看状态）；
- 安装时报 `unable to verify` / 灰色不可点，说明设备不在 profile 里。

**安装方式（任选其一，都是把 ipa 推到手机）：**

1. **爱思助手（Windows/macOS 都行）**
   - iPhone 数据线连电脑 → 电脑打开「爱思助手」→ 手机端打开「爱思助手」App。
   - 电脑端「工具箱 → 应用游戏 → 导入 […]」选中 `.ipa`，或在「资料 → 已安装应用」拖入 ipa。
   - 会自动通过 Apple ID 签名后安装，首次需在 iPhone 设置里信任开发者。

2. **AltServer / AltStore（免企业签名）**
   - 电脑装 AltServer，iPhone 装 AltStore，两者同一局域网；
   - AltStore → My Apps → 右上角 `+` → 选 `.ipa`，用 Apple ID 登录自动安装；
   - 免费 Apple ID 每 7 天需刷新一次签名，否则 App 打不开。

3. **macOS 原生命令行（开发机）**
   ```bash
   # 需要另一条数据线相连且已在系统信任这台 Mac
   xcrun devicectl device install app --device <UDID> path/to/app.ipa
   # 或装 libimobiledevice 后
   ideviceinstaller -i path/to/app.ipa
   ```

安装后在手机上：`设置 → 通用 → VPN与设备管理 → 信任该开发者`（首次弹窗或打开即闪退时这样处理）。

---

## ⑤ 常见问题速查

| 现象 | 原因 / 处理 |
|---|---|
| Actions 没被触发 | tag 名不是 `v*`；或 `workflow_dispatch` 未启用（本方案只按 tag） |
| Android 报 `keystore '...' not found` | `ANDROID_KEYSTORE_BASE64` 没配，或 keystore.properties 没生成 |
| Android 报签名错误 | `ANDROID_KEY_ALIAS` / `KEY_PASSWORD` 与 keystore 实际不符 |
| Android 产物是 debug 签名 | `buildTypes.release` 未接 `signingConfigs.release`（见 2.2） |
| iOS `Security error: -25294` | 钥匙串未 `set-key-partition-list`，或导入的 .p12 不含私钥 |
| iOS `Provisioning profile ... not found` | profile 名/Team ID 与后台不一致，或 profile 未装进 runner |
| iOS 安装成功后闪退/无法信任 | UDID 未登记，或需在设置里信任开发者证书 |
| Release 在 tag 已存在时创建失败 | 同名 tag 已发布；换新 tag 或删除旧 Release/tag 重推 |