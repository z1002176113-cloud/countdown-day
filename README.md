# 极简倒数日（countdown-day）

一个纯本地、无后端、离线可用的移动端倒数日工具 App。用于记录考试、纪念日、发工资等目标日期，首页直观展示距离每个日期的剩余天数，到目标日期当天通过系统本地通知提醒。

> 面向实习生学习 / 简历的作品集项目：需求（PRD、验收清单）见 [docs](./docs) 目录。

## 技术栈

- **框架**：React Native + [Expo SDK 57](https://expo.dev)（Expo 托管工作流）
- **语言**：TypeScript（严格模式）
- **状态管理**：Zustand
- **本地存储**：@react-native-async-storage/async-storage（重启不丢数据）
- **本地通知**：expo-notifications（到期提醒，后台可触发）
- **导航**：@react-navigation/native + native-stack
- **UI**：react-native-paper + React Native 内置组件
- **日期选择**：@react-native-community/datetimepicker
- **打包**：Expo EAS Build（跨 iOS / Android 安装包）

## 功能说明

- **新增 / 编辑 / 删除倒数事件**：事件名称 + 目标日期
- **倒计时计算**（固定规则）：
  - 未来日期 → 「剩余 XX 天」
  - 今天 → 「今日」
  - 过去日期 → 「已过去 XX 天」
- **列表自动排序**：按目标日期远近排序，临近事件优先置顶
- **本地数据持久化**：关闭 App / 重启后数据不丢失
- **到期本地通知**：事件到达目标日期当天上午 9 点提醒（App 退到后台也能收到）
- **仅 3 个页面**：首页列表 / 新增事件 / 编辑事件

### 边界处理

- 空列表：首页友好展示空状态引导，不报错
- 空表单：事件名称为空时拦截提交并提示
- 重复日期：允许多条事件设置同一天，互不干扰
- 用户拒绝通知权限：App 不崩溃，仅不发提醒

### 已知产品限制（本期不做）

- 无桌面小组件，需打开 App 查看倒计时
- 无云端备份，卸载 App 数据会丢失
- 不支持农历、重复事件

## 目录结构

```
countdown-day/
├── components/          # 通用 UI 组件（列表项 / 表单 / 空状态）
├── screens/             # 页面（首页 / 新增 / 编辑，共 3 个）
├── store/               # Zustand 全局状态（唯一数据源）
├── utils/               # 工具函数（时间计算 / 存储 / 排序 / 通知）
├── types/               # TS 类型定义（CountdownItem、路由参数）
├── constants/           # 常量（主题配色 / 存储键 / 通知渠道）
├── docs/                # 产品需求与验收文档（来源飞书 Wiki）
├── assets/              # 图标等静态资源
├── App.tsx              # 应用入口（Provider 挂载 + 启动初始化）
├── index.ts             # 注册入口
├── app.json             # Expo 应用配置
├── eas.json             # EAS Build 配置
└── package.json
```

## 本地运行步骤

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务（手机安装 Expo Go 扫码预览，或按 a 打开 Android 模拟器）
npm start
```

> 本地通知在真机上效果完整；模拟器 / Expo Go 也支持本地通知的基础调试。

## 打包安装包（EAS Build，跨 iOS / Android）

```bash
# 1. 全局安装 EAS CLI
npm install -g eas-cli

# 2. 登录 Expo 账号
eas login

# 3. 构建安卓 APK（preview 配置，见 eas.json）
eas build -p android --profile preview

# 4. 构建 iOS（需 Apple 开发者账号；buildType 默认 app 包）
eas build -p ios --profile production
```

构建完成后按提示下载安装包即可安装到真机。
