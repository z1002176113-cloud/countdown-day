/**
 * 全局配色常量：浅色简洁风，按语义划分
 * （避免页面内散落魔法颜色，便于统一调整）
 */
export const COLORS = {
  /** 品牌主色（用于「剩余 XX 天」与按钮） */
  primary: '#4F6EF7',
  /** 「今日」状态色 */
  today: '#F5A623',
  /** 「已过去 XX 天」状态灰 */
  past: '#9AA3B0',
  /** 删除等危险操作色 */
  danger: '#E5484D',
  /** 主文字 */
  text: '#1F2329',
  /** 次级文字 */
  subText: '#6B7280',
  /** 页面背景 */
  background: '#F4F6FA',
  /** 卡片 / 输入框背景 */
  card: '#FFFFFF',
  /** 分隔线 / 边框 */
  border: '#E5E7EB',
  red:'red',
  notificationHighlight: '#FF4D4F',
} as const;
