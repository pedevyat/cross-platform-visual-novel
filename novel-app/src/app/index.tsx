import { NovelScene } from '../components/NovelScene';
import { useInkStory } from '../hooks/useInkStory';

export default function Index() {
  const { scene, next, choose } = useInkStory();

  return (
    <NovelScene
      speaker={scene.speaker}
      text={scene.text}
      choices={scene.choices}
      onNext={scene.canNext ? next : undefined}
      onChoose={choose}
    />
  );
}