import { useState, useRef } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Story } from 'inkjs';
import storyJson from '../../assets/story.json';

export default function NovelScreen() {
  const story = useRef(new Story(storyJson as any)).current;
  const [lines, setLines] = useState<string[]>([]);
  const [choices, setChoices] = useState<{ index: number; text: string }[]>([]);

  const advance = () => {
    const newLines: string[] = [];
    while (story.canContinue) {
      newLines.push(story.Continue()!.trim());
    }
    setLines((prev) => [...prev, ...newLines]);
    setChoices(story.currentChoices.map((c) => ({ index: c.index, text: c.text })));
  };

  const choose = (index: number) => {
    story.ChooseChoiceIndex(index);
    advance();
  };

  // первый запуск
  const started = useRef(false);
  if (!started.current) {
    started.current = true;
    advance();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
      {lines.map((l, i) => (
        <Text key={i} style={{ fontSize: 18, marginBottom: 12 }}>{l}</Text>
      ))}
      {choices.map((c) => (
        <Pressable
          key={c.index}
          onPress={() => choose(c.index)}
          style={{ padding: 14, backgroundColor: '#ddd', borderRadius: 8, marginTop: 8 }}
        >
          <Text style={{ fontSize: 16 }}>{c.text}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}