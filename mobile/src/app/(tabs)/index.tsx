import { useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { createTask, fetchTasks, updateTask } from '@/lib/api';
import { PREP_TASKS, type PrepTask } from '@/lib/content';
import { registerForPushNotifications } from '@/lib/notifications';
import { scoreColor, type Task } from '@/lib/score-engine';
import { Button, Card, Muted, SectionTitle } from '@/ui/components';
import { palette, radius, space } from '@/ui/theme';

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

  const taskCounts = data.tasks.reduce(
    (acc, task) => {
      acc.total += 1;
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    { total: 0, todo: 0, 'in-progress': 0, done: 0 } as Record<string, number>,
  );

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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.greeting}>Merhaba, {username || 'kullanıcı'}</Text>

        <Card>
          <Muted>Hazırlık skoru</Muted>
          <Text style={[styles.score, { color: scoreColor(score) }]}>{score}</Text>
          {breakdown ? (
            <View style={styles.breakdown}>
              <BreakdownRow label="Çanta" value={breakdown.bagScore} />
              <BreakdownRow label="Görevler" value={breakdown.taskScore} />
              <BreakdownRow label="Profil" value={breakdown.baseScore} />
              <BreakdownRow label="Aile" value={breakdown.familyScore} />
            </View>
          ) : (
            <Muted>Skor kırılımı için modülleri doldur.</Muted>
          )}
        </Card>

        <Card>
          <SectionTitle>Önerilen hazırlık görevleri</SectionTitle>
          <Muted>
            En önemli adımlar. Listene ekle; tamamladıkça hazırlık skorun artar.
          </Muted>
          <View style={styles.recList}>
            {PREP_TASKS.map((rec) => {
              const match = findRecTask(data.tasks, rec);
              const isDone = Boolean(match && match.status === 'done');
              const isBusy = busyRecId === rec.id;
              return (
                <View key={rec.id} style={[styles.recRow, isDone && styles.recRowDone]}>
                  <Text style={[styles.recTitle, isDone && styles.recTitleDone]}>
                    {rec.title}
                  </Text>
                  {isDone ? (
                    <Text style={styles.recDoneBadge}>✓</Text>
                  ) : (
                    <Pressable
                      onPress={() => onRecAction(rec)}
                      disabled={isBusy}
                      style={({ pressed }) => [
                        styles.recButton,
                        match ? styles.recButtonComplete : null,
                        (pressed || isBusy) && styles.recButtonPressed,
                      ]}
                    >
                      <Text style={styles.recButtonText}>
                        {isBusy ? '...' : match ? 'Tamamla' : 'Ekle'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        </Card>

        <Card>
          <SectionTitle>Görev özeti</SectionTitle>
          <BreakdownRow label="Toplam" value={taskCounts.total} suffix="" />
          <BreakdownRow label="Yapılacak" value={taskCounts.todo} suffix="" />
          <BreakdownRow label="Devam eden" value={taskCounts['in-progress']} suffix="" />
          <BreakdownRow label="Tamamlanan" value={taskCounts.done} suffix="" />
        </Card>

        <Card>
          <SectionTitle>Bildirimler</SectionTitle>
          <Muted>Deprem hazırlık hatırlatmaları için push bildirimlerini etkinleştir.</Muted>
          <Button
            title="Bildirimleri etkinleştir"
            onPress={onEnablePush}
            variant="ghost"
            loading={registeringPush}
          />
        </Card>

        <Button title="Çıkış yap" onPress={logout} variant="danger" />
      </ScrollView>
    </SafeAreaView>
  );
}

function BreakdownRow({
  label,
  value,
  suffix = '/100',
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>
        {value}
        {suffix}
      </Text>
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
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.text,
  },
  score: {
    fontSize: 64,
    fontWeight: '800',
  },
  breakdown: {
    gap: space.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    color: palette.text,
    fontSize: 15,
  },
  rowValue: {
    color: palette.muted,
    fontSize: 15,
    fontWeight: '600',
  },
  recList: {
    gap: space.sm,
    marginTop: space.sm,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingVertical: 6,
  },
  recRowDone: {
    opacity: 0.6,
  },
  recTitle: {
    flex: 1,
    color: palette.text,
    fontSize: 14.5,
  },
  recTitleDone: {
    textDecorationLine: 'line-through',
    color: palette.muted,
  },
  recDoneBadge: {
    color: palette.success,
    fontSize: 18,
    fontWeight: '800',
  },
  recButton: {
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  recButtonComplete: {
    backgroundColor: palette.success,
  },
  recButtonPressed: {
    opacity: 0.6,
  },
  recButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
