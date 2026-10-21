import { signOut } from '@react-native-firebase/auth';
import { deleteField, doc, onSnapshot, updateDoc } from '@react-native-firebase/firestore';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily, ProfileColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { auth, firestore } from '@/lib/firebase';

type UserProfile = {
  firstName: string;
  lastName?: string;
  username: string;
  email: string;
};

type ProfileTab = 'account' | 'history';
type EditableField = 'name' | 'email' | 'username';
type ConfirmDialog = 'signOut' | 'deleteAccount';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<ProfileTab>('account');
  const [editing, setEditing] = useState<EditableField | null>(null);
  const [dialog, setDialog] = useState<ConfirmDialog | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    return onSnapshot(doc(firestore, 'users', user.uid), (snapshot) => {
      setProfile((snapshot.data() as UserProfile | undefined) ?? null);
    });
  }, [user]);

  const fullName = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(' ') : '';

  async function handleSave(field: EditableField, value: string) {
    if (!user) {
      return;
    }
    const trimmed = value.trim();
    try {
      if (field === 'name') {
        const [firstName, ...rest] = trimmed.split(/\s+/);
        if (!firstName) {
          Alert.alert('Name is required.');
          return;
        }
        const lastName = rest.join(' ');
        await updateDoc(doc(firestore, 'users', user.uid), {
          firstName,
          lastName: lastName === '' ? deleteField() : lastName,
        });
      } else {
        // TODO: email changes need verifyBeforeUpdateEmail(), and username changes need the
        // `usernames` lookup doc moved, which firestore.rules doesn't allow from the client yet.
        Alert.alert('Not available yet', `Changing your ${field} isn't supported yet.`);
        return;
      }
      setEditing(null);
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : undefined);
    }
  }

  function handleSignOut() {
    setDialog(null);
    signOut(auth).catch((err) => {
      Alert.alert('Sign out failed', err instanceof Error ? err.message : undefined);
    });
  }

  function handleDeleteAccount() {
    setDialog(null);
    // TODO: delete the user's Firestore data and auth account (needs a backend function, since
    // firestore.rules blocks client deletes of `users` and `usernames` docs).
    Alert.alert('Not available yet', "Deleting your account isn't supported yet.");
  }

  const fields: { key: EditableField; label: string; value: string }[] = [
    { key: 'name', label: 'Name', value: fullName },
    { key: 'email', label: 'Email', value: profile?.email ?? '' },
    { key: 'username', label: 'Username', value: profile?.username ?? '' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.avatar} />
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={2}>
              {fullName}
            </Text>
            <Text style={styles.username}>{profile?.username}</Text>
          </View>
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          <TabButton label="Account" active={tab === 'account'} onPress={() => setTab('account')} />
          <TabButton
            label="Report History"
            active={tab === 'history'}
            onPress={() => setTab('history')}
          />
        </View>

        {tab === 'account' ? (
          <>
            <View style={styles.fields}>
              {fields.map((field) =>
                editing === field.key ? (
                  <EditingField
                    key={field.key}
                    label={field.label}
                    initialValue={field.value}
                    onCancel={() => setEditing(null)}
                    onSave={(value) => handleSave(field.key, value)}
                  />
                ) : (
                  <ProfileField
                    key={field.key}
                    label={field.label}
                    value={field.value}
                    onEdit={() => setEditing(field.key)}
                  />
                ),
              )}
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.deleteButton} onPress={() => setDialog('deleteAccount')}>
                <Text style={styles.deleteText}>Delete account</Text>
              </Pressable>
              <Pressable style={styles.signOutButton} onPress={() => setDialog('signOut')}>
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            </View>
          </>
        ) : (
          // TODO: list the user's reports.
          <Text style={styles.emptyText}>No reports yet.</Text>
        )}
      </ScrollView>

      <ConfirmModal
        visible={dialog === 'signOut'}
        icon={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }}
        iconColor={ProfileColors.primary}
        title="Signout"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign out"
        confirmColor={ProfileColors.primary}
        cancelColor={ProfileColors.primary}
        onCancel={() => setDialog(null)}
        onConfirm={handleSignOut}
      />
      <ConfirmModal
        visible={dialog === 'deleteAccount'}
        icon={{ ios: 'trash', android: 'delete', web: 'delete' }}
        iconColor={ProfileColors.destructive}
        title="Delete your account?"
        message="Your account and all associated data will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete account"
        confirmColor={ProfileColors.destructive}
        cancelColor={ProfileColors.text}
        onCancel={() => setDialog(null)}
        onConfirm={handleDeleteAccount}
      />
    </SafeAreaView>
  );
}

type TabButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function TabButton({ label, active, onPress }: TabButtonProps) {
  return (
    <Pressable
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

type ProfileFieldProps = {
  label: string;
  value: string;
  onEdit: () => void;
};

function ProfileField({ label, value, onEdit }: ProfileFieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldBody}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
      <Pressable
        style={styles.editButton}
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${label.toLowerCase()}`}>
        <SymbolView
          name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
          size={12}
          tintColor={ProfileColors.primary}
        />
        <Text style={styles.editText}>Edit</Text>
      </Pressable>
    </View>
  );
}

type EditingFieldProps = {
  label: string;
  initialValue: string;
  onCancel: () => void;
  onSave: (value: string) => void;
};

// Inline editor that replaces a field's card while it's being edited.
function EditingField({ label, initialValue, onCancel, onSave }: EditingFieldProps) {
  const [value, setValue] = useState(initialValue);

  return (
    <View style={styles.editingField}>
      <Text style={styles.editingLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        autoFocus
        autoCapitalize={label === 'Name' ? 'words' : 'none'}
        keyboardType={label === 'Email' ? 'email-address' : 'default'}
        accessibilityLabel={label}
      />
      <View style={styles.editingActions}>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.saveButton} onPress={() => onSave(value)}>
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>
    </View>
  );
}

type ConfirmModalProps = {
  visible: boolean;
  icon: SymbolViewProps['name'];
  iconColor: string;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  cancelColor: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmModal({
  visible,
  icon,
  iconColor,
  title,
  message,
  confirmLabel,
  confirmColor,
  cancelColor,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Swallow presses on the card so they don't dismiss the dialog. */}
        <Pressable style={styles.dialog} onPress={() => {}}>
          <Pressable
            style={styles.closeButton}
            onPress={onCancel}
            hitSlop={Spacing.two}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={20}
              tintColor={ProfileColors.text}
            />
          </Pressable>
          <View style={styles.dialogTitleRow}>
            <SymbolView name={icon} size={18} tintColor={iconColor} />
            <Text style={styles.dialogTitle}>{title}</Text>
          </View>
          <Text style={styles.dialogMessage}>{message}</Text>
          <View style={styles.dialogActions}>
            <Pressable style={styles.dialogCancel} onPress={onCancel}>
              <Text style={[styles.dialogCancelText, { color: cancelColor }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.dialogConfirm, { backgroundColor: confirmColor }]}
              onPress={onConfirm}>
              <Text style={styles.dialogConfirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ProfileColors.background },
  content: {
    paddingHorizontal: 20,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    paddingHorizontal: Spacing.one,
    marginBottom: Spacing.thirteen,
  },
  avatar: {
    width: 91,
    height: 91,
    borderRadius: 45.5,
    backgroundColor: ProfileColors.avatar,
  },
  headerText: { flex: 1, gap: Spacing.two },
  name: { fontSize: 24, fontFamily: FontFamily.medium, color: ProfileColors.text },
  username: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.text },
  tabs: { flexDirection: 'row', marginBottom: Spacing.three },
  tab: {
    paddingHorizontal: Spacing.ten,
    paddingVertical: Spacing.seven,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    backgroundColor: ProfileColors.tabActiveBackground,
    borderBottomColor: ProfileColors.tabIndicator,
  },
  tabText: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.tabText },
  tabTextActive: { color: ProfileColors.tabActiveText },
  fields: { gap: Spacing.three },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ProfileColors.border,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.seven,
    paddingVertical: Spacing.seven,
  },
  fieldBody: { flex: 1, gap: Spacing.one },
  fieldLabel: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.label },
  fieldValue: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.text },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: ProfileColors.primary,
    borderRadius: 500,
    paddingHorizontal: Spacing.seven,
    paddingVertical: Spacing.two,
  },
  editText: { fontFamily: FontFamily.regular, fontSize: 12, color: ProfileColors.primary },
  editingField: {
    gap: Spacing.seven,
    backgroundColor: ProfileColors.editingBackground,
    borderWidth: 1,
    borderColor: ProfileColors.editingBorder,
    borderRadius: Spacing.one,
    padding: Spacing.three,
  },
  editingLabel: { fontFamily: FontFamily.regular, fontSize: 12, color: ProfileColors.text },
  input: {
    backgroundColor: ProfileColors.background,
    borderWidth: 1,
    borderColor: ProfileColors.inputBorder,
    borderRadius: Spacing.one,
    paddingHorizontal: Spacing.seven,
    paddingVertical: Spacing.seven,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: ProfileColors.text,
  },
  editingActions: { flexDirection: 'row', gap: Spacing.two },
  cancelButton: {
    backgroundColor: ProfileColors.background,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.ten,
  },
  cancelText: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.primary },
  saveButton: {
    backgroundColor: ProfileColors.primary,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.ten,
  },
  saveText: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.onPrimary },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.twelve,
  },
  deleteButton: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.ten },
  deleteText: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.primary },
  signOutButton: {
    backgroundColor: ProfileColors.signOutBackground,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.ten,
  },
  signOutText: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.signOutText },
  emptyText: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.label, marginTop: Spacing.three },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    backgroundColor: ProfileColors.backdrop,
  },
  dialog: {
    backgroundColor: ProfileColors.background,
    borderRadius: Spacing.two,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.eleven,
    paddingBottom: Spacing.five,
  },
  closeButton: { alignSelf: 'flex-end', marginRight: Spacing.one, marginBottom: Spacing.one },
  dialogTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  dialogTitle: { fontSize: 20, fontFamily: FontFamily.semiBold, color: ProfileColors.dialogText },
  dialogMessage: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.dialogMessageText, lineHeight: 16.8 },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  dialogCancel: { flex: 1, alignItems: 'center', paddingVertical: Spacing.ten },
  dialogCancelText: { fontFamily: FontFamily.regular, fontSize: 14 },
  dialogConfirm: {
    flex: 1,
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.ten,
  },
  dialogConfirmText: { fontFamily: FontFamily.regular, fontSize: 14, color: ProfileColors.onPrimary },
});
