import Constants from 'expo-constants';
import { Platform } from 'react-native';
// Запасная копия сюжета, вшитая в приложение (на случай, если хостинг недоступен)
import bundledStory from '../../assets/story.json';

/**
 * Адрес сайта на GitHub Pages. Используется нативным приложением (APK),
 * чтобы тоже подтягивать свежий сюжет. В вебе берётся путь относительно baseUrl.
 */
const REMOTE_BASE = 'https://pedevyat.github.io/cross-platform-visual-novel';

export type LoadedStory = {
  /** Сюжет в виде JSON-строки (для inkjs) */
  json: string;
  /** Версия = хеш содержимого сюжета */
  version: string;
  /** Откуда загружен: с хостинга или из запасной копии */
  source: 'remote' | 'bundled';
};

function storyUrl(): string {
  if (Platform.OS === 'web') {
    const base = Constants.expoConfig?.experiments?.baseUrl ?? '';
    return `${base}/story.json`;
  }
  return `${REMOTE_BASE}/story.json`;
}

/** Простой нестойкий хеш (djb2-вариант): нам нужно только сравнивать версии */
function hashText(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) {
    h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  }
  return h.toString(16);
}

/** Приводим сюжет к единому виду, чтобы версии с хостинга и из бандла сравнивались честно */
function pack(obj: unknown, source: LoadedStory['source']): LoadedStory {
  const json = JSON.stringify(obj);
  return { json, version: hashText(json), source };
}

export async function loadStory(): Promise<LoadedStory> {
  try {
    // Параметр в адресе и no-store обходят кеш браузера и CDN
    const res = await fetch(`${storyUrl()}?_=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const parsed = await res.json();
    // Проверяем, что это действительно скомпилированный сюжет Ink
    if (!parsed || typeof parsed !== 'object' || !('inkVersion' in parsed) || !('root' in parsed)) {
      throw new Error('Некорректный формат story.json');
    }
    return pack(parsed, 'remote');
  } catch {
    return pack(bundledStory, 'bundled');
  }
}