import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { Button, Card, Field, Label, Muted, SectionTitle } from '@/ui/components';
import { palette, radius, space } from '@/ui/theme';

export default function FamilyScreen() {
  const { data, patchData, recomputeScore } = useAuth();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
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
    setBusy(true);
    try {
      await createFamilyMember({ name: name.trim(), role: role.trim() || 'Üye', score: 50 });
      setName('');
      setRole('');
      await refreshFamily();
    } catch (error) {
      Alert.alert('Eklenemedi', (error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteMember(id: number) {
    setBusy(true);
    try {
      await deleteFamilyMember(id);
      await refreshFamily();
    } catch (error) {
      Alert.alert('Silinemedi', (error as Error).message);
    } finally {
      setBusy(false);
    }
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <SectionTitle>Aile üyeleri</SectionTitle>
          {members.length === 0 ? (
            <Muted>Henüz üye yok.</Muted>
          ) : (
            members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.flex}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberMeta}>
                    {member.role} · skor {member.score}
                  </Text>
                </View>
                <Pressable onPress={() => onDeleteMember(member.id)} disabled={busy}>
                  <Ionicons name="trash" size={22} color={palette.danger} />
                </Pressable>
              </View>
            ))
          )}
          <Label>Yeni üye</Label>
          <Field value={name} onChangeText={setName} placeholder="Ad" />
          <Field value={role} onChangeText={setRole} placeholder="Rol (ör. Anne)" />
          <Button title="Üye ekle" onPress={onAddMember} loading={busy} variant="ghost" />
        </Card>

        <Card>
          <SectionTitle>Aile grubu</SectionTitle>
          {group ? (
            <>
              <Muted>Davet kodu</Muted>
              <Text style={styles.code}>{group.invite_code}</Text>
              <Muted>Ortalama aile skoru: {Math.round(group.family_average_score)}</Muted>
              {(group.members || []).map((m: any) => (
                <View key={m.user_id ?? m.username} style={styles.memberRow}>
                  <Text style={styles.memberName}>{m.username}</Text>
                  <Text style={styles.memberMeta}>skor {m.score}</Text>
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
                placeholder="Davet kodu"
                autoCapitalize="characters"
              />
              <Button title="Gruba katıl" onPress={onJoinGroup} loading={busy} variant="ghost" />
            </>
          )}
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
  flex: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  memberName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  memberMeta: {
    color: palette.muted,
    fontSize: 12,
  },
  code: {
    fontSize: 22,
    fontWeight: '800',
    color: palette.primary,
    letterSpacing: 2,
  },
});
