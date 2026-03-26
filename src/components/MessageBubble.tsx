// MessageBubble.tsx — v1.1 (Expo)
// v1.1: Full SVG icons (exact match to web), MarkdownRenderer with all features,
//       citation bubble integration with SourcesList expansion.
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Share, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../context/AppContext';
import { haptic } from '../lib/haptic';
import {
  IconCopy, IconCheck, IconRegen,
  IconThumbUp, IconThumbDown, IconShare,
} from '../lib/Icons';
import MarkdownRenderer from './MarkdownRenderer';
import SourcesList from './SourcesList';
import type { Message } from '../types';

const FILE_ICONS: Record<string, string> = {
  image: '🖼️', pdf: '📄', text: '📝', docx: '📄',
};

interface Props {
  message: Message;
  isLast: boolean;
  lastUserMsg: string;
  convId: string;
  onRegen: (originalMsg: string) => void;
}

// Exactly matches web ActionBtn — 32×32 rounded button, highlight on hover/press
function ActionBtn({
  title, onPress, active, activeColor, children,
}: {
  title: string;
  onPress: () => void;
  active?: boolean;
  activeColor?: string;
  children: React.ReactNode;
}) {
  const { theme } = useApp();
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityLabel={title}
      style={[
        styles.actionBtn,
        { backgroundColor: pressed ? theme.glass3 : 'transparent' },
      ]}
    >
      {/* Render SVG children with correct color */}
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
              color: active ? (activeColor || theme.accent) : theme.text3,
            })
          : child
      )}
    </TouchableOpacity>
  );
}

export default function MessageBubble({ message, isLast, lastUserMsg, convId, onRegen }: Props) {
  const { theme, showToast } = useApp();
  const [thumbUp,   setThumbUp]   = useState(false);
  const [thumbDown, setThumbDown] = useState(false);
  const [copied,    setCopied]    = useState(false);
  // ref to SourcesList so citation bubbles can expand it
  const sourcesRef = useRef<{ expand: (i: number) => void } | null>(null);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.content);
    haptic.success();
    setCopied(true);
    showToast('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    haptic.light();
    try { await Share.share({ message: message.content }); }
    catch { handleCopy(); }
  };

  const handleCitationPress = (index: number) => {
    sourcesRef.current?.expand(index);
  };

  /* ── User bubble ── */
  if (isUser) {
    return (
      <View style={styles.userOuter}>
        <View style={{ alignItems: 'flex-end', gap: 5 }}>
          {/* Attachment pill — same pill style as web */}
          {message.attachment && (
            <View style={[styles.attachBadge, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
              <Text style={{ fontSize: 14 }}>{FILE_ICONS[message.attachment.type] || '📎'}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, maxWidth: 180 }} numberOfLines={1}>
                {message.attachment.name}
              </Text>
            </View>
          )}
          {/* Soft fully-rounded bubble — exactly #2f2f2f like web */}
          <View style={[styles.userBubble, { backgroundColor: theme.userBubble }]}>
            <Text style={{ color: theme.userBubbleText, fontSize: 16, lineHeight: 26 }}>
              {message.content}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  /* ── AI message — plain layout, no bubble, same as web ── */
  return (
    <View style={styles.aiOuter}>
      <View style={{ width: '100%' }}>

        {/* Full markdown renderer — matching web renderMarkdown exactly */}
        <MarkdownRenderer
          text={message.content}
          onCitationPress={handleCitationPress}
        />

        {/* Disclaimers — same border-left style as web */}
        {message.disclaimer === 'critical' && (
          <View style={[styles.disclaimer, { borderLeftColor: theme.border }]}>
            <Text style={{ color: theme.text3, fontSize: 11.5, lineHeight: 17 }}>
              For informational purposes only. Consult a qualified professional before making decisions.
            </Text>
          </View>
        )}
        {message.disclaimer === 'web' && (
          <View style={[styles.disclaimer, { borderLeftColor: theme.border }]}>
            <Text style={{ color: theme.text3, fontSize: 11.5, lineHeight: 17 }}>
              Web sources may be outdated or inaccurate. Verify from authoritative sources.
            </Text>
          </View>
        )}

        {/* Sources list — same collapsible pill as web */}
        {message.sources?.length ? (
          <SourcesList ref={sourcesRef} sources={message.sources} />
        ) : null}

        {/* Action row — same icons, same positions, same behavior as web */}
        {isLast && (
          <View style={styles.actionRow}>
            <ActionBtn
              title={copied ? 'Copied!' : 'Copy'}
              onPress={handleCopy}
              active={copied}
              activeColor="#30d158"
            >
              {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
            </ActionBtn>

            <ActionBtn
              title="Regenerate"
              onPress={() => { haptic.medium(); onRegen(lastUserMsg); }}
            >
              <IconRegen size={15} />
            </ActionBtn>

            <ActionBtn
              title="Good response"
              onPress={() => {
                const was = thumbUp;
                haptic.success();
                setThumbUp(!was);
                setThumbDown(false);
                if (!was) showToast('Thanks! 👍');
              }}
              active={thumbUp}
              activeColor="#30d158"
            >
              <IconThumbUp size={15} filled={thumbUp} />
            </ActionBtn>

            <ActionBtn
              title="Bad response"
              onPress={() => {
                const was = thumbDown;
                haptic.medium();
                setThumbDown(!was);
                setThumbUp(false);
                if (!was) showToast('Thanks for the feedback!');
              }}
              active={thumbDown}
              activeColor="#ff6b6b"
            >
              <IconThumbDown size={15} filled={thumbDown} />
            </ActionBtn>

            <ActionBtn title="Share" onPress={handleShare}>
              <IconShare size={15} />
            </ActionBtn>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userOuter:   { alignItems: 'flex-end', paddingVertical: 4, paddingBottom: 10 },
  aiOuter:     { alignItems: 'flex-start', paddingVertical: 4 },
  userBubble:  { borderRadius: 22, paddingHorizontal: 20, paddingVertical: 12, maxWidth: '80%' },
  attachBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
  },
  disclaimer:  { marginTop: 8, paddingVertical: 6, paddingLeft: 10, borderLeftWidth: 2 },
  actionRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 0 },
  actionBtn:   { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
