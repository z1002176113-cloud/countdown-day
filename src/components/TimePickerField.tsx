/**
 * 跨平台时刻选择器（HH:mm，24 小时制）
 *  - iOS：自建 PickerSheet 两列（时/分）
 *  - Android：原生 DateTimePicker（mode="time"）
 *  - Web：浏览器原生 <input type="time">
 * 与日期选择器同一套交互模式：点击字段弹出、选中后回传 HH:mm 给父组件。
 */
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import PickerSheet, { PickerSheetColumn } from '@/components/PickerSheet';
import { COLORS } from '@/constants/theme';
import { parseTimeKey } from '@/utils/date';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({ value: i, label: `${i}时` }));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({ value: i, label: `${i}分` }));

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toTimeKey(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

interface Props {
  /** 字段展示标签，如「目标时刻」「提醒时间」 */
  label: string;
  /** 当前值 HH:mm */
  value: string;
  onChange: (timeKey: string) => void;
}

export default function TimePickerField({ label, value, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const { hour, minute } = parseTimeKey(value);

  const handleNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setVisible(false);
      return;
    }
    if (event.type === 'set' && selected) {
      onChange(toTimeKey(selected));
      setVisible(false);
    }
  };

  const timeColumns: PickerSheetColumn[] = [
    { key: 'hour', label: '时', options: HOUR_OPTIONS, selected: hour },
    { key: 'minute', label: '分', options: MINUTE_OPTIONS, selected: minute },
  ];

  const handleColumnSelect = (columnKey: string, selectedValue: number) => {
    const nextHour = columnKey === 'hour' ? selectedValue : hour;
    const nextMinute = columnKey === 'minute' ? selectedValue : minute;
    onChange(`${pad2(nextHour)}:${pad2(nextMinute)}`);
  };

  return (
    <View>
      <Pressable
        style={({ pressed }) => [styles.field, pressed && styles.fieldPressed]}
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`选择${label}`}
      >
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
        <Text style={styles.action}>选择</Text>
      </Pressable>

      {visible &&
        (Platform.OS === 'ios' ? (
          <PickerSheet
            visible={visible}
            title={`选择${label}`}
            columns={timeColumns}
            onSelectColumn={handleColumnSelect}
            onCancel={() => setVisible(false)}
            onConfirm={() => setVisible(false)}
          />
        ) : Platform.OS === 'web' ? (
          <input
            type="time"
            defaultValue={value}
            onChange={(e) => {
              const next = (e.target as HTMLInputElement).value;
              if (next) {
                onChange(next);
              }
              setVisible(false);
            }}
          />
        ) : (
          <DateTimePicker value={new Date(2000, 0, 1, hour, minute)} mode="time" onChange={handleNativeChange} />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  fieldPressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 12,
    color: COLORS.subText,
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: COLORS.text,
  },
  action: {
    fontSize: 14,
    color: COLORS.primary,
  },
});