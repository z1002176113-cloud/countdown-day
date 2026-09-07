/**
 * 农历日期选择器
 *  - 三个字段：年份（数字输入）、月份（下拉，闰月用「闰」前缀）、日期（下拉 1~30）
 *  - 任何变更都会转成公历 YYYY-MM-DD 通过 onChange 上报给父组件
 *  - 农历月份以带符号整数表示：负数 = 闰月（如 -6 = 闰六月）
 */
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Menu } from 'react-native-paper';

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
  // 选择器内部字段状态
  const [year, setYear] = useState(() => solarToLunarFields(initialSolarKey).year);
  const [month, setMonth] = useState(() => solarToLunarFields(initialSolarKey).month);
  const [day, setDay] = useState(() => solarToLunarFields(initialSolarKey).day);
  const [yearText, setYearText] = useState(String(year));
  const [monthMenuVisible, setMonthMenuVisible] = useState(false);
  const [dayMenuVisible, setDayMenuVisible] = useState(false);

  // 当前年份可选月份（含闰月）与当月天数
  const monthOptions = useMemo(() => getLunarMonthOptions(year), [year]);
  const dayOptions = useMemo(() => {
    const count = getLunarMonthDayCount(year, month);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [year, month]);

  const monthLabel = `${month < 0 ? '闰' : ''}${MONTH_NAMES[Math.abs(month)]}月`;

  /** 更新任意字段后，统一转换为公历并上报 */
  const commitDate = (nextYear: number, nextMonth: number, nextDay: number) => {
    onChange(lunarToSolarKey(nextYear, nextMonth, nextDay));
  };

  const handleYearCommit = () => {
    const parsed = Number.parseInt(yearText, 10);
    const clamped = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1900), 2100) : year;
    const normalizedText = String(clamped);
    setYear(clamped);
    setYearText(normalizedText);
    if (clamped !== year) {
      // 年份变化可能改变闰月与当月天数，先重置月份与日期再上报
      const options = getLunarMonthOptions(clamped);
      const firstMonth = options[0] ?? 1;
      const nextDay = Math.min(day, getLunarMonthDayCount(clamped, firstMonth));
      setMonth(firstMonth);
      setDay(nextDay);
      commitDate(clamped, firstMonth, nextDay);
    }
  };

  const handleMonthSelect = (m: number) => {
    setMonth(m);
    setMonthMenuVisible(false);
    const nextDay = Math.min(day, getLunarMonthDayCount(year, m));
    setDay(nextDay);
    commitDate(year, m, nextDay);
  };

  const handleDaySelect = (d: number) => {
    setDay(d);
    setDayMenuVisible(false);
    commitDate(year, month, d);
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
          <Text style={styles.fieldUnit}>年</Text>
        </View>

        {/* 月份：下拉 */}
        <View style={[styles.field, styles.monthField]}>
          <Menu
            visible={monthMenuVisible}
            onDismiss={() => setMonthMenuVisible(false)}
            anchor={
              <Pressable
                style={styles.menuAnchor}
                onPress={() => setMonthMenuVisible(true)}
                accessibilityRole="button"
              >
                <Text style={styles.menuAnchorText}>{monthLabel}</Text>
                <Text style={styles.menuAnchorCaret}>▾</Text>
              </Pressable>
            }
          >
            {monthOptions.map((m) => (
              <Menu.Item
                key={m}
                title={`${m < 0 ? '闰' : ''}${MONTH_NAMES[Math.abs(m)]}月`}
                onPress={() => handleMonthSelect(m)}
              />
            ))}
          </Menu>
        </View>

        {/* 日期：下拉 */}
        <View style={[styles.field, styles.dayField]}>
          <Menu
            visible={dayMenuVisible}
            onDismiss={() => setDayMenuVisible(false)}
            anchor={
              <Pressable
                style={styles.menuAnchor}
                onPress={() => setDayMenuVisible(true)}
                accessibilityRole="button"
              >
                <Text style={styles.menuAnchorText}>{String(day)}</Text>
                <Text style={styles.menuAnchorCaret}>▾</Text>
              </Pressable>
            }
          >
            {dayOptions.map((d) => (
              <Menu.Item key={d} title={String(d)} onPress={() => handleDaySelect(d)} />
            ))}
          </Menu>
        </View>
      </View>
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
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
  },
  yearField: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthField: {
    flex: 1.6,
  },
  dayField: {
    flex: 1,
    marginRight: 0,
  },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.subText,
    marginRight: 4,
  },
  yearInput: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
    paddingVertical: 0,
  },
  fieldUnit: {
    fontSize: 14,
    color: COLORS.subText,
    marginTop: 1,
  },
  menuAnchor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAnchorText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '600',
  },
  menuAnchorCaret: {
    fontSize: 14,
    color: COLORS.subText,
    marginLeft: 4,
    marginTop: 1,
  },
});