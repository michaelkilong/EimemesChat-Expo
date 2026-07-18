// screens/EditProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Colors } from '../theme';

export default function EditProfileScreen({ navigation, route }: any) {
  const user = auth.currentUser;
  const [name, setName] = useState(user?.displayName || '');
  const [photoBase64, setPhotoBase64] = useState(user?.photoURL || '');
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Photo library access is needed.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      setPhotoBase64(result.assets[0].base64);
    }
  };

  const removePhoto = () => setPhotoBase64('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name.');
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: name.trim(),
        profilePhoto: photoBase64 || null,
      });
      // Optionally update Auth profile
      // await updateProfile(user, { displayName: name.trim(), photoURL: photoBase64 });
      route.params?.onUpdate?.(name.trim(), photoBase64);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveBtn, saving && { opacity: 0.5 }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            {photoBase64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${photoBase64}` }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={{ color: Colors.accent, fontSize: 32 }}>👤</Text>
            )}
          </View>
          <View style={styles.photoActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
              <Text style={styles.actionBtnText}>
                {photoBase64 ? 'Change Photo' : 'Add Photo'}
              </Text>
            </TouchableOpacity>
            {photoBase64 ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.removeBtn]}
                onPress={removePhoto}
              >
                <Text style={[styles.actionBtnText, { color: Colors.red }]}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Colors.text3}
            style={styles.input}
            maxLength={60}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgA },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: Colors.glass1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderB,
  },
  backBtn: { fontSize: 16, color: Colors.accent },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.text1 },
  saveBtn: { fontSize: 16, fontWeight: '600', color: Colors.accent },
  content: { padding: 24 },
  avatarBlock: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
  },
  avatarImage: { width: '100%', height: '100%' },
  photoActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.glass2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: { fontSize: 14, fontWeight: '500', color: Colors.text1 },
  removeBtn: {
    backgroundColor: Colors.redBg,
    borderColor: Colors.redBorder,
  },
  inputWrap: { marginBottom: 24 },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: Colors.text2,
    marginBottom: 8,
  },
  input: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.glass2,
    fontSize: 15,
    color: Colors.text1,
  },
});