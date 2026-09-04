/**
 * 事件列表单项组件
 * 展示：事件名称 + 目标日期 + 右侧倒计时状态（剩余/今日/已过去，颜色区分）
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from 'react-native-paper';

import { COLORS } from '../constants/theme';
import type { CountdownItem } from '../types/countdown';
import { formatCountdownLabel, formatDateKey, getDaysDiff } from '../utils/date';

interface Props {
  item: CountdownItem;
  /** 点击事件（进入编辑页） */
  onPress: (id: string) => void;
}

export default function EventListItem({ item, onPress }: Props) {
  const diff = getDaysDiff(item.targetDate);
  const label = formatCountdownLabel(diff);
  const statusColor =
    diff > 0 ? COLORS.primary : diff === 0 ? COLORS.today : COLORS.past;

  return (
    <Card
      mode="elevated"
      style={styles.card}
      contentStyle={styles.cardContent}
      onPress={() => onPress(item.id)}
    >
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.date}>{formatDateKey(item.targetDate)}</Text>
      </View>
      <Text style={[styles.badge, { color: statusColor }]}>{label}</Text>
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
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
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
});
