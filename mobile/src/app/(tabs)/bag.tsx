import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { saveBagItems } from '@/lib/api';
import type { BagItem } from '@/lib/content';
import { Card, Muted, ProgressBar, ScreenHeader, SectionTitle } from '@/ui/components';
import { palette, radius, space } from '@/ui/theme';

export default function BagScreen() {
  const { data, patchData, recomputeScore } = useAuth();
  const [items, setItems] = useState<BagItem[]>(data.bagItems);
  const [syncState, setSyncState] = useState<'idle' | 'saving' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(data.bagItems);
  }, [data.bagItems]);

  const checkedCount = items.filter((i) => i.checked).length;
  const progress = items.length ? Math.round((checkedCount / items.length) * 100) : 0;

  const grouped = items.reduce<Record<string, BagItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  function toggle(id: string) {
    const next = items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item,
    );
    setItems(next);
    scheduleSave(next);
  }

  // Auto-save with a short debounce: feels instant, avoids request spam.
  function scheduleSave(next: BagItem[]) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSyncState('saving');
    saveTimer.current = setTimeout(async () => {
      try {
        const saved = await saveBagItems(next);
        patchData({ bagItems: saved });
        await recomputeScore();
        setSyncState('idle');
      } catch (error) {
        setSyncState('error');
        Alert.alert('Kaydedilemedi', (error as Error).message);
      }
    }, 600);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader
          title="Acil Durum Çantası"
          subtitle="İşaretledikçe otomatik kaydedilir ve skoruna işler."
        />

        <Animated.View entering={FadeInDown.duration(400)}>
          <Card>
            <View style={styles.progressHeader}>
              <SectionTitle>Hazırlık durumu</SectionTitle>
              <Text style={styles.progressPct}>%{progress}</Text>
            </View>
            <ProgressBar value={progress} height={12} fill={palette.success} />
            <View style={styles.progressFooter}>
              <Muted>
                {checkedCount}/{items.length} öğe hazır
              </Muted>
              {syncState === 'saving' ? (
                <Text style={styles.syncText}>Kaydediliyor...</Text>
              ) : syncState === 'error' ? (
                <Text style={[styles.syncText, { color: palette.danger }]}>Kaydedilemedi</Text>
              ) : null}
            </View>
          </Card>
        </Animated.View>

        {Object.entries(grouped).map(([category, categoryItems], index) => (
          <Animated.View key={category} entering={FadeInDown.duration(400).delay(80 * (index + 1))}>
            <Card>
              <SectionTitle>{category}</SectionTitle>
              <View style={styles.list}>
                {categoryItems.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => toggle(item.id)}
                    style={({ pressed }) => [
                      styles.item,
                      item.checked && styles.itemChecked,
                      pressed && styles.itemPressed,
                    ]}
                  >
                    <Ionicons
                      name={item.checked ? 'checkbox' : 'square-outline'}
                      size={24}
                      color={item.checked ? palette.success : palette.muted}
                    />
                    <Text style={[styles.itemLabel, item.checked && styles.itemLabelChecked]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Card>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPct: { fontSize: 18, fontWeight: '800', color: palette.success },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  syncText: { fontSize: 12, color: palette.muted, fontStyle: 'italic' },
  list: { gap: space.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 11,
    paddingHorizontal: space.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  itemChecked: {
    borderColor: 'rgba(5,150,105,0.35)',
    backgroundColor: palette.successSoft,
  },
  itemPressed: { opacity: 0.7 },
  itemLabel: { flex: 1, color: palette.text, fontSize: 15, fontWeight: '500' },
  itemLabelChecked: { color: palette.muted, textDecorationLine: 'line-through' },
});
