/**
 * 新增 / 编辑共用的表单组件
 *  - 事件名称输入框（必填，为空拦截提交，见验收项 33）
 *  - 目标日期选择（Android 原生对话框 / iOS 底部弹出选择器）
 *  - 提交按钮；编辑页额外展示「删除」按钮
 */
import React, { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, HelperText, SegmentedButtons, TextInput } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';
import type { CalendarType, EventFormValues } from '@/types/countdown';
import { getTodayKey, getWeekdayLabel, parseDateKey, toDateKey } from '@/utils/date';
import { formatDisplayDate } from '@/utils/lunar';
import LunarDatePicker from '@/components/LunarDatePicker';

interface Props {
  /** 编辑回填：事件名称 */
  initialTitle?: string;
  /** 编辑回填：目标日期（YYYY-MM-DD），默认今天 */
  initialTargetDate?: string;
  /** 编辑回填：历法类型，默认公历 */
  initialCalendarType?: CalendarType;
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
  submitLabel,
  onSubmit,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [dateKey, setDateKey] = useState(initialTargetDate ?? getTodayKey());
  const [calendarType, setCalendarType] = useState<CalendarType>(initialCalendarType);
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

  /** Android：原生对话框选择后自动收起；iOS：记录当前值，点「完成」确认 */
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

  const handleSubmit = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError(true);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ title: trimmed, targetDate: dateKey, calendarType });
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
          <Text style={styles.tip}>到目标日期当天会收到本地通知提醒（需授权通知权限）</Text>

          {/* 修复点①：单一条件渲染总开关，pickerVisible 为 true 才渲染；平台差异在开关内部选形态 */}
          {pickerVisible &&
        (Platform.OS === 'ios' ? (
          /* iOS：底部弹层 + spinner，点「完成」确认 */
          <Modal
            visible={pickerVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setPickerVisible(false)}
          >
            <Pressable style={styles.modalMask} onPress={() => setPickerVisible(false)}>
              <Pressable style={[styles.modalSheet, { paddingBottom: insets.bottom + 24 }]}>
                {/* iOS spinner 需固定尺寸：Fabric 新架构下原生 UIDatePicker 内在尺寸会算成 0，
                    必须在组件自身 style 上显式给定宽高；themeVariant 强制亮色防止暗色下文字隐形 */}
                <View style={styles.pickerContainer}>
                  <DateTimePicker
                    value={pickerDate}
                    mode="date"
                    display="spinner"
                    locale="zh-CN"
                    themeVariant="light"
                    textColor={COLORS.text}
                    style={styles.iosPicker}
                    onChange={handlePickerChange}
                  />
                  {/* 实时星期几：随 spinner 滚动联动，滚动即预览 */}
                  <Text style={styles.iosWeekday}>{getWeekdayLabel(toDateKey(pickerDate))}</Text>
                </View>
                <View style={styles.modalButtons}>
                  <Button onPress={() => setPickerVisible(false)}>取消</Button>
                  <Button mode="contained" onPress={handlePickerConfirm}>
                    完成
                  </Button>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
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
  tip: {
    marginTop: 6,
    marginBottom: 20,
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
  modalMask: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  pickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosWeekday: {
    marginTop: 4,
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  iosPicker: {
    width: '100%',
    height: 216,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
});
