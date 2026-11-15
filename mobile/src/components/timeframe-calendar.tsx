// Month calendar inside the timeframe popup

import { Image } from 'expo-image';
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, MapOverlayColors, Spacing } from '@/constants/theme';
import { startOfDay } from '@/lib/timeframe';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });

type TimeframeCalendarProps = {
  start: Date | null;
  end: Date | null;
  initialMonth: Date;
  onSelect: (date: Date) => void;
};

const sameDay = (a: Date | null, b: Date) => a !== null && a.getTime() === b.getTime();

function monthCells(month: Date): (Date | null)[] {
  const year = month.getFullYear();
  const index = month.getMonth();
  const leading = new Date(year, index, 1).getDay();
  const days = new Date(year, index + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= days; day += 1) cells.push(new Date(year, index, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function useFollowDate(date: Date | null, setMonth: Dispatch<SetStateAction<Date>>) {
  const key = date?.getTime() ?? null;
  const prevKey = useRef(key);

  useEffect(() => {
    if (key === prevKey.current) return;
    prevKey.current = key;
    if (!date) return;
    setMonth((m) =>
      m.getFullYear() === date.getFullYear() && m.getMonth() === date.getMonth()
        ? m
        : new Date(date.getFullYear(), date.getMonth(), 1),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export function TimeframeCalendar({ start, end, initialMonth, onSelect }: TimeframeCalendarProps) {
  const [month, setMonth] = useState(() => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));

  useFollowDate(start, setMonth);
  useFollowDate(end, setMonth); 

  const shiftMonth = (delta: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));

  const cells = monthCells(month);
  const rows = Array.from({ length: cells.length / 7 }, (_, row) => cells.slice(row * 7, row * 7 + 7));

  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={Spacing.two} accessibilityLabel="Previous month">
          <View style={styles.arrowLeft}>
            <Image source={require('@/assets/images/mapIcons/arrow-down.svg')} style={styles.arrow} />
          </View>
        </Pressable>
        <Text style={styles.month}>{MONTH_FORMAT.format(month)}</Text>
        <Pressable onPress={() => shiftMonth(1)} hitSlop={Spacing.two} accessibilityLabel="Next month">
          <View style={styles.arrowRight}>
            <Image source={require('@/assets/images/mapIcons/arrow-down.svg')} style={styles.arrow} />
          </View>
        </Pressable>
      </View>

      <View style={styles.week}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={[styles.cell, styles.weekday]}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.days}>
        {rows.map((row, i) => (
          <View key={i} style={styles.week}>
            {row.map((date, j) => {
              if (!date) return <View key={j} style={styles.cell} />;
              const day = startOfDay(date);
              const isStart = sameDay(start, day);
              const isEnd = sameDay(end, day);
              const selected = isStart || isEnd;
              const hasRange = start !== null && end !== null && end > start;
              const inRange = hasRange && day > start && day < end;
              return (
                <Pressable
                  key={j}
                  style={styles.cell}
                  onPress={() => onSelect(day)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={day.toDateString()}>
                  {/* The band runs from the middle of the start day to the middle of the end day. */}
                  {hasRange && (inRange || isStart || isEnd) && (
                    <View style={[styles.band, isStart && styles.bandFromMiddle, isEnd && styles.bandToMiddle]} />
                  )}
                  <View style={[styles.day, selected && styles.daySelected]}>
                    <Text style={styles.dayText}>{day.getDate()}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    gap: Spacing.two,
    padding: Spacing.seven,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: MapOverlayColors.searchPlaceholder,
    backgroundColor: MapOverlayColors.chipInactive,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  month: { fontFamily: FontFamily.regular, fontSize: 14, color: MapOverlayColors.inputText },
  arrow: { width: 16, height: 16 },
  arrowLeft: { transform: [{ rotate: '90deg' }] },
  arrowRight: { transform: [{ rotate: '-90deg' }] },
  days: { gap: Spacing.one },
  week: { flexDirection: 'row' },
  cell: { flex: 1, height: 28, alignItems: 'center', justifyContent: 'center' },
  weekday: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: MapOverlayColors.subtle,
    textAlign: 'center',
  },
  day: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  daySelected: { backgroundColor: MapOverlayColors.secondary },
  band: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: MapOverlayColors.rangeBand },
  bandFromMiddle: { left: '50%' },
  bandToMiddle: { right: '50%' },
  dayText: { fontFamily: FontFamily.regular, fontSize: 12, color: MapOverlayColors.bodySubtle },
});
