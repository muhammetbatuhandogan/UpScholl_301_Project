import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import {
  createFamilyGroup,
  createFamilyMember,
  deleteFamilyMember,
  fetchFamilyGroup,
  fetchFamilyMembers,
  joinFamilyGroup,
  leaveFamilyGroup,
} from '@/lib/api';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Label,
  Muted,
  ScreenHeader,
  SectionTitle,
  Segmented,
} from '@/ui/components';
import { palette, radius, scoreTone, space } from '@/ui/theme';

const ROLES = ['Ebeveyn', 'Çocuk', 'Yaşlı', 'Akraba', 'Üye'];

export default function FamilyScreen() {
  const { data, patchData, recomputeScore } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('Üye');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);

  const members = data.familyMembers;
  const group = data.familyGroup;

  async function refreshFamily() {
    const [familyMembers, familyGroup] = await Promise.all([
      fetchFamilyMembers(),
      fetchFamilyGroup(),
    ]);
    patchData({ familyMembers, familyGroup });
    await recomputeScore();
  }

  async function onAddMember() {
    if (!name.trim()) {
      Alert.alert('İsim gerekli', 'Üye adını girin.');
      return;
    }
    if (members.length >= 5) {
      Alert.alert('Sınır', 'En fazla 5 üye eklenebilir.');
      return;
    }
    setBusy(true);
    try {
      await createFamilyMember({ name: name.trim(), role, score: 50 });
      setName('');
      setRole('Üye');
      await refreshFamily();
    } catch (error) {
      Alert.alert('Eklenemedi', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function onDeleteMember(id: number, memberName: string) {
    Alert.alert('Üyeyi sil', `${memberName} listeden kaldırılsın mı?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await deleteFamilyMember(id);
            await refreshFamily();
          } catch (error) {
            Alert.alert('Silinemedi', (error as Error).message);
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  async function onCreateGroup() {
    setBusy(true);
    try {
      await createFamilyGroup();
      await refreshFamily();
    } catch (error) {
      Alert.alert('Grup oluşturulamadı', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onJoinGroup() {
    if (!joinCode.trim()) {
      Alert.alert('Kod gerekli', 'Davet kodunu girin.');
      return;
    }
    setBusy(true);
    try {
      await joinFamilyGroup(joinCode.trim());
      setJoinCode('');
      await refreshFamily();
    } catch (error) {
      Alert.alert('Katılınamadı', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onLeaveGroup() {
    setBusy(true);
    try {
      await leaveFamilyGroup();
      await refreshFamily();
    } catch (error) {
      Alert.alert('Çıkılamadı', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Aile" subtitle="Hane üyelerini yönet, aile grubunla skoru paylaş." />

        <Animated.View entering={FadeInDown.duration(400)}>
          <Card>
            <SectionTitle>Hane üyeleri ({members.length}/5)</SectionTitle>
            {members.length === 0 ? (
              <Muted>Henüz üye yok. Aşağıdan ilk üyeni ekle.</Muted>
            ) : (
              members.map((member) => {
                const tone = scoreTone(member.score);
                return (
                  <View key={member.id} style={styles.memberRow}>
                    <Avatar name={member.name} color={tone.color} />
                    <View style={styles.flex}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <View style={styles.memberMetaRow}>
                        <Badge label={member.role} />
                        <Badge label={`Skor ${member.score}`} color={tone.color} soft={tone.soft} />
                      </View>
                    </View>
                    <Pressable
                      onPress={() => onDeleteMember(member.id, member.name)}
                      disabled={busy}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={21} color={palette.danger} />
                    </Pressable>
                  </View>
                );
              })
            )}
            <Label>Yeni üye</Label>
            <Field value={name} onChangeText={setName} placeholder="Ad" />
            <Label>Rol</Label>
            <Segmented
              options={ROLES.map((r) => ({ value: r, label: r }))}
              value={role}
              onChange={setRole}
            />
            <Button title="Üye ekle" onPress={onAddMember} loading={busy} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <Card>
            <SectionTitle>Aile grubu</SectionTitle>
            {group ? (
              <>
                <Muted>Davet kodunu paylaş, ailen kendi cihazından katılsın.</Muted>
                <View style={styles.codeBox}>
                  <Text style={styles.code}>{group.invite_code}</Text>
                  <Muted>Davet kodu</Muted>
                </View>
                <View style={styles.groupScoreRow}>
                  <Ionicons name="people" size={18} color={palette.primary} />
                  <Text style={styles.groupScoreText}>
                    Ortalama aile skoru: {Math.round(group.family_average_score)}
                  </Text>
                </View>
                {(group.members || []).map((m: any) => (
                  <View key={m.user_id ?? m.username} style={styles.memberRow}>
                    <Avatar name={m.username} />
                    <Text style={[styles.memberName, styles.flex]}>{m.username}</Text>
                    <Badge
                      label={`Skor ${m.total_score ?? m.score ?? 0}`}
                      color={scoreTone(m.total_score ?? m.score ?? 0).color}
                      soft={scoreTone(m.total_score ?? m.score ?? 0).soft}
                    />
                  </View>
                ))}
                <Button title="Gruptan ayrıl" onPress={onLeaveGroup} loading={busy} variant="danger" />
              </>
            ) : (
              <>
                <Muted>Bir aile grubu oluştur veya davet koduyla katıl.</Muted>
                <Button title="Grup oluştur" onPress={onCreateGroup} loading={busy} />
                <Label>Davet kodu ile katıl</Label>
                <Field
                  value={joinCode}
                  onChangeText={setJoinCode}
                  placeholder="6 haneli kod"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Button title="Gruba katıl" onPress={onJoinGroup} loading={busy} variant="ghost" />
              </>
            )}
          </Card>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl },
  flex: { flex: 1 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  memberName: { color: palette.text, fontSize: 15, fontWeight: '600' },
  memberMetaRow: { flexDirection: 'row', gap: space.xs, marginTop: 4 },
  codeBox: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: space.md,
    borderRadius: radius.md,
    backgroundColor: palette.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.2)',
    borderStyle: 'dashed',
  },
  code: { fontSize: 30, fontWeight: '800', color: palette.primary, letterSpacing: 6 },
  groupScoreRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  groupScoreText: { color: palette.text, fontSize: 14.5, fontWeight: '600' },
});
