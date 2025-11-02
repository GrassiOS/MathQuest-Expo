import { FadeInView } from '@/components/shared/FadeInView';
import { useFontContext } from '@/contexts/FontsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { CaretLeft, CaretRight, Fire, X } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function StreakModal({ visible, onClose }: Props) {
  const { fontsLoaded } = useFontContext();
  const insets = useSafeAreaInsets();

  const ACCENT = '#c948ff';
  const BG = '#2d2438';
  const MUTED = '#7f768e';
  const TOP_BG = '#3d3447';

  // Retrigger FadeInView animations each time the modal opens
  const [openCycle, setOpenCycle] = useState(0);
  
  const [viewDate, setViewDate] = useState(new Date());
  const [streakCount, setStreakCount] = useState(0);
  const [highlightedDates, setHighlightedDates] = useState<Set<string>>(new Set());

  const PLAY_DAYS_STORAGE_KEY = 'infiniteGamePlayDays';

  const toISODate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const computeCurrentStreak = (dates: string[], today: Date = new Date()) => {
    const set = new Set(dates);
    let count = 0;
    const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    while (set.has(toISODate(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  };

  const loadData = async () => {
    try {
      const raw = await AsyncStorage.getItem(PLAY_DAYS_STORAGE_KEY);
      const days: string[] = raw ? JSON.parse(raw) : [];
      setHighlightedDates(new Set(days));
      setStreakCount(computeCurrentStreak(days));
      setViewDate(new Date());
    } catch (e) {
      console.error('Failed to load play days', e);
    }
  };

  useEffect(() => {
    if (visible) {
      setOpenCycle((c) => c + 1);
      loadData();
    }
  }, [visible]);

  const SPANISH_MONTHS = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
  const DAYS = ['D','L','M','M','J','V','S'];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const label = `${SPANISH_MONTHS[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7; // complete weeks

  const previousMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isHighlighted = (d: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const key = `${year}-${mm}-${dd}`;
    return highlightedDates.has(key);
  };

  const isTodayHighlighted = (d: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.fullscreen,
          {
            backgroundColor: BG,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
        ]}
      >
        {/* Top section (lighter) with X button on top-left */}
        <View style={[styles.topSection, { backgroundColor: TOP_BG }]}>
          <FadeInView key={`oc-${openCycle}-close`} style={[styles.absoluteRow, { left: 20 }]} pointerEvents="box-none" delay={0}>
            <Pressable
              onPress={onClose}
              style={styles.closePill}
              hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}
            >
              <X size={20} color="#fff" weight="bold" />
            </Pressable>
          </FadeInView>

          <FadeInView key={`oc-${openCycle}-header`} style={styles.header} delay={80}>
            <Text style={[styles.headerTitle, { fontFamily: 'Digitalt' }]}>RACHAS</Text>
            <Text style={[styles.headerSubtitle, { fontFamily: 'Gilroy-Black' }]}>
              Modo Infinito
            </Text>
          </FadeInView>

          <FadeInView key={`oc-${openCycle}-streak`} style={styles.streakRow} delay={160}>
            <View>
              <Text style={[styles.streakNumber, { fontFamily: 'Digitalt' }]}>
                {streakCount}
              </Text>
              <Text
                style={[
                  styles.streakLabel,
                  { fontFamily: 'Gilroy-Black', color: MUTED },
                ]}
              >
                Días de racha
              </Text>
            </View>
            <LinearGradient colors={[ACCENT, '#7a4bff']} style={styles.flameBadge}>
              <Fire size={52} color="#2d2438" weight="fill" />
            </LinearGradient>
          </FadeInView>
        </View>

        {/* Bottom section (darker) */}
        <View style={styles.calendarSection}>
          <FadeInView key={`oc-${openCycle}-calhdr`} style={styles.calendarHeader} delay={240}>
            <Pressable onPress={previousMonth} style={styles.monthArrow} hitSlop={10}>
              <CaretLeft size={18} color="#fff" weight="bold" />
            </Pressable>
            <Text style={[styles.monthLabel, { fontFamily: 'Gilroy-Black' }]}>{label}</Text>
            <Pressable onPress={nextMonth} style={styles.monthArrow} hitSlop={10}>
              <CaretRight size={18} color="#fff" weight="bold" />
            </Pressable>
          </FadeInView>

          <FadeInView key={`oc-${openCycle}-days`} style={styles.daysRow} delay={300}>
            {DAYS.map((d, i) => (
              <Text
                key={`${d}-${i}`}
                style={[
                  styles.dayAbbrev,
                  { fontFamily: 'Gilroy-Black', color: MUTED },
                ]}
              >
                {d}
              </Text>
            ))}
          </FadeInView>

          <FadeInView key={`oc-${openCycle}-grid`} style={styles.grid} delay={360}>
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - firstDay + 1;
              const within = dayNum >= 1 && dayNum <= daysInMonth;
              if (!within) return <View key={i} style={styles.cell} />;

              const highlighted = isHighlighted(dayNum);
              const today = isTodayHighlighted(dayNum);

              return (
                <View key={i} style={styles.cell}>
                  <View
                    style={[
                      styles.dayBubble,
                      highlighted && { backgroundColor: ACCENT },
                      today && { borderWidth: 2, borderColor: '#fff' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        { fontFamily: 'Gilroy-Black' },
                        highlighted ? styles.dayTextOn : { color: '#c7c4cf' },
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </View>
                </View>
              );
            })}
          </FadeInView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
  },
  absoluteRow: {
    position: 'absolute',
    zIndex: 10,
  },
  closePill: {
    backgroundColor: 'transparent',
    padding: 4,
    borderRadius: 12,
  },
  topSection: {
    paddingBottom: 14,
  },
  header: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 26,
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  streakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  streakNumber: {
    color: '#fff',
    fontSize: 64,
    lineHeight: 64,
  },
  streakLabel: {
    marginTop: 10,
    fontSize: 16,
  },
  flameBadge: {
    width: 104,
    height: 104,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },
  calendarSection: {
    backgroundColor: '#2d2438',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  monthArrow: {
    padding: 6,
  },
  monthLabel: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 1,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  dayAbbrev: {
    width: '14.2857%',
    textAlign: 'center',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  cell: {
    width: '14.2857%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
  },
  dayTextOn: {
    color: '#fff',
  },
});


