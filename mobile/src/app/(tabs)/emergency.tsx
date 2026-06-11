import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { saveSosContacts, triggerSos } from '@/lib/api';
import { EMERGENCY_GUIDES, GUIDE_TABS, type GuideKey } from '@/lib/content';
import type { SosContact } from '@/lib/mappers';
import {
  Avatar,
  Button,
  Card,
  Field,
  Label,
  Muted,
  ScreenHeader,
  SectionTitle,
  Segmented,
} from '@/ui/components';
import { palette, radius, space } from '@/ui/theme';

const MAX_CONTACTS = 3;

export default function EmergencyScreen() {
  const { data, patchData } = useAuth();
  const [contacts, setContacts] = useState<SosContact[]>(data.sosContacts);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [guide, setGuide] = useState<GuideKey>('during');

  useEffect(() => {
    setContacts(data.sosContacts);
  }, [data.sosContacts]);

  function addLocalContact() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Eksik bilgi', 'Ad ve telefon gerekli.');
      return;
    }
    if (contacts.length >= MAX_CONTACTS) {
      Alert.alert('Sınır', `En fazla ${MAX_CONTACTS} kişi eklenebilir.`);
      return;
    }
    setContacts((prev) => [...prev, { name: name.trim(), phone: phone.trim() }]);
    setName('');
    setPhone('');
  }

  function removeLocalContact(index: number) {
    setContacts((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSaveContacts() {
    setSaving(true);
    try {
      const saved = await saveSosContacts(contacts);
      patchData({ sosContacts: saved });
      Alert.alert('Kaydedildi', 'SOS kişileri güncellendi.');
    } catch (error) {
      Alert.alert('Kaydedilemedi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onSendSos() {
    if (contacts.length === 0) {
      Alert.alert('Kişi yok', 'Önce en az bir SOS kişisi ekleyip kaydet.');
      return;
    }
    Alert.alert('SOS gönderilsin mi?', 'Kayıtlı kişilerine konumunla birlikte uyarı gidecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Gönder', style: 'destructive', onPress: () => void sendSos() },
    ]);
  }

  async function sendSos() {
    setSending(true);
    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      }
      await triggerSos(latitude, longitude);
      Alert.alert(
        'SOS gönderildi',
        latitude != null ? 'Konumun ile birlikte gönderildi.' : 'Konum olmadan gönderildi.',
      );
    } catch (error) {
      Alert.alert('SOS gönderilemedi', (error as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Acil Durum" subtitle="SOS gönder, rehberi çevrimdışı oku." />

        <Animated.View entering={FadeInDown.duration(400)}>
          <View style={styles.sosCard}>
            <Pressable
              onPress={onSendSos}
              disabled={sending}
              style={({ pressed }) => [styles.sosButton, pressed && styles.sosButtonPressed]}
            >
              <Ionicons name="warning" size={34} color="#fff" />
              <Text style={styles.sosText}>{sending ? '...' : 'SOS'}</Text>
            </Pressable>
            <Text style={styles.sosHint}>
              Bas ve onayla: kayıtlı kişilerine konumunla birlikte uyarı gönderilir.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(80)}>
          <Card>
            <SectionTitle>Acil durum rehberi</SectionTitle>
            <Muted>İnternet olmadan da çalışır.</Muted>
            <Segmented
              options={GUIDE_TABS.map((tab) => ({ value: tab.key, label: tab.label }))}
              value={guide}
              onChange={(value) => setGuide(value as GuideKey)}
            />
            <View style={styles.guideList}>
              {EMERGENCY_GUIDES[guide].map((item, index) => (
                <View key={index} style={styles.guideRow}>
                  <View style={styles.guideNum}>
                    <Text style={styles.guideNumText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.guideText}>{item}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(160)}>
          <Card>
            <SectionTitle>
              SOS kişileri ({contacts.length}/{MAX_CONTACTS})
            </SectionTitle>
            {contacts.length === 0 ? (
              <Muted>Henüz kişi yok. En fazla 3 kişi ekleyebilirsin.</Muted>
            ) : (
              contacts.map((contact, index) => (
                <View key={`${contact.phone}-${index}`} style={styles.contactRow}>
                  <Avatar name={contact.name} />
                  <View style={styles.flex}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </View>
                  <Pressable onPress={() => removeLocalContact(index)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={21} color={palette.danger} />
                  </Pressable>
                </View>
              ))
            )}

            <Label>Yeni kişi</Label>
            <Field value={name} onChangeText={setName} placeholder="Ad" />
            <Field
              value={phone}
              onChangeText={setPhone}
              placeholder="+905551234567"
              keyboardType="phone-pad"
            />
            <Button title="Listeye ekle" onPress={addLocalContact} variant="ghost" />
            <Button title="Kişileri kaydet" onPress={onSaveContacts} loading={saving} />
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
  sosCard: { alignItems: 'center', gap: space.md, paddingVertical: space.sm },
  sosButton: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: palette.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: palette.danger,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    borderWidth: 6,
    borderColor: 'rgba(220,38,38,0.25)',
  },
  sosButtonPressed: { transform: [{ scale: 0.95 }] },
  sosText: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: 2 },
  sosHint: { textAlign: 'center', color: palette.muted, fontSize: 13, paddingHorizontal: space.xl },
  guideList: { gap: space.sm },
  guideRow: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  guideNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  guideNumText: { color: palette.primary, fontSize: 12.5, fontWeight: '800' },
  guideText: { flex: 1, color: palette.text, fontSize: 14.5, lineHeight: 21 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  contactName: { color: palette.text, fontSize: 15, fontWeight: '600' },
  contactPhone: { color: palette.muted, fontSize: 13 },
});
