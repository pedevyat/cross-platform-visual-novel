import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'novel:save:v1';

export type SaveData = {
  /** Версия сюжета, с которой сделано сохранение */
  version: string;
  /** Состояние inkjs (story.state.toJson()) */
  state: string;
  /** Что было на экране: реплика, говорящий, варианты */
  scene: unknown;
};

export async function readSave(): Promise<SaveData | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && typeof data.version === 'string' && typeof data.state === 'string' && data.scene) {
      return data as SaveData;
    }
    return null;
  } catch {
    return null; // повреждённое сохранение считаем отсутствующим
  }
}

export async function writeSave(data: SaveData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // не удалось сохранить: игра продолжается без сохранения
  }
}

export async function clearSave(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}