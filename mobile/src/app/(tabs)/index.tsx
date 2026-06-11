import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { createTask, fetchTasks, updateTask } from '@/lib/api';
import { PREP_TASKS, type PrepTask } from '@/lib/content';
import { registerForPushNotifications } from '@/lib/notifications';
import type { Task } from '@/lib/score-engine';
import { Button, Card, Muted, ProgressBar, SectionTitle } from '@/ui/components';
import { palette, radius, scoreTone, shadow, space } from '@/ui/theme';

function findRecTask(tasks: Task[], rec: PrepTask): Task | undefined {
  return tasks.find((task) => task.title === rec.title || task.title === rec.titleEn);
}

export default function DashboardScreen() {
  const { username, data, reload, logout, patchData, recomputeScore } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [registeringPush, setRegisteringPush] = useState(false);
  const [busyRecId, setBusyRecId] = useState<string | null>(null);

  const score = data.score.total_score ?? 0;
  const breakdown = data.score.breakdown;
  const tone = scoreTone(score);

  const doneTasks = data.tasks.filter((task) => task.status === 'done').length;
  const bagReady = data.bagItems.filter((item) => item.checked).length;

  async function onRefresh() {
    setRefreshing(true);
    try {
      await reload();
    } catch (error) {
      Alert.alert('Yenilenemedi', (error as Error).message);
    } finally {
      setRefreshing(false);
    }
  }

  async function onRecAction(rec: PrepTask) {
    if (busyRecId) return;
    setBusyRecId(rec.id);
    try {
      const match = findRecTask(data.tasks, rec);
      if (!match) {
        await createTask(rec.title);
      } else if (match.status !== 'done') {
        await updateTask(match.id, match.title, 'done');
      }
      const tasks = await fetchTasks();
      patchData({ tasks });
      await recomputeScore();
    } catch (error) {
      Alert.alert('Hata', (error as Error).message);
    } finally {
      setBusyRecId(null);
    }
  }

  async function onEnablePush() {
    setRegisteringPush(true);
    try {
      const result = await registerForPushNotifications();
      if (result.ok) {
        Alert.alert('Bildirimler açık', 'Cihazın push bildirimleri için kaydedildi.');
      } else {
        Alert.alert('Bildirim kurulamadı', result.reason ?? 'Bilinmeyen hata.');
      }
    } finally {
      setRegisteringPush(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <View style={styles.brandMark}>
            <Ionicons name="shield-checkmark" size={22} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.appName}>Deprem Hazırlık</Text>
            <Text style={styles.greeting}>Merhaba, {username || 'kullanıcı'}</Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>Hazırlık Skorun</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{tone.label}</Text>
              </View>
            </View>
            <Text style={styles.heroScore}>
              {score}
              <Text style={styles.heroScoreMax}>/100</Text>
            </Text>
            {breakdown ? (
              <View style={styles.heroBreakdown}>
                <HeroBar label="Çanta" value={breakdown.bagScore} />
                <HeroBar label="Görevler" value={breakdown.taskScore} />
                <HeroBar label="Profil" value={breakdown.baseScore} />
                <HeroBar label="Aile" value={breakdown.familyScore} />
              </View>
            ) : (
              <Text style={styles.heroHint}>Modülleri doldurdukça skorun şekillenir.</Text>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.statsRow}>
          <StatChip icon="checkmark-done" label="Görev" value={`${doneTasks}/${data.tasks.length}`} />
          <StatChip icon="bag-handle" label="Çanta" value={`${bagReady}/${data.bagItems.length}`} />
          <StatChip icon="people" label="Aile" value={`${data.familyMembers.length}`} />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(160)}>
          <Card>
            <SectionTitle>Önerilen hazırlık görevleri</SectionTitle>
            <Muted>En kritik adımlar. Tamamladıkça hazırlık skorun artar.</Muted>
            <View style={styles.recList}>
              {PREP_TASKS.map((rec) => {
                const match = findRecTask(data.tasks, rec);
                const isDone = Boolean(match && match.status === 'done');
                const isBusy = busyRecId === rec.id;
                return (
                  <Pressable
                    key={rec.id}
                    onPress={() => (isDone ? undefined : onRecAction(rec))}
                    disabled={isDone || isBusy}
                    style={({ pressed }) => [
                      styles.recRow,
                      isDone && styles.recRowDone,
                      pressed && !isDone && styles.recRowPressed,
                    ]}
                  >
                    <Ionicons
                      name={
                        isDone
                          ? 'checkmark-circle'
                          : match
                            ? 'ellipse-outline'
                            : 'add-circle-outline'
                      }
                      size={26}
                      color={isDone ? palette.success : match ? palette.amber : palette.primary}
                    />
                    <Text style={[styles.recTitle, isDone && styles.recTitleDone]}>
                      {rec.title}
                    </Text>
                    {!isDone ? (
                      <Text style={styles.recAction}>
                        {isBusy ? '...' : match ? 'Tamamla' : 'Ekle'}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(240)}>
          <Card>
            <SectionTitle>Bildirimler</SectionTitle>
            <Muted>Hazırlık hatırlatmaları için push bildirimlerini etkinleştir.</Muted>
            <Button
              title="Bildirimleri etkinleştir"
              onPress={onEnablePush}
              variant="ghost"
              loading={registeringPush}
            />
          </Card>
        </Animated.View>

        <Button title="Çıkış yap" onPress={logout} variant="danger" />
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroBar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.heroBarRow}>
      <Text style={styles.heroBarLabel}>{label}</Text>
      <View style={styles.heroBarTrack}>
        <ProgressBar value={value} height={7} fill="#ffffff" track="rgba(255,255,255,0.25)" />
      </View>
      <Text style={styles.heroBarValue}>{value}</Text>
    </View>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={18} color={palette.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.hero,
  },
  headerText: { gap: 1 },
  appName: { fontSize: 12, fontWeight: '700', color: palette.muted, letterSpacing: 0.4 },
  greeting: { fontSize: 20, fontWeight: '800', color: palette.text, letterSpacing: -0.3 },
  heroCard: {
    backgroundColor: palette.hero,
    borderRadius: radius.lg + 4,
    padding: space.xl,
    gap: space.md,
    ...shadow.hero,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  heroBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  heroScore: { color: '#fff', fontSize: 56, fontWeight: '800', letterSpacing: -1.5 },
  heroScoreMax: { fontSize: 22, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  heroHint: { color: 'rgba(255,255,255,0.75)', fontSize: 13 },
  heroBreakdown: { gap: space.sm },
  heroBarRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  heroBarLabel: { width: 64, color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontWeight: '600' },
  heroBarTrack: { flex: 1 },
  heroBarValue: {
    width: 32,
    textAlign: 'right',
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '700',
  },
  statsRow: { flexDirection: 'row', gap: space.md },
  statChip: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: space.md,
    alignItems: 'center',
    gap: 2,
    ...shadow.card,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: palette.text },
  statLabel: { fontSize: 11.5, color: palette.muted, fontWeight: '600' },
  recList: { gap: space.xs },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 10,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
  },
  recRowPressed: { backgroundColor: palette.primarySoft },
  recRowDone: { opacity: 0.6 },
  recTitle: { flex: 1, color: palette.text, fontSize: 14.5, lineHeight: 20 },
  recTitleDone: { textDecorationLine: 'line-through', color: palette.muted },
  recAction: { color: palette.primary, fontSize: 13, fontWeight: '700' },
});
