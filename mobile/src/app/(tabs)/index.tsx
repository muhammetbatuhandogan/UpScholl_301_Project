import { useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { registerForPushNotifications } from '@/lib/notifications';
import { scoreColor } from '@/lib/score-engine';
import { Button, Card, Muted, SectionTitle } from '@/ui/components';
import { palette, space } from '@/ui/theme';

export default function DashboardScreen() {
  const { username, data, reload, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [registeringPush, setRegisteringPush] = useState(false);

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
});
