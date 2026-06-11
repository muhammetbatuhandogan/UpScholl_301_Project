import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { saveOnboarding } from '@/lib/api';
import type { Onboarding } from '@/lib/score-engine';
import { Button, Card, Field, Label, Muted, SectionTitle } from '@/ui/components';
import { palette, radius, space } from '@/ui/theme';

const FAMILY_SIZES = ['1', '2', '3', '4', '5+'];
const YES_NO = [
  { value: 'no', label: 'Hayır' },
  { value: 'yes', label: 'Evet' },
];

export default function OnboardingScreen() {
  const { data, patchData, recomputeScore } = useAuth();
  const [form, setForm] = useState<Onboarding>(data.onboarding);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(data.onboarding);
  }, [data.onboarding]);

  function update<K extends keyof Onboarding>(key: K, value: Onboarding[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave() {
    setSaving(true);
    try {
      const saved = await saveOnboarding({ ...form, completed: true });
      patchData({ onboarding: saved });
      await recomputeScore();
      Alert.alert('Kaydedildi', 'Profil bilgilerin güncellendi.');
    } catch (error) {
      Alert.alert('Kaydedilemedi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <SectionTitle>Profil</SectionTitle>
          <Muted>Bu bilgiler hazırlık skorunun temelini belirler.</Muted>

          <Label>Bölge / Şehir</Label>
          <Field
            value={form.region}
            onChangeText={(v) => update('region', v)}
            placeholder="Örn. İstanbul"
          />

          <Label>Hane büyüklüğü</Label>
          <Segmented
            options={FAMILY_SIZES.map((s) => ({ value: s, label: s }))}
            value={form.familySize}
            onChange={(v) => update('familySize', v)}
          />

          <Label>Evde çocuk var mı?</Label>
          <Segmented options={YES_NO} value={form.hasChildren} onChange={(v) => update('hasChildren', v)} />

          <Label>Evde yaşlı birey var mı?</Label>
          <Segmented options={YES_NO} value={form.hasElderly} onChange={(v) => update('hasElderly', v)} />

          <Button title="Kaydet" onPress={onSave} loading={saving} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
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
  segmented: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  segment: {
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  segmentActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  segmentText: {
    color: palette.text,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: palette.primaryText,
  },
});
