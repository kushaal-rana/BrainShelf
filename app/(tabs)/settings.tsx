import { ComponentProps, useEffect, useState } from 'react';
import { View, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Card, Button } from '../../components/ui';
import { colors, radius, space } from '../../theme/obsidian';
import { useAuth, signIn, signOut } from '../../lib/auth';
import { useRootFolder, setRootFolder } from '../../lib/rootFolder';
import { extractFolderId, getFolderName } from '../../lib/drive';

type IconName = ComponentProps<typeof Ionicons>['name'];

function Row({ icon, label, value }: { icon: IconName; label: string; value?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md }}>
      <Ionicons name={icon} size={20} color={colors.gold} />
      <Text variant="body" style={{ flex: 1 }}>
        {label}
      </Text>
      {value ? (
        <Text variant="caption" color="muted">
          {value}
        </Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      )}
    </View>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { rootId } = useRootFolder();
  const [input, setInput] = useState('');
  const [folderName, setFolderName] = useState<string | null>(null);
  const [folderError, setFolderError] = useState<string | null>(null);

  // Show the saved folder's name as confirmation it resolved.
  useEffect(() => {
    if (!rootId) {
      setFolderName(null);
      return;
    }
    let active = true;
    getFolderName(rootId)
      .then((name) => {
        if (active) setFolderName(name);
      })
      .catch(() => {
        if (active) setFolderName(null);
      });
    return () => {
      active = false;
    };
  }, [rootId]);

  const saveFolder = () => {
    const id = extractFolderId(input);
    if (!id) {
      setFolderError('Paste a valid Drive folder link or ID');
      return;
    }
    setFolderError(null);
    setInput('');
    void setRootFolder(id);
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingVertical: space.xl, gap: space.lg }}
      >
        <View style={{ gap: space.xs }}>
          <Text variant="label" color="gold">
            PREFERENCES
          </Text>
          <Text variant="title">Settings</Text>
        </View>

        <Card style={{ gap: space.md }}>
          <Row
            icon="person-circle-outline"
            label="Google account"
            value={user ? user.user.email : 'Not connected'}
          />
          {user ? (
            <Button label="Sign out" variant="ghost" onPress={() => void signOut()} />
          ) : (
            <Button label="Connect Google account" onPress={() => void signIn()} />
          )}
        </Card>

        {user ? (
          <Card style={{ gap: space.md }}>
            <Text variant="label" color="gold">
              COURSE FOLDER
            </Text>
            <Text variant="caption" color="muted">
              Paste the Drive link or ID of the folder that holds your courses.
            </Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={rootId ? 'Paste a new link to change' : 'https://drive.google.com/drive/folders/…'}
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                color: colors.text,
                backgroundColor: colors.bg,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.hairline,
                padding: space.md,
                fontSize: 13,
              }}
            />
            {folderError ? (
              <Text variant="caption" color="danger">
                {folderError}
              </Text>
            ) : rootId ? (
              <Text variant="caption" color="muted">
                Current: {folderName ?? '…'}
              </Text>
            ) : null}
            <Button label="Save folder" variant="secondary" onPress={saveFolder} />
          </Card>
        ) : null}

        <Card padded={false} style={{ paddingHorizontal: space.lg }}>
          <Row icon="play-circle-outline" label="Playback" />
          <Row icon="download-outline" label="Download quality" value="1080p" />
        </Card>

        <Text variant="caption" color="muted" center>
          BrainShelf · v1.0.0
        </Text>
      </ScrollView>
    </Screen>
  );
}
