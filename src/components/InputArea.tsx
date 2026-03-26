// InputArea.tsx — v1.1 (Expo)
// v1.1: Fixed file reading (expo-file-system, no FileReader), exact SVG icons.
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { haptic } from '../lib/haptic';
import {
  IconPaperclip, IconGlobe, IconSend, IconStop, IconX,
} from '../lib/Icons';
import type { Attachment } from '../types';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

const FILE_ICONS: Record<string, string> = {
  image: '🖼️', pdf: '📄', text: '📝', docx: '📄',
};

interface Props {
  onSend: (text: string, attachment?: Attachment, useWebSearch?: boolean) => void;
  onStop: () => void;
  isSending: boolean;
  isStreaming: boolean;
  dailyLimitReached: boolean;
}

export default function InputArea({ onSend, onStop, isSending, isStreaming, dailyLimitReached }: Props) {
  const { theme } = useApp();
  const [value,      setValue]      = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [processing, setProcessing] = useState(false);
  const [webSearch,  setWebSearch]  = useState(false);
  const insets = useSafeAreaInsets();

  const canSend = (value.trim().length > 0 || attachment !== null)
    && !isSending && !isStreaming && !dailyLimitReached && !processing;

  const handleSend = () => {
    if (!canSend) return;
    haptic.medium();
    const text = value.trim();
    const att  = attachment ?? undefined;
    const ws   = webSearch;
    setValue('');
    setAttachment(null);
    setWebSearch(false);
    onSend(text || 'Please analyze this file.', att, ws);
  };

  const handleAttachFile = useCallback(async () => {
    Alert.alert('Attach file', 'Choose a source', [
      {
        text: 'Photo / Image',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission needed', 'Allow photo access in Settings.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            base64: true,
          });
          if (result.canceled || !result.assets[0]) return;
          const asset = result.assets[0];
          if (asset.fileSize && asset.fileSize > MAX_SIZE) {
            Alert.alert('Too large', 'Max file size is 20MB.');
            return;
          }
          setAttachment({
            name: asset.fileName || 'image.jpg',
            type: 'image',
            mimeType: asset.mimeType || 'image/jpeg',
            // base64 is already set by ImagePicker when base64: true
            content: `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`,
          });
        },
      },
      {
        text: 'Document',
        onPress: async () => {
          setProcessing(true);
          try {
            const result = await DocumentPicker.getDocumentAsync({
              type: [
                'application/pdf',
                'text/plain',
                'text/markdown',
                'text/csv',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              ],
              copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets[0]) return;
            const asset = result.assets[0];

            if (asset.size && asset.size > MAX_SIZE) {
              Alert.alert('Too large', 'Max file size is 20MB.');
              return;
            }

            const ext = (asset.name || '').split('.').pop()?.toLowerCase() || '';
            let type: Attachment['type'] = 'text';
            if (ext === 'pdf')  type = 'pdf';
            if (ext === 'docx') type = 'docx';

            let content = '';
            if (type === 'text') {
              // Read text files as UTF-8 string — expo-file-system, no FileReader
              content = await FileSystem.readAsStringAsync(asset.uri, {
                encoding: FileSystem.EncodingType.UTF8,
              });
            } else {
              // Read binary files (PDF, DOCX) as base64
              content = await FileSystem.readAsStringAsync(asset.uri, {
                encoding: FileSystem.EncodingType.Base64,
              });
            }

            setAttachment({
              name: asset.name || 'document',
              type,
              mimeType: asset.mimeType || 'application/octet-stream',
              content,
            });
          } catch (err) {
            Alert.alert('Error', 'Could not read file. Try another format.');
            console.error(err);
          } finally {
            setProcessing(false);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const disabled = isSending || isStreaming || processing;

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]}>

      {/* ── Attachment preview — same glass pill as web ── */}
      {(attachment || processing) && (
        <View style={[styles.attachPreview, { backgroundColor: theme.glass2, borderColor: theme.border }]}>
          {processing ? (
            <>
              <View style={[styles.fileIconBox, { backgroundColor: theme.glass3 }]}>
                <Text style={{ fontSize: 16 }}>⏳</Text>
              </View>
              <Text style={{ color: theme.text3, fontSize: 13 }}>Reading file…</Text>
            </>
          ) : attachment && (
            <>
              <View style={[styles.fileIconBox, {
                backgroundColor: attachment.type === 'image' ? theme.glass3 : theme.accentDim,
              }]}>
                <Text style={{ fontSize: attachment.type === 'image' ? 22 : 20 }}>
                  {FILE_ICONS[attachment.type]}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: theme.text1, fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                  {attachment.name}
                </Text>
                <Text style={{ color: theme.text3, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>
                  {attachment.type}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAttachment(null)}
                style={[styles.removeBtn, { backgroundColor: theme.glass3, borderColor: theme.border }]}
              >
                <IconX size={10} color={theme.text3} />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* ── Input bar — same pill shape, same buttons as web ── */}
      <View style={[styles.bar, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>

        {/* Paperclip — SVG icon matching web exactly */}
        <TouchableOpacity
          onPress={handleAttachFile}
          disabled={disabled}
          activeOpacity={0.6}
          style={[styles.sideBtn, { opacity: disabled ? 0.4 : 1 }]}
        >
          <IconPaperclip size={18} color={attachment ? theme.accent : theme.text3} />
        </TouchableOpacity>

        {/* Globe / web search toggle — SVG icon matching web exactly */}
        <TouchableOpacity
          onPress={() => { haptic.light(); setWebSearch(w => !w); }}
          disabled={isSending || isStreaming}
          activeOpacity={0.6}
          style={[styles.sideBtn, { opacity: (isSending || isStreaming) ? 0.4 : 1 }]}
        >
          <IconGlobe size={16} color={webSearch ? theme.accent : theme.text3} />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          value={value}
          onChangeText={setValue}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          placeholder={attachment ? 'Ask something about this file…' : 'Message Eimemes…'}
          placeholderTextColor={theme.text3}
          multiline
          editable={!dailyLimitReached}
          style={[styles.textInput, { color: theme.text1 }]}
        />

        {/* Stop button — red circle with square icon */}
        {isStreaming && (
          <TouchableOpacity
            onPress={onStop}
            activeOpacity={0.7}
            style={styles.stopBtn}
          >
            <IconStop size={13} color="white" />
          </TouchableOpacity>
        )}

        {/* Send button — blue circle with up-arrow icon */}
        {!isStreaming && (
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            activeOpacity={0.7}
            style={[styles.sendBtn, {
              backgroundColor: canSend ? theme.sendBg : theme.glass3,
              opacity: canSend ? 1 : 0.28,
              shadowOpacity: canSend ? 0.4 : 0,
            }]}
          >
            <IconSend size={16} color={canSend ? theme.sendFg : theme.text3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Footer — same disclaimer text as web */}
      <Text style={[styles.footer, { color: dailyLimitReached ? '#ff6b6b' : theme.text3 }]}>
        {dailyLimitReached
          ? 'Daily limit reached. Resets tomorrow.'
          : 'EimemesChat may make mistakes. Verify important information.'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  attachPreview: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, paddingHorizontal: 14,
    marginBottom: 8, borderRadius: 16, borderWidth: 1,
  },
  fileIconBox:  { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  removeBtn:    { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bar: {
    flexDirection: 'row', alignItems: 'flex-end',
    borderRadius: 40, borderWidth: 1,
  },
  sideBtn: {
    width: 38, height: 52,
    alignItems: 'center', justifyContent: 'center',
    paddingLeft: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15.5, lineHeight: 22,
    paddingVertical: 14, paddingHorizontal: 4,
    maxHeight: 200, minHeight: 52,
    backgroundColor: 'transparent',
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    margin: 7, marginLeft: 0,
    shadowColor: '#007aff',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 4,
  },
  stopBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,60,60,0.9)',
    alignItems: 'center', justifyContent: 'center',
    margin: 7, marginLeft: 0,
  },
  footer: { textAlign: 'center', fontSize: 11, marginTop: 8 },
});
