// PersonalizationView.tsx — v1.0 (Expo)
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import { haptic } from '../lib/haptic';

interface Props { onBack: () => void; }

const TONES = ['Friendly', 'Professional', 'Concise', 'Funny'];

export default function PersonalizationView({ onBack }: Props) {
  const { currentUser, theme, showToast } = useApp();
  const [tone,               setTone]               = useState('Friendly');
  const [nickname,           setNickname]           = useState('');
  const [occupation,         setOccupation]         = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [saving,             setSaving]             = useState(false);
  const [loaded,             setLoaded]             = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, 'users', currentUser.uid))
      .then(snap => {
        if (snap.exists()) {
          const p = snap.data().preferences || {};
          if (p.tone)               setTone(p.tone);
          if (p.nickname)           setNickname(p.nickname);
          if (p.occupation)         setOccupation(p.occupation);
          if (p.customInstructions) setCustomInstructions(p.customInstructions);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser || saving) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        { preferences: { tone, nickname, occupation, customInstructions } },
        { merge: true }
      );
      haptic.success();
      showToast('Preferences saved');
      onBack();
    } catch {
      showToast('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = [styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text1 }];
  const labelStyle = [styles.label, { color: theme.text2 }];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={[styles.circleBtn, { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.35)' }]}
        >
          <Text style={{ color: theme.text1, fontSize: 20 }}>‹</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text1 }]}>Personalization</Text>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || !loaded}
          activeOpacity={0.7}
          style={[styles.circleBtn, { backgroundColor: saving ? 'rgba(255,255,255,0.05)' : theme.accentDim, borderWidth: 0, opacity: saving ? 0.5 : 1 }]}
        >
          {saving
            ? <ActivityIndicator size="small" color={theme.accent} />
            : <Text style={{ color: theme.accent, fontSize: 18 }}>✓</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tone */}
        <View style={{ marginBottom: 24 }}>
          <Text style={labelStyle}>Base tone</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {TONES.map(t => (
              <TouchableOpacity
                key={t}
                onPress={() => setTone(t)}
                activeOpacity={0.7}
                style={[
                  styles.toneChip,
                  {
                    borderColor: tone === t ? theme.accent : theme.border,
                    backgroundColor: tone === t ? theme.accentDim : 'rgba(255,255,255,0.04)',
                  },
                ]}
              >
                <Text style={{ color: tone === t ? theme.accent : theme.text2, fontSize: 14, fontWeight: '500' }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: theme.text3, marginTop: 8 }}>
            The main voice and tone the AI uses in your conversations.
          </Text>
        </View>

        {/* Nickname */}
        <View style={{ marginBottom: 24 }}>
          <Text style={labelStyle}>Your nickname</Text>
          <TextInput
            style={inputStyle}
            placeholder="What should the AI call you?"
            placeholderTextColor={theme.text3}
            value={nickname}
            onChangeText={setNickname}
            maxLength={40}
          />
        </View>

        {/* Occupation */}
        <View style={{ marginBottom: 24 }}>
          <Text style={labelStyle}>Your occupation</Text>
          <TextInput
            style={inputStyle}
            placeholder="Engineer, student, designer..."
            placeholderTextColor={theme.text3}
            value={occupation}
            onChangeText={setOccupation}
            maxLength={60}
          />
          <Text style={{ fontSize: 12, color: theme.text3, marginTop: 8 }}>
            Helps the AI tailor responses to your context.
          </Text>
        </View>

        {/* Custom instructions */}
        <View style={{ marginBottom: 24 }}>
          <Text style={labelStyle}>Custom instructions</Text>
          <TextInput
            style={[inputStyle, { minHeight: 120, textAlignVertical: 'top' }]}
            placeholder={"Anything else you'd like the AI to keep in mind — interests, preferences, how you like responses formatted..."}
            placeholderTextColor={theme.text3}
            value={customInstructions}
            onChangeText={setCustomInstructions}
            maxLength={500}
            multiline
          />
          <Text style={{ fontSize: 12, color: theme.text3, marginTop: 6, textAlign: 'right' }}>
            {customInstructions.length}/500
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: 20, fontWeight: '700' },
  label:     { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, marginBottom: 8 },
  input:     { borderRadius: 16, borderWidth: 1, padding: 14, paddingHorizontal: 16, fontSize: 15, lineHeight: 22 },
  toneChip:  { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5 },
});
