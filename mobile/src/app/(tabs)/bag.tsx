import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { saveBagItems } from '@/lib/api';
import type { BagItem } from '@/lib/content';
import { Button, Card, Muted, SectionTitle } from '@/ui/components';
import { palette, radius, space } from '@/ui/theme';

export default function BagScreen() {
  const { data, patchData, recomputeScore } = useAuth();
  const [items, setItems] = useState<BagItem[]>(data.bagItems);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(data.bagItems);
  }, [data.bagItems]);

  const checkedCount = items.filter((i) => i.checked).length;

  function toggle(id: string) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    );
  }

  async function onSave() {
    setSaving(true);
    try {
      const saved = await saveBagItems(items);
      patchData({ bagItems: saved });
      await recomputeScore();
      Alert.alert('Kaydedildi', 'Çanta listesi güncellendi.');
    } catch (error) {
      Alert.alert('Kaydedilemedi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <SectionTitle>Acil durum çantası</SectionTitle>
          <Muted>
            {checkedCount}/{items.length} öğe hazır
          </Muted>
          <View style={styles.list}>
            {items.map((item) => (
              <Pressable key={item.id} onPress={() => toggle(item.id)} style={styles.item}>
                <Ionicons
                  name={item.checked ? 'checkbox' : 'square-outline'}
                  size={26}
                  color={item.checked ? palette.success : palette.muted}
                />
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
              </Pressable>
            ))}
          </View>
          <Button title="Kaydet" onPress={onSave} loading={saving} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    padding: space.lg,
    gap: space.lg,
  },
  list: {
    gap: space.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  itemText: {
    flex: 1,
  },
  itemLabel: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  itemCategory: {
    color: palette.muted,
    fontSize: 12,
  },
});
