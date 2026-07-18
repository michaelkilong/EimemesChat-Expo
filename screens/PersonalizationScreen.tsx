// screens/PersonalizationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Colors } from '../theme';

const TONES = ['Friendly', 'Professional', 'Concise', 'Funny'];

export default function PersonalizationScreen({ navigation }: any) {
  const [tone, setTone] = useState('Friendly');
  const [nickname, setNickname] = useState('');
  const [occupation, setOccupation] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    getDoc(doc(db, 'users', user.uid))
      .then(snap => {
        if (snap.exists()) {
          const p = snap.data().preferences || {};
          if (p.tone) setTone(p.tone);
          if (p.nickname) setNickname(p.nickname);
          if (p.occupation) setOccupation(p.occupation);
          if (p.customInstructions) setCustomInstructions(p.customInstructions);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user || saving) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          preferences: { tone, nickname, occupation, customInstructions },
        },
        { merge: true }
      );
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
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personalization</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving || !loaded}>
          <Text style={[styles.saveBtn, (saving || !loaded) && { opacity: 0.5 }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Tone */}
        <Text style={styles.label}>Base tone</Text>
        <View style={styles.toneRow}>
          {TONES.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setTone(t)}
              style={[
                styles.toneChip,
                tone === t && styles.toneChipActive,
              ]}
            >
              <Text
                style={[
                  styles.toneChipText,
                  tone === t && styles.toneChipTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.hint}>The main voice and tone the AI uses in your conversations.</Text>

        {/* Nickname */}
        <Text style={styles.label}>Your nickname</Text>
        <TextInput
          style={styles.input}
          placeholder="What should the AI call you?"
          placeholderTextColor={Colors.text3}
          value={nickname}
          onChangeText={setNickname}
          maxLength={40}
        />

        {/* Occupation */}
        <Text style={styles.label}>Your occupation</Text>
        <TextInput
          style={styles.input}
          placeholder="Engineer, student, designer..."
          placeholderTextColor={Colors.text3}
          value={occupation}
          onChangeText={setOccupation}
          maxLength={60}
        />
        <Text style={styles.hint}>Helps the AI tailor responses to your context.</Text>

        {/* Custom instructions */}
        <Text style={styles.label}>Custom instructions</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Anything else you'd like the AI to keep in mind…"
          placeholderTextColor={Colors.text3}
          value={customInstructions}
          onChangeText={setCustomInstructions}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={[styles.hint, { textAlign: 'right' }]}>
          {customInstructions.length}/500
        </Text>
      </ScrollView>
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
  content: { padding: 20, paddingBottom: 40 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: Colors.text2,
    marginBottom: 8,
  },
  toneRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  toneChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.glass2,
  },
  toneChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  toneChipText: { fontSize: 14, fontWeight: '500', color: Colors.text2 },
  toneChipTextActive: { color: Colors.accent },
  hint: { fontSize: 12, color: Colors.text3, marginTop: 6, marginBottom: 16 },
  input: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.glass2,
    fontSize: 15,
    color: Colors.text1,
    marginBottom: 16,
  },
  textArea: { minHeight: 120, lineHeight: 22 },
});