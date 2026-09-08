/**
 * 新增 / 编辑共用的表单组件
 *  - 事件名称输入框（必填，为空拦截提交，见验收项 33）
 *  - 目标日期选择（Android 原生对话框 / iOS 底部弹出选择器）
 *  - 提交按钮；编辑页额外展示「删除」按钮
 */
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, Switch, TextInput } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PickerSheet, { PickerSheetColumn } from '@/components/PickerSheet';
import { COLORS } from '@/constants/theme';
import type { CalendarType, EventFormValues } from '@/types/countdown';
import { getTodayKey, getWeekdayLabel, parseDateKey, toDateKey } from '@/utils/date';
import { formatDisplayDate } from '@/utils/lunar';
import LunarDatePicker from '@/components/LunarDatePicker';

/** 公历可选的年份区间（与农历一致，覆盖绝大多数生日/纪念日/远期事件） */
const SOLAR_MIN_YEAR = 1900;
const SOLAR_MAX_YEAR = 2100;
const YEAR_OPTIONS = Array.from({ length: SOLAR_MAX_YEAR - SOLAR_MIN_YEAR + 1 }, (_, i) => ({
  value: SOLAR_MIN_YEAR + i,
  label: String(SOLAR_MIN_YEAR + i),
}));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}月`,
}));

interface Props {
  /** 编辑回填：事件名称 */
  initialTitle?: string;
  /** 编辑回填：目标日期（YYYY-MM-DD），默认今天 */
  initialTargetDate?: string;
  /** 编辑回填：历法类型，默认公历 */
  initialCalendarType?: CalendarType;
  /** 编辑回填：是否启用到期提醒，默认识别 */
  initialNotify?: boolean;
  /** 提交按钮文案，如「保存」「保存修改」 */
  submitLabel: string;
  /** 提交回调：由页面负责写入 store 并跳转 */
  onSubmit: (values: EventFormValues) => Promise<void> | void;
  /** 删除回调：仅编辑页传入，传入时显示删除按钮 */
  onDelete?: () => void;
}

export default function EventForm({
  initialTitle = '',
  initialTargetDate,
  initialCalendarType = 'solar',
  initialNotify = true,
  submitLabel,
  onSubmit,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [dateKey, setDateKey] = useState(initialTargetDate ?? getTodayKey());
  const [calendarType, setCalendarType] = useState<CalendarType>(initialCalendarType);
  const [notifyEnabled, setNotifyEnabled] = useState(initialNotify);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerDate, setPickerDate] = useState(() => parseDateKey(dateKey));
  const [titleError, setTitleError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // 底部安全区（iOS 底部 home indicator），用于滚动内容与弹层底部留白
  const insets = useSafeAreaInsets();

  const handleTitleChange = (text: string) => {
    setTitle(text);
    if (text.trim()) {
      setTitleError(false);
    }
  };

  /** Android：原生对话框选择后自动收起（iOS 公历已改用自建 PickerSheet） */
  const handlePickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    // 修复点②：Android 返回键/取消选择时（dismissed）也关闭弹窗
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setPickerVisible(false);
      return;
    }
    if (event.type === 'set' && selected) {
      setPickerDate(selected);
      if (Platform.OS === 'android') {
        setDateKey(toDateKey(selected));
        // 修复点③：onChange 选中日期后自动关闭弹窗
        setPickerVisible(false);
      }
    }
  };

  const handlePickerConfirm = () => {
    setDateKey(toDateKey(pickerDate));
    setPickerVisible(false);
  };

  // iOS 公历选择弹层的三列数据：年 / 月 / 日（日选项按当月天数动态生成）
  const daysInMonth = new Date(pickerDate.getFullYear(), pickerDate.getMonth() + 1, 0).getDate();
  const DAY_OPTIONS = Array.from({ length: daysInMonth }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}日`,
  }));
  const solarColumns: PickerSheetColumn[] = [
    { key: 'year', label: '年', options: YEAR_OPTIONS, selected: pickerDate.getFullYear() },
    { key: 'month', label: '月', options: MONTH_OPTIONS, selected: pickerDate.getMonth() + 1 },
    { key: 'day', label: '日', options: DAY_OPTIONS, selected: pickerDate.getDate() },
  ];

  /** 点选某列：更新 pickerDate，并钳制日期不超过当月最大天数（如 2 月没有 30 日） */
  const handleSolarColumnSelect = (columnKey: string, value: number) => {
    let y = pickerDate.getFullYear();
    let m = pickerDate.getMonth() + 1;
    let d = pickerDate.getDate();
    if (columnKey === 'year') {
      y = value;
    } else if (columnKey === 'month') {
      m = value;
    } else {
      d = value;
    }
    d = Math.min(d, new Date(y, m, 0).getDate());
    setPickerDate(new Date(y, m - 1, d));
  };

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(true);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ title: trimmed, targetDate: dateKey, calendarType, notifyEnabled });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      

      <View style={styles.calendarSwitch}>
        <SegmentedButtons
          value={calendarType}
          onValueChange={(v) => setCalendarType(v as CalendarType)}
          buttons={[
            { value: 'solar', label: '公历' },
            { value: 'lunar', label: '农历' },
          ]}
        />
      </View>

      {calendarType === 'lunar' ? (
        /* 农历：内联三字段选择器（年输入 + 月份/日期下拉），变更即联动公历 */
        <View style={styles.lunarArea}>
          <Text style={styles.dateLabel}>目标日期（农历）</Text>
          <LunarDatePicker initialSolarKey={dateKey} onChange={setDateKey} />
          <Text style={styles.lunarPreview}>{formatDisplayDate(dateKey, 'lunar')}</Text>
        </View>
      ) : (
        <>
          <Pressable
            style={({ pressed }) => [styles.dateField, pressed && styles.dateFieldPressed]}
            onPress={() => setPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="选择目标日期"
          >
            <View>
              <Text style={styles.dateLabel}>目标日期（公历）</Text>
              <Text style={styles.dateValue}>{formatDisplayDate(dateKey, 'solar')}</Text>
            </View>
            <Text style={styles.dateAction}>选择</Text>
          </Pressable>

          {/* 修复点①：单一条件渲染总开关，pickerVisible 为 true 才渲染；平台差异在开关内部选形态 */}
          {pickerVisible &&
        (Platform.OS === 'ios' ? (
          /* iOS：自建中文年月日弹层（原生 UIDatePicker 语言跟随系统不可控，故自绘保证中文 + 实时星期几） */
          <PickerSheet
            visible={pickerVisible}
            title="选择日期（公历）"
            subtitle={getWeekdayLabel(toDateKey(pickerDate))}
            columns={solarColumns}
            onSelectColumn={handleSolarColumnSelect}
            onCancel={() => setPickerVisible(false)}
            onConfirm={handlePickerConfirm}
          />
        ) : Platform.OS === 'web' ? (
          /* Web：库不支持 web，改用浏览器原生 <input type="date">，选中后更新 dateKey 并关闭 */
          <input
            type="date"
            defaultValue={dateKey}
            onChange={(e) => {
              const value = (e.target as HTMLInputElement).value;
              if (value) {
                setDateKey(value);
              }
              // 无论是否被 Delete/清空按钮清空（value === ''），都要关闭弹窗，
              // 否则按删除键后弹窗会一直卡住不关闭
              setPickerVisible(false);
            }}
          />

        ) : (
          /* Android：原生对话框，选中后经 onChange 自动关闭 */
          <DateTimePicker value={pickerDate} mode="date" onChange={handlePickerChange} />
        ))}
        </>
      )}

      <View style={styles.notifyRow}>
        <View style={styles.notifyInfo}>
          <Text style={styles.notifyLabel}>到期通知提醒</Text>
          <Text style={styles.notifyDesc}>
            {notifyEnabled ? '到目标日期当天会收到系统通知' : '已关闭，不会收到该事件的提醒'}
          </Text>
        </View>
        <Switch value={notifyEnabled} onValueChange={setNotifyEnabled} color={COLORS.primary} />
      </View>

      <TextInput
        mode="outlined"
        label="事件名称"
        placeholder="例如：考研、发工资、纪念日"
        maxLength={50}
        value={title}
        onChangeText={handleTitleChange}
        error={titleError}
        style={styles.input}
      />
      <HelperText type="error" visible={titleError}>
        请输入事件名称
      </HelperText>

      <Button
        mode="contained"
        textColor="#FFFFFF"
        loading={submitting}
        disabled={submitting}
        style={[styles.submit, { backgroundColor: COLORS.primary }]}
        contentStyle={styles.submitContent}
        onPress={handleSubmit}
      >
        {submitLabel}
      </Button>

      {onDelete && (
        <Button mode="text" textColor={COLORS.danger} style={styles.delete} onPress={onDelete}>
          删除该事件
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  calendarSwitch: {
    marginTop: 4,
    marginBottom: 12,
  },
  lunarArea: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  lunarPreview: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  input: {
    backgroundColor: COLORS.card,
  },
  dateField: {
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
  dateFieldPressed: {
    opacity: 0.7,
  },
  dateLabel: {
    fontSize: 12,
    color: COLORS.subText,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 16,
    color: COLORS.text,
  },
  dateAction: {
    fontSize: 14,
    color: COLORS.primary,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  notifyInfo: {
    flexShrink: 1,
    marginRight: 12,
  },
  notifyLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  notifyDesc: {
    fontSize: 12,
    color: COLORS.subText,
  },
  submit: {
    borderRadius: 24,
    marginTop: 8,
  },
  submitContent: {
    paddingVertical: 6,
  },
  delete: {
    marginTop: 8,
    alignSelf: 'center',
  },
});
