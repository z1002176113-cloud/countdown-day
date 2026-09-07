/**
 * 通用底部选择弹层
 * 以 Modal 底部弹层展示一列或多列可滚动的选项，点选高亮、点「完成」确认、点「取消」收起。
 * 相比 Paper Menu 下拉：Modal 层始终浮在键盘/内容之上，iOS/Android 展开闭合稳定；
 * 所有文字均为自绘中文，不依赖系统原生控件的语言（如 iOS UIDatePicker 的语言跟随系统，不可靠）。
 */
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/constants/theme';

export interface PickerSheetColumn {
  /** 列唯一标识，如 'year' / 'month' / 'day' */
  key: string;
  /** 列标题，如「年」「月」「日」 */
  label: string;
  /** 可选项列表 */
  options: { value: number; label: string }[];
  /** 当前选中值 */
  selected: number;
}

interface Props {
  visible: boolean;
  /** 弹层标题 */
  title: string;
  /** 标题下的副文字（如实时星期几预览） */
  subtitle?: string;
  columns: PickerSheetColumn[];
  /** 点选某列某个值（父组件负责更新选中值并联动，如钳制日期） */
  onSelectColumn: (columnKey: string, value: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function PickerSheet({
  visible,
  title,
  subtitle,
  columns,
  onSelectColumn,
  onCancel,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.mask} onPress={onCancel}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle != null && subtitle !== '' ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}
          </View>

          <View style={styles.columns}>
            {columns.map((col) => (
              <View key={col.key} style={styles.column}>
                <Text style={styles.columnLabel}>{col.label}</Text>
                <ScrollView
                  style={styles.columnScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {col.options.map((opt) => {
                    const active = opt.value === col.selected;
                    return (
                      <Pressable
                        key={opt.value}
                        style={[styles.optionRow, active && styles.optionRowActive]}
                        onPress={() => onSelectColumn(col.key, opt.value)}
                      >
                        <Text style={[styles.optionText, active && styles.optionTextActive]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </View>

          <View style={styles.buttons}>
            <Button onPress={onCancel}>取消</Button>
            <Button mode="contained" onPress={onConfirm}>
              完成
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  columns: {
    flexDirection: 'row',
    marginTop: 4,
  },
  column: {
    flex: 1,
    marginHorizontal: 4,
  },
  columnLabel: {
    fontSize: 12,
    color: COLORS.subText,
    textAlign: 'center',
    marginBottom: 4,
  },
  columnScroll: {
    height: 240,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  optionRow: {
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  optionRowActive: {
    backgroundColor: 'rgba(90, 113, 240, 0.12)',
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  optionTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
});