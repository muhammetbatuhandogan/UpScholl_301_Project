import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { saveOnboarding } from '@/lib/api';
import { calculateInitialScore, type Onboarding } from '@/lib/score-engine';
import {
  Button,
  Card,
  Field,
  Label,
  Muted,
  ProgressBar,
  ScreenHeader,
  SectionTitle,
  Segmented,
} from '@/ui/components';
import { palette, space } from '@/ui/theme';

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

  const previewScore = calculateInitialScore(form);

  function update<K extends keyof Onboarding>(key: K, value: Onboarding[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave() {
    if (!form.region.trim()) {
      Alert.alert('Bölge gerekli', 'Yaşadığın şehri veya bölgeyi gir.');
      return;
    }
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
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Profil" subtitle="Bu bilgiler hazırlık skorunun temelini belirler." />

        <Animated.View entering={FadeInDown.duration(400)}>
          <Card>
            <SectionTitle>Temel skor önizleme</SectionTitle>
            <View style={styles.previewRow}>
              <Text style={styles.previewScore}>{previewScore}</Text>
              <Text style={styles.previewMax}>/75</Text>
            </View>
            <ProgressBar value={(previewScore / 75) * 100} height={10} />
            <Muted>Bilgileri doldurdukça önizleme anında güncellenir.</Muted>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <Card>
            <SectionTitle>Hane bilgileri</SectionTitle>

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
            <Segmented
              options={YES_NO}
              value={form.hasChildren}
              onChange={(v) => update('hasChildren', v)}
            />

            <Label>Evde yaşlı veya engelli birey var mı?</Label>
            <Segmented
              options={YES_NO}
              value={form.hasElderly}
              onChange={(v) => update('hasElderly', v)}
            />

            <Button title="Kaydet" onPress={onSave} loading={saving} />
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl },
  previewRow: { flexDirection: 'row', alignItems: 'baseline' },
  previewScore: { fontSize: 44, fontWeight: '800', color: palette.primary, letterSpacing: -1 },
  previewMax: { fontSize: 18, fontWeight: '600', color: palette.muted },
});
