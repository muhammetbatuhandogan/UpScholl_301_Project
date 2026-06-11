import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { saveSosContacts, triggerSos } from '@/lib/api';
import type { SosContact } from '@/lib/mappers';
import { Button, Card, Field, Label, Muted, SectionTitle } from '@/ui/components';
import { palette, radius, space } from '@/ui/theme';

const MAX_CONTACTS = 3;

export default function EmergencyScreen() {
  const { data, patchData } = useAuth();
  const [contacts, setContacts] = useState<SosContact[]>(data.sosContacts);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card>
          <SectionTitle>Acil durum (SOS)</SectionTitle>
          <Muted>SOS, kayıtlı kişilerine konumunla birlikte uyarı gönderir.</Muted>
          <Button title="SOS GÖNDER" onPress={onSendSos} loading={sending} variant="danger" />
        </Card>

        <Card>
          <SectionTitle>SOS kişileri ({contacts.length}/{MAX_CONTACTS})</SectionTitle>
          {contacts.length === 0 ? (
            <Muted>Henüz kişi yok.</Muted>
          ) : (
            contacts.map((contact, index) => (
              <View key={`${contact.phone}-${index}`} style={styles.contactRow}>
                <View style={styles.flex}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <Pressable onPress={() => removeLocalContact(index)}>
                  <Ionicons name="trash" size={22} color={palette.danger} />
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
  contactRow: {
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
  contactName: {
    color: palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  contactPhone: {
    color: palette.muted,
    fontSize: 13,
  },
});
