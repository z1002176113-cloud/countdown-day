/**
 * 设置页
 * 当前包含「倒计时是否展示秒位」一个全局开关，后续可继续扩展。
 */
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Switch } from 'react-native-paper';

import { COLORS } from '@/constants/theme';
import { useCountdownStore } from '@/store/useCountdownStore';

export default function SettingsScreen() {
  const showSeconds = useCountdownStore((s) => s.showSeconds);
  const setShowSeconds = useCountdownStore((s) => s.setShowSeconds);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.label}>倒计时展示秒数</Text>
            <Text style={styles.desc}>开启后卡片实时显示「天 时 分 秒」</Text>
          </View>
          <Switch value={showSeconds} onValueChange={setShowSeconds} color={COLORS.primary} />
        </View>
      </View>

      <Text style={styles.hint}>关闭「秒数」后，卡片仍实时计时，只是展示到「分」为止。</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  info: {
    flexShrink: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  desc: {
    fontSize: 12,
    color: COLORS.subText,
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.subText,
    lineHeight: 18,
  },
});