/**
 * 事件列表单项组件
 * 展示：事件名称 + 目标日期 + 右侧倒计时状态（剩余/今日/已过去，颜色区分）
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from 'react-native-paper';

import { COLORS } from '@/constants/theme';
import type { CountdownItem } from '@/types/countdown';
import { formatCountdownLabel, getDaysDiff } from '@/utils/date';
import { formatDisplayDate } from '@/utils/lunar';

interface Props {
  item: CountdownItem;
  /** 点击事件（进入编辑页） */
  onPress: (id: string) => void;
}

export default function EventListItem({ item, onPress }: Props) {
  const diff = getDaysDiff(item.targetDate);
  const label = formatCountdownLabel(diff);
  const statusColor = diff > 0 ? COLORS.primary : diff === 0 ? COLORS.today : COLORS.past;

  return (
    <Card
      mode="elevated"
      style={[styles.card, item.isPinned && styles.cardPinned]}
      contentStyle={[styles.cardContent, item.isPinned && styles.cardContentPinned]}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.info}>
        <View style={styles.titleRow}>
          {item.isPinned && <Text style={styles.pinTag}>置顶</Text>}
          <Text style={[styles.title, item.isPinned && styles.titlePinned]} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <Text style={styles.date}>
          {formatDisplayDate(item.targetDate, item.calendarType)}
        </Text>
      </View>
      <Text
        style={[
          styles.badge,
          { color: statusColor },
          item.isPinned && styles.badgePinned,
        ]}
      >
        {label}
      </Text>
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cardContentPinned: {
    paddingVertical: 28,
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
  },
  badgePinned: {
    fontSize: 24,
    fontWeight: '800',
  },
});
