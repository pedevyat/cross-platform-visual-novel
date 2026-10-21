import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NovelScene } from '../components/NovelScene';
import { useInkStory } from '../hooks/useInkStory';

type BannerProps = {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissLabel: string;
  onDismiss: () => void;
};

function Banner({ text, actionLabel, onAction, dismissLabel, onDismiss }: BannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{text}</Text>
      <View style={styles.bannerButtons}>
        {actionLabel && onAction ? (
          <Pressable onPress={onAction} style={[styles.btn, styles.btnPrimary]}>
            <Text style={styles.btnText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onDismiss} style={styles.btn}>
          <Text style={styles.btnText}>{dismissLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function Index() {
  const { scene, next, choose, notice, dismissNotice, updateAvailable, applyUpdate, dismissUpdate } =
    useInkStory();

  return (
    <View style={styles.root}>
      <NovelScene
        speaker={scene.speaker}
        text={scene.text}
        choices={scene.choices}
        onNext={scene.canNext ? next : undefined}
        onChoose={choose}
      />

      {updateAvailable ? (
        <Banner
          text="Вышла новая версия сюжета. Чтобы увидеть её, игру нужно начать заново."
          actionLabel="Обновить"
          onAction={applyUpdate}
          dismissLabel="Позже"
          onDismiss={dismissUpdate}
        />
      ) : notice ? (
        <Banner text={notice.text} dismissLabel="OK" onDismiss={dismissNotice} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    zIndex: 10,
    alignSelf: 'center',
    maxWidth: 696,
    backgroundColor: '#fff4d6',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  bannerText: { color: '#3d2f00', fontSize: 15, lineHeight: 21 },
  bannerButtons: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#e8dcb5',
  },
  btnPrimary: { backgroundColor: '#f2b600' },
  btnText: { color: '#3d2f00', fontSize: 15 },
});