import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import type { Choice, Side } from './types';

type Props = {
  /** Кто говорит сейчас: left = герой 1 (игрок), right = герой 2 (собеседник) */
  speaker: Side;
  /** Текст реплики */
  text: string;
  /** Варианты ответа (внизу экрана) */
  choices: Choice[];
  /** Тап по реплике (следующая реплика) */
  onNext?: () => void;
  onChoose: (index: number) => void;
};

// Пути от src/components до novel-app/assets. Поправьте имена файлов при необходимости.
const heroLeft = require('../../assets/images/hero1.webp');
const heroRight = require('../../assets/images/hero2.webp');

export function NovelScene({ speaker, text, choices, onNext, onChoose }: Props) {
  return (
    <Pressable style={styles.root} onPress={onNext} disabled={!onNext}>
      {/* Реплика: пузырь над говорящим героем */}
      <View style={styles.dialogueZone}>
        {text !== '' && (
          <View
            style={[
              styles.bubble,
              speaker === 'left' ? styles.bubbleLeft : styles.bubbleRight,
              speaker === 'left' && styles.bubblePlayer,
            ]}
          >
            <Text style={styles.bubbleText}>{text}</Text>
            <View
              style={[
                styles.tail,
                speaker === 'left' ? { left: 40 } : { right: 40 },
                speaker === 'left' && styles.tailPlayer,
              ]}
            />
          </View>
        )}
      </View>
 
      {/* Герои */}
      <View style={styles.heroes}>
        <Image
          source={heroLeft}
          resizeMode="contain"
          style={[styles.hero, speaker !== 'left' && styles.dimmed]}
        />
        <Image
          source={heroRight}
          resizeMode="contain"
          style={[styles.hero, speaker !== 'right' && styles.dimmed]}
        />
      </View>
 
      {/* Варианты ответа */}
      <View style={styles.choices}>
        {choices.map((c) => (
          <Pressable
            key={c.index}
            onPress={() => onChoose(c.index)}
            style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
          >
            <Text style={styles.choiceText}>{c.text}</Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1d2433',
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 12,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  dialogueZone: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  bubble: {
    maxWidth: '88%',
    backgroundColor: '#f6f1e7',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubblePlayer: { backgroundColor: '#cfe0ff' },
  bubbleText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#1d2433',
  },
  tail: {
    position: 'absolute',
    bottom: -9,
    width: 20,
    height: 20,
    backgroundColor: '#f6f1e7',
    transform: [{ rotate: '45deg' }],
    borderBottomRightRadius: 4,
  },
  tailPlayer: { backgroundColor: '#cfe0ff' },
  heroes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  hero: {
    flex: 1,
    aspectRatio: 3 / 4,
    maxHeight: 420,
  },
  dimmed: { opacity: 0.55 },
  choices: {
    marginTop: 16,
    gap: 10,
    minHeight: 130,
  },
  choice: {
    backgroundColor: '#3a4a6b',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  choicePressed: { backgroundColor: '#51669a' },
  choiceText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
});