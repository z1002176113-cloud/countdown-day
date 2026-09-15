/**
 * useNow：秒级「当前时间」Hook
 * 整个应用共享一个全局 setInterval（首个订阅者启动），
 * 避免每张卡片各自开定时器造成资源浪费。
 */
import { useEffect, useState } from 'react';

let lastNow = Date.now();
let tickerStarted = false;
const listeners = new Set<(now: number) => void>();

function ensureTicker(): void {
  if (tickerStarted) {
    return;
  }
  tickerStarted = true;
  setInterval(() => {
    lastNow = Date.now();
    listeners.forEach((listener) => listener(lastNow));
  }, 1000);
}

export function useNow(): number {
  const [now, setNow] = useState(lastNow);

  useEffect(() => {
    ensureTicker();
    listeners.add(setNow);
    return () => {
      listeners.delete(setNow);
    };
  }, []);

  return now;
}