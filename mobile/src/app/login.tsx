import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/context/auth-context';
import { requestOtp } from '@/lib/api';
import { Button, Card, Chip, Field, Label, Muted, SectionTitle } from '@/ui/components';
import { palette, shadow, space } from '@/ui/theme';

export default function LoginScreen() {
  const { loginPassword, loginOtp } = useAuth();

  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo123');
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [debugCode, setDebugCode] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);

  async function handlePasswordLogin() {
    if (!username.trim() || !password) {
      Alert.alert('Eksik bilgi', 'Kullanıcı adı ve parola gerekli.');
      return;
    }
    setLoadingPassword(true);
    try {
      await loginPassword(username.trim(), password);
    } catch (error) {
      Alert.alert('Giriş başarısız', (error as Error).message);
    } finally {
      setLoadingPassword(false);
    }
  }

  async function handleSendOtp() {
    if (!phone.trim()) {
      Alert.alert('Telefon gerekli', 'E.164 formatında telefon girin, ör. +905551234567.');
      return;
    }
    setLoadingOtp(true);
    try {
      const data = await requestOtp(phone.trim());
      setOtpSent(true);
      if (data.debug_code) {
        setDebugCode(data.debug_code);
        setCode(data.debug_code);
      } else {
        setDebugCode('');
      }
    } catch (error) {
      Alert.alert('OTP gönderilemedi', (error as Error).message);
    } finally {
      setLoadingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    if (code.trim().length !== 6) {
      Alert.alert('Geçersiz kod', '6 haneli kodu girin.');
      return;
    }
    setLoadingOtp(true);
    try {
      await loginOtp(phone.trim(), code.trim());
    } catch (error) {
      Alert.alert('Doğrulama başarısız', (error as Error).message);
    } finally {
      setLoadingOtp(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
            <View style={styles.brandMark}>
              <Ionicons name="shield-checkmark" size={34} color="#fff" />
            </View>
            <Text style={styles.brand}>Deprem Hazırlık</Text>
            <Muted>Ailenle birlikte depreme hazır ol.</Muted>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(100)}>
            <Card>
              <View style={styles.cardTitleRow}>
                <SectionTitle>Giriş</SectionTitle>
                <Chip label="Demo" />
              </View>
              <Label>Kullanıcı adı</Label>
              <Field
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Label>Parola</Label>
              <Field value={password} onChangeText={setPassword} secureTextEntry />
              <Button title="Giriş yap" onPress={handlePasswordLogin} loading={loadingPassword} />
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(200)}>
            <Card>
              <SectionTitle>OTP ile giriş</SectionTitle>
              <Label>Telefon (E.164)</Label>
              <Field
                value={phone}
                onChangeText={setPhone}
                placeholder="+905551234567"
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
              <Button
                title={otpSent ? 'Kodu tekrar gönder' : 'OTP gönder'}
                onPress={handleSendOtp}
                variant="ghost"
                loading={loadingOtp && !otpSent}
              />
              {otpSent ? (
                <>
                  <Label>6 haneli kod</Label>
                  <Field
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="------"
                  />
                  {debugCode ? <Muted>Debug kod (yalnızca test): {debugCode}</Muted> : null}
                  <Button title="OTP doğrula" onPress={handleVerifyOtp} loading={loadingOtp} />
                </>
              ) : null}
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.bg },
  flex: { flex: 1 },
  content: { padding: space.lg, gap: space.lg, paddingBottom: space.xl },
  header: { alignItems: 'center', paddingVertical: space.xl, gap: space.sm },
  brandMark: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.hero,
  },
  brand: { fontSize: 28, fontWeight: '800', color: palette.text, letterSpacing: -0.5 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
