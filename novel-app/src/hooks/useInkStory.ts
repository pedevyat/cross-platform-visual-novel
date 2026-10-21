import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Story } from 'inkjs';
import type { Choice, Side } from '../components/types';
import { loadStory, type LoadedStory } from '../story/storyLoader';
import { clearSave, readSave, writeSave } from '../story/saveStorage';

/** Имя собеседника: префикс «Лёха: » вырезается из реплик */
const NPC_NAME = 'Лёха';
/** Служебный индекс кнопки «Начать заново» */
export const RESTART_INDEX = -1;
/** Как часто проверять, не обновился ли сюжет на хостинге */
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

const NPC_SIDE: Side = 'right'; // герой 2 (собеседник)
const PLAYER_SIDE: Side = 'left'; // герой 1 (игрок)

type SceneState = {
  text: string;
  speaker: Side;
  choices: Choice[];
  canNext: boolean;
};

export type Notice = { text: string } | null;

const EMPTY: SceneState = { text: '', speaker: NPC_SIDE, choices: [], canNext: false };
const RESTART: Choice = { index: RESTART_INDEX, text: 'Начать заново' };

const stripName = (line: string) =>
  line.replace(new RegExp(`^${NPC_NAME}\\s*:\\s*`), '').trim();

const readChoices = (story: Story): Choice[] =>
  story.currentChoices.map((c) => ({ index: c.index, text: c.text }));

const choicesOrRestart = (story: Story): Choice[] => {
  const choices = readChoices(story);
  return choices.length > 0 ? choices : [RESTART];
};

function nextNpcLine(story: Story): SceneState {
  let text = '';
  while (story.canContinue && !text) {
    text = stripName(story.Continue() ?? '');
  }

  if (!text) {
    return { text: '', speaker: NPC_SIDE, choices: choicesOrRestart(story), canNext: false };
  }

  return {
    text,
    speaker: NPC_SIDE,
    choices: story.canContinue ? [] : choicesOrRestart(story),
    canNext: story.canContinue,
  };
}

function isScene(x: any): x is SceneState {
  return (
    !!x &&
    typeof x.text === 'string' &&
    (x.speaker === 'left' || x.speaker === 'right') &&
    Array.isArray(x.choices) &&
    typeof x.canNext === 'boolean'
  );
}

export function useInkStory() {
  const storyRef = useRef<Story | null>(null);
  const loadedRef = useRef<LoadedStory | null>(null); // версия, по которой идёт игра
  const pendingRef = useRef<LoadedStory | null>(null); // более новая версия с хостинга
  const dismissedRef = useRef<string | null>(null); // версия, от которой игрок отказался
  const readyRef = useRef(false);
  const started = useRef(false);

  const [scene, setScene] = useState<SceneState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  /** Начать историю с начала по заданной версии сюжета */
  const begin = useCallback((loaded: LoadedStory) => {
    const story = new Story(loaded.json);
    storyRef.current = story;
    loadedRef.current = loaded;
    setScene(nextNpcLine(story));
  }, []);

  // Запуск: загрузка сюжета, затем восстановление сохранения (если оно подходит)
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      const loaded = await loadStory();
      const save = await readSave();
      let restored = false;

      if (save) {
        if (save.version === loaded.version && isScene(save.scene)) {
          try {
            const story = new Story(loaded.json);
            story.state.LoadJson(save.state);
            storyRef.current = story;
            loadedRef.current = loaded;
            setScene(save.scene);
            restored = true;
          } catch {
            await clearSave(); // сохранение не загрузилось: начинаем заново
          }
        } else {
          await clearSave();
          if (save.version !== loaded.version) {
            setNotice({ text: 'Сюжет обновился, поэтому игра начата заново.' });
          }
        }
      }

      if (!restored) begin(loaded);
      readyRef.current = true;
      setLoading(false);
    })();
  }, [begin]);

  // Автосохранение после каждого изменения сцены
  useEffect(() => {
    if (!readyRef.current) return;
    const story = storyRef.current;
    const loaded = loadedRef.current;
    if (!story || !loaded) return;
    writeSave({ version: loaded.version, state: story.state.toJson(), scene });
  }, [scene]);

  // Проверка обновлений сюжета на хостинге
  const checkForUpdate = useCallback(async () => {
    const current = loadedRef.current;
    if (!current) return;
    const latest = await loadStory();
    if (
      latest.source === 'remote' &&
      latest.version !== current.version &&
      latest.version !== dismissedRef.current
    ) {
      pendingRef.current = latest;
      setUpdateAvailable(true);
    }
  }, []);

  useEffect(() => {
    // 'active': приложение вернулось на передний план или вкладка снова видна
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkForUpdate();
    });
    const id = setInterval(checkForUpdate, CHECK_INTERVAL_MS);
    return () => {
      sub.remove();
      clearInterval(id);
    };
  }, [checkForUpdate]);

  /** Принять новую версию: старое сохранение сбрасывается, игра начинается заново */
  const applyUpdate = useCallback(async () => {
    const latest = pendingRef.current;
    if (!latest) return;
    pendingRef.current = null;
    await clearSave();
    begin(latest);
    setUpdateAvailable(false);
    setNotice(null);
  }, [begin]);

  /** Отказаться: баннер не показывается снова для этой версии */
  const dismissUpdate = useCallback(() => {
    dismissedRef.current = pendingRef.current?.version ?? null;
    setUpdateAvailable(false);
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  /** Тап по реплике: следующая строка собеседника */
  const next = useCallback(() => {
    const story = storyRef.current;
    if (!story || !story.canContinue) return;
    setScene(nextNpcLine(story));
  }, []);

  /** Выбор игрока: его ответ показывается над героем 1 */
  const choose = useCallback(
    (index: number) => {
      if (index === RESTART_INDEX) {
        const loaded = loadedRef.current;
        if (loaded) begin(loaded);
        return;
      }
      const story = storyRef.current;
      if (!story) return;

      const picked = scene.choices.find((c) => c.index === index);
      story.ChooseChoiceIndex(index);

      setScene({
        text: picked?.text ?? '',
        speaker: PLAYER_SIDE,
        choices: story.canContinue ? [] : choicesOrRestart(story),
        canNext: story.canContinue,
      });
    },
    [scene.choices, begin]
  );

  return {
    scene,
    loading,
    next,
    choose,
    notice,
    dismissNotice,
    updateAvailable,
    applyUpdate,
    dismissUpdate,
  };
}