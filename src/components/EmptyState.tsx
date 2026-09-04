/**
 * 首页空状态占位组件：没有任何事件时友好引导，避免白屏 / 空列表报错
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from 'react-native-paper';

import { COLORS } from '@/constants/theme';

interface Props {
  /** 点击「新增事件」按钮的回调 */
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>还没有任何事件</Text>
      <Text style={styles.desc}>
        点击下方按钮，添加第一个倒数事件{'\n'}
        例如考试、纪念日、发工资
      </Text>
      <Button
        mode="contained"
        textColor="#FFFFFF"
        style={styles.button}
        contentStyle={styles.buttonContent}
        onPress={onAdd}
      >
        新增事件
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    color: COLORS.subText,
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
  },
  buttonContent: {
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
});
