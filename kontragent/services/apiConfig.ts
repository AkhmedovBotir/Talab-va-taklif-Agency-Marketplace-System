import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LEGACY_PORT = 8081;
const CONTRAGENT_V1_PORT = 8081;

/**
 * Haqiqiy telefon/tablet (LAN orqali): kompyuter IP si.
 * Noto'g'ri bo'lsa `.env`: EXPO_PUBLIC_API_HOST=192.168.x.x
 */
const DEFAULT_LAN_HOST = '192.168.1.6';

function apiHost(): string {
  const fromEnv =
    process.env.EXPO_PUBLIC_API_HOST?.trim() || process.env.EXPO_PUBLIC_API_LAN_HOST?.trim();
  if (fromEnv) return fromEnv;

  // Web: sahifa va API odatda bir xil mashinada (Expo 8082, backend 8081/5000)
  if (Platform.OS === 'web') {
    return 'localhost';
  }

  // Android emulyator: 192.168.x odatda hostga yetmaydi; host 127.0.0.1 → 10.0.2.2
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return '10.0.2.2';
  }

  // iOS simulator
  if (Platform.OS === 'ios' && !Constants.isDevice) {
    return 'localhost';
  }

  return DEFAULT_LAN_HOST;
}

/** Qo'l dagi REST (mahsulotlar, buyurtmalar va hokazo) */
export function getLegacyApiBaseUrl(): string {
  return `http://${apiHost()}:${LEGACY_PORT}`;
}

/** Contragent auth va `me/*` — `/api/v1` */
export function getContragentV1BaseUrl(): string {
  return `http://${apiHost()}:${CONTRAGENT_V1_PORT}/api/v1`;
}

/** Debug */
export function getResolvedApiHost(): string {
  return apiHost();
}
