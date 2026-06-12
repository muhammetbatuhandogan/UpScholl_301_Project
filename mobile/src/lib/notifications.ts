import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { registerPushDevice } from './api';

export type PushRegistrationResult = {
  ok: boolean;
  reason?: string;
  token?: string;
};

// Remote push was removed from Expo Go in SDK 53; importing expo-notifications
// at module scope crashes the whole route in Expo Go. Detect Expo Go and load
// the module lazily only when it can actually work.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

export async function registerForPushNotifications(): Promise<PushRegistrationResult> {
  if (isExpoGo) {
    return {
      ok: false,
      reason:
        'Push bildirimleri Expo Go içinde desteklenmiyor. ' +
        'Uygulamanın kalıcı (development/production) sürümünde çalışır.',
    };
  }

  try {
    const Device = await import('expo-device');
    const Notifications = await import('expo-notifications');

    if (!Device.isDevice) {
      return { ok: false, reason: 'Push yalnızca gerçek cihazda çalışır (emülatör değil).' };
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return { ok: false, reason: 'Bildirim izni verilmedi.' };
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;
    await registerPushDevice(token, 'expo');
    return { ok: true, token };
  } catch (error) {
    return {
      ok: false,
      reason: 'Push kurulamadı: ' + String((error as Error)?.message ?? error),
    };
  }
}
