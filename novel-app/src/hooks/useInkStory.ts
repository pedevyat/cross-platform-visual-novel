import { useCallback, useEffect, useRef, useState } from 'react';
import { Story } from 'inkjs';
import storyJson from '../../assets/story.json';
import type { Choice, Side } from '../components/types';

/** Имя собеседника: префикс «Анна: » вырезается из реплик */
const NPC_NAME = 'Анна';
/** Служебный индекс кнопки «Начать заново» */
export const RESTART_INDEX = -1;

const NPC_SIDE: Side = 'right'; // герой 2 (собеседник)
const PLAYER_SIDE: Side = 'left'; // герой 1 (игрок)

type SceneState = {
  text: string;
  speaker: Side;
  choices: Choice[];
  canNext: boolean;
};

const EMPTY: SceneState = { text: '', speaker: NPC_SIDE, choices: [], canNext: false };
const RESTART: Choice = { index: RESTART_INDEX, text: 'Начать заново' };

const stripName = (line: string) =>
  line.replace(new RegExp(`^${NPC_NAME}\\s*:\\s*`), '').trim();

const readChoices = (story: Story): Choice[] =>
  story.currentChoices.map((c) => ({ index: c.index, text: c.text }));

/** Варианты ответа, а если история закончилась, то кнопка рестарта */
const choicesOrRestart = (story: Story): Choice[] => {
  const choices = readChoices(story);
  return choices.length > 0 ? choices : [RESTART];
};

/** Следующая реплика собеседника (Анны) */
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
    // варианты ответа показываем только после последней реплики блока
    choices: story.canContinue ? [] : choicesOrRestart(story),
    canNext: story.canContinue,
  };
}

export function useInkStory() {
  const storyRef = useRef<Story | null>(null);
  const started = useRef(false);
  const [scene, setScene] = useState<SceneState>(EMPTY);

  const start = useCallback(() => {
    const story = new Story(storyJson as any);
    storyRef.current = story;
    setScene(nextNpcLine(story));
  }, []);

  // Запуск после монтирования (не во время рендера), чтобы не было
  // расхождения SSR и клиента
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
  }, [start]);

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
        start();
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
        canNext: story.canContinue, // следующий тап покажет ответ собеседника
      });
    },
    [scene.choices, start]
  );

  return { scene, next, choose };
}