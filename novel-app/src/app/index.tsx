import NovelScene from '../components/NovelScene';

export default function Index() {
  // Временные заглушки: позже сюда подключится inkjs
  return (
    <NovelScene
      speaker="left"
      text="Здесь будет реплика героя."
      choices={[
        { index: 0, text: 'Вариант ответа 1' },
        { index: 1, text: 'Вариант ответа 2' },
      ]}
      onChoose={(i) => console.log('выбран вариант', i)}
    />
  );
}