/**
 * 全局 TypeScript 类型定义
 * 所有页面、store、本地存储、通知模块统一复用，保证数据类型安全。
 */

/** 历法类型 */
export type CalendarType = 'solar' | 'lunar';

/** 单个倒数事件（一条数据记录） */
export interface CountdownItem {
  /** 唯一标识：创建时生成（时间戳 36 进制 + 随机段） */
  id: string;
  /** 事件名称，例如「考研」「发工资」 */
  title: string;
  /** 目标日期，仅日期部分，格式 YYYY-MM-DD（公历），倒计时统一用公历计算 */
  targetDate: string;
  /** 历法类型：solar=公历，lunar=农历（影响展示与选择器） */
  calendarType: CalendarType;
  /** 创建时间戳（毫秒），列表同日期时按它稳定排序 */
  createdAt: number;
  /** 最后修改时间戳（毫秒） */
  updatedAt: number;
  /**
   * 已调度的「到期提醒」系统通知标识。
   * 编辑/删除事件时用它取消旧通知；没有调度过则为 null。
   */
  notificationId: string | null;
}

/** 表单提交数据（新增 / 编辑共用） */
export interface EventFormValues {
  title: string;
  targetDate: string;
  calendarType: CalendarType;
}

/** 页面导航路由参数表（本项目共 3 个页面） */
export type RootStackParamList = {
  /** 首页：事件列表 */
  Home: undefined;
  /** 新增事件页 */
  Add: undefined;
  /** 编辑事件页：携带事件 id */
  Edit: { id: string };
};
