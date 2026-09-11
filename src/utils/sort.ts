/**
 * 列表排序工具
 * 规则（PRD 4.2）：自动按时间远近排序，临近事件优先置顶。
 * 实现：按目标日期升序（日期越早到期越靠前），同一天的事件按创建时间先后稳定排列。
 */
import type { CountdownItem } from '@/types/countdown';

export function sortEventsByDate(events: CountdownItem[]): CountdownItem[] {
  return [...events].sort((a, b) => {
    // 置顶事件优先排在最前（稳定排序保证同为置顶时仍按日期排）
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    if (a.targetDate !== b.targetDate) {
      // YYYY-MM-DD 字符串可直接按字典序比较
      return a.targetDate < b.targetDate ? -1 : 1;
    }
    return a.createdAt - b.createdAt;
  });
}
