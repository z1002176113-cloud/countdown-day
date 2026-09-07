/**
 * 农历日期选择器
 *  - 年份：数字输入（4 位，1900~2100，失焦提交并钳制）
 *  - 月份 / 日期：点击字段弹出底部选择弹层（PickerSheet），支持闰月
 *  - 任何变更都会转成公历 YYYY-MM-DD 通过 onChange 上报给父组件
 *  - 农历月份以带符号整数表示：负数 = 闰月（如 -6 = 闰六月初，见 utils/lunar.ts）
 */
import React, { useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import PickerSheet, { PickerSheetColumn } from '@/components/PickerSheet';
import { COLORS } from '@/constants/theme';
import {
  getLunarMonthDayCount,
  getLunarMonthOptions,
  lunarToSolarKey,
  solarToLunarFields,
} from '@/utils/lunar';

const MONTH_NAMES = ['', '正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

interface Props {
  /** 初始公历日期 YYYY-MM-DD（作为农历字段的默认值） */
  initialSolarKey: string;
  /** 变更后回调，参数为对应的公历 YYYY-MM-DD */
  onChange: (solarKey: string) => void;
}

export default function LunarDatePicker({ initialSolarKey, onChange }: Props) {
  const [year, setYear] = useState(() => solarToLunarFields(initialSolarKey).year);
  const [month, setMonth] = useState(() => solarToLunarFields(initialSolarKey).month);
  const [day, setDay] = useState(() => solarToLunarFields(initialSolarKey).day);
  const [yearText, setYearText] = useState(String(year));
  const [monthSheetVisible, setMonthSheetVisible] = useState(false);
  const [daySheetVisible, setDaySheetVisible] = useState(false);

  const monthOptions = useMemo(() => getLunarMonthOptions(year), [year]);
  const dayCount = useMemo(() => getLunarMonthDayCount(year, month), [year, month]);

  const monthLabel = `${month < 0 ? '闰' : ''}${MONTH_NAMES[Math.abs(month)]}月`;

  const commitDate = (nextYear: number, nextMonth: number, nextDay: number) => {
    onChange(lunarToSolarKey(nextYear, nextMonth, nextDay));
  };

  /** 年份失焦/提交：钳制到有效范围；年份变化可能改变闰月与当月天数，重置并联动 */
  const handleYearCommit = () => {
    const parsed = Number.parseInt(yearText, 10);
    const clamped = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1900), 2100) : year;
    const normalizedText = String(clamped);
    setYear(clamped);
    setYearText(normalizedText);
    if (clamped !== year) {
      const firstMonth = getLunarMonthOptions(clamped)[0] ?? 1;
      const nextDay = Math.min(day, getLunarMonthDayCount(clamped, firstMonth));
      setMonth(firstMonth);
      setDay(nextDay);
      commitDate(clamped, firstMonth, nextDay);
    }
  };

  const monthColumn: PickerSheetColumn = {
    key: 'month',
    label: '月份',
    options: monthOptions.map((m) => ({
      value: m,
      label: `${m < 0 ? '闰' : ''}${MONTH_NAMES[Math.abs(m)]}月`,
    })),
    selected: month,
  };

  const dayColumn: PickerSheetColumn = {
    key: 'day',
    label: '日期',
    options: Array.from({ length: dayCount }, (_, i) => ({
      value: i + 1,
      label: String(i + 1),
    })),
    selected: day,
  };

  const handleMonthSelect = (_key: string, value: number) => {
    setMonth(value);
    const nextDay = Math.min(day, getLunarMonthDayCount(year, value));
    setDay(nextDay);
    commitDate(year, value, nextDay);
  };

  const handleDaySelect = (_key: string, value: number) => {
    setDay(value);
    commitDate(year, month, value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* 年份：数字输入 */}
        <View style={[styles.field, styles.yearField]}>
          <Text style={styles.fieldLabel}>年</Text>
          <TextInput
            value={yearText}
            onChangeText={(t) => setYearText(t.replace(/\D/g, '').slice(0, 4))}
            onBlur={handleYearCommit}
            onSubmitEditing={handleYearCommit}
            keyboardType="number-pad"
            maxLength={4}
            selectTextOnFocus
            style={styles.yearInput}
          />
        </View>

        {/* 月份：弹出选择 */}
        <Pressable
          style={styles.field}
          onPress={() => {
            Keyboard.dismiss();
            setMonthSheetVisible(true);
          }}
        >
          <Text style={styles.fieldLabel}>月</Text>
          <Text style={styles.fieldValue}>{monthLabel}</Text>
        </Pressable>

        {/* 日期：弹出选择 */}
        <Pressable
          style={styles.field}
          onPress={() => {
            Keyboard.dismiss();
            setDaySheetVisible(true);
          }}
        >
          <Text style={styles.fieldLabel}>日</Text>
          <Text style={styles.fieldValue}>{String(day)}</Text>
        </Pressable>
      </View>

      <PickerSheet
        visible={monthSheetVisible}
        title="选择农历月份"
        columns={[monthColumn]}
        onSelectColumn={handleMonthSelect}
        onCancel={() => setMonthSheetVisible(false)}
        onConfirm={() => setMonthSheetVisible(false)}
      />
      <PickerSheet
        visible={daySheetVisible}
        title="选择农历日期"
        columns={[dayColumn]}
        onSelectColumn={handleDaySelect}
        onCancel={() => setDaySheetVisible(false)}
        onConfirm={() => setDaySheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  yearField: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.subText,
    marginRight: 6,
  },
  yearInput: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    paddingVertical: 0,
  },
  fieldValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
});