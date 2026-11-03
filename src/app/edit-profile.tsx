import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { getFriendlyAuthError } from '@/lib/errors/friendly-message';
import { storage } from '@/lib/firebase/config';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { useAosell } from '@/providers/aosell-provider';

// Square crop + downscale, same ceiling as post photos (post/create.tsx) —
// an avatar never needs more than this to look sharp at any size it's shown.
const AVATAR_DIMENSION = 512;
const AVATAR_COMPRESSION_QUALITY = 0.8;

export default function EditProfileScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentUser, userProfile, updateUserProfile } = useAosell();

  const [displayName, setDisplayName] = useState(userProfile?.displayName ?? '');
  const [avatarUri, setAvatarUri] = useState(userProfile?.avatarUrl);
  const [pickedAvatarUri, setPickedAvatarUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const initials = (displayName || currentUser?.email || '?').slice(0, 2).toUpperCase();
  const canSave = !isSaving && displayName.trim().length > 0;

  async function handlePickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('editProfile.errorTitle'), t('editProfile.errorDescription'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled) {
      return;
    }

    const manipulated = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: AVATAR_DIMENSION, height: AVATAR_DIMENSION } }],
      { compress: AVATAR_COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    setPickedAvatarUri(manipulated.uri);
    setAvatarUri(manipulated.uri);
  }

  async function handleSave() {
    if (!currentUser || !canSave) {
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      let nextAvatarUrl = userProfile?.avatarUrl;

      if (pickedAvatarUri) {
        const response = await fetch(pickedAvatarUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `avatars/${currentUser.id}/avatar.jpg`);
        await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
        nextAvatarUrl = await getDownloadURL(storageRef);
      }

      await updateUserProfile({ displayName: displayName.trim(), avatarUrl: nextAvatarUrl });
      router.back();
    } catch (saveError) {
      setError(getFriendlyAuthError(saveError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppScreen>
      <SectionTitle eyebrow={t('editProfile.eyebrow')} title={t('editProfile.title')} />

      <Pressable accessibilityLabel={t('editProfile.changePhoto')} onPress={() => void handlePickAvatar()} style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
            {avatarUri ? (
              <Image contentFit="cover" source={{ uri: avatarUri }} style={StyleSheet.absoluteFillObject} />
            ) : (
              <Text style={[styles.avatarInitials, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
                {initials}
              </Text>
            )}
          </View>
          <View style={[styles.cameraBadge, { backgroundColor: theme.colors.accent, borderColor: theme.colors.background }]}>
            <SymbolView tintColor={theme.colors.onAccent} size={15} name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }} />
          </View>
        </View>
        <Text style={[styles.changePhotoLabel, { color: theme.colors.accent, fontFamily: theme.typography.label.fontFamily }]}>
          {t('editProfile.changePhoto')}
        </Text>
      </Pressable>

      <AppInput label={t('editProfile.nameLabel')} onChangeText={setDisplayName} placeholder={t('editProfile.namePlaceholder')} value={displayName} />

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: theme.colors.errorTint, borderRadius: theme.radii.md }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      ) : null}

      <AppButton
        disabled={!canSave}
        fullWidth
        label={t('editProfile.save')}
        loading={isSaving}
        loadingLabel={t('editProfile.saving')}
        onPress={() => void handleSave()}
      />
    </AppScreen>
  );
}

const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  avatarSection: { alignItems: 'center', gap: 10 },
  avatarWrap: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarInitials: { fontSize: 28, lineHeight: 34 },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoLabel: { fontSize: 13, lineHeight: 18 },
  errorBox: { padding: 12 },
  errorText: { fontSize: 13, lineHeight: 18 },
});
