import AsyncStorage from "@react-native-async-storage/async-storage";

export async function readJson<T>(key: string): Promise<T | null> {
  try { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) as T : null; } catch { return null; }
}
export async function writeJson(key: string, value: unknown) {
  try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}
