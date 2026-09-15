/**
 * 事件列表单项组件
 * 展示：事件名称 + 目标日期 + 右侧倒计时状态（剩余/今日/已过去，颜色区分）
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Switch } from 'react-native-paper';

import { COLORS } from '@/constants/theme';
import type { CountdownItem } from '@/types/countdown';
import { useNow } from '@/hooks/useNow';
import { useCountdownStore } from '@/store/useCountdownStore';
import {
  combineDateTimeKey,
  formatTimeSpan,
  getDaysDiff,
  getTimeSpan,
} from '@/utils/date';
import { formatDisplayDate } from '@/utils/lunar';



interface Props {
  item: CountdownItem;
  isTop?: boolean;
  /** 管理模式：展示置顶/通知/删除控件 */
  manageMode?: boolean;
  onPress: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onToggleNotify?: (id: string) => void;
  onDelete?: (id: string) => void;
}


export default function EventListItem({
  item,
  isTop,
  manageMode = false,
  onPress,
  onTogglePin,
  onToggleNotify,
  onDelete,
}: Props) {
  // 秒级实时刷新：共享提示器节流，卡片只在每秒跳动时重渲染
  const now = useNow();
  const showSeconds = useCountdownStore((s) => s.showSeconds);
  const targetTs = combineDateTimeKey(item.targetDate, item.targetTime);
  const span = getTimeSpan(targetTs, now);
  const label = formatTimeSpan(span, showSeconds);
  const diff = getDaysDiff(item.targetDate);
  const statusColor = diff > 0 ? COLORS.primary : diff === 0 ? COLORS.today : COLORS.past;
  

  return (
    <Card
      mode="elevated"
      style={[styles.card, item.isPinned && styles.cardPinned, isTop && styles.cardisTopBlue]}
      contentStyle={[
        manageMode ? styles.cardContentManage : styles.cardContent,
        item.isPinned && styles.cardContentPinned,
      ]}
      onPress={() => (manageMode ? undefined : onPress(item.id))}
    >
      <View style={styles.mainRow}>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            {item.isPinned && <Text style={styles.pinTag}>置顶</Text>}
            <Text style={[styles.title, item.isPinned && styles.titlePinned]} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.date}>
            {formatDisplayDate(item.targetDate, item.calendarType)} {item.targetTime}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={[
            styles.badge,
            { color: statusColor },
            showSeconds && styles.badgeWithSeconds,
            item.isPinned && styles.badgePinned,
          ]}
        >
          {label}
        </Text>
      </View>

      {manageMode && (
        <View style={styles.manageRow}>
          <View style={styles.manageItem}>
            <Text style={styles.manageLabel}>置顶</Text>
            <Switch
              value={item.isPinned}
              onValueChange={() => onTogglePin?.(item.id)}
              color={COLORS.primary}
            />
          </View>
          <View style={styles.manageItem}>
            <Text style={styles.manageLabel}>通知</Text>
            <Switch
              value={item.notifyEnabled}
              onValueChange={() => onToggleNotify?.(item.id)}
              color={COLORS.primary}
            />
          </View>
          <Button mode="text" compact textColor={COLORS.danger} onPress={() => onDelete?.(item.id)}>
            删除
          </Button>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardPinned: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  cardisTopBlue:{
    backgroundColor: COLORS.primary,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardContentManage: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardContentPinned: {
    paddingVertical: 28,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  manageItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageLabel: {
    fontSize: 13,
    color: COLORS.subText,
    marginRight: 6,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.card,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 6,
    overflow: 'hidden',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  titlePinned: {
    fontSize: 20,
    fontWeight: '700',
  },
  date: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.subText,
  },
  badge: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 8,
  },
  badgeWithSeconds: {
    fontSize: 13,
  },
  badgePinned: {
    fontSize: 24,
    fontWeight: '800',
  },
});
