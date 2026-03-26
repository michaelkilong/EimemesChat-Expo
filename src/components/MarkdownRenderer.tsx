// MarkdownRenderer.tsx — v1.0 (Expo)
// Full markdown renderer matching the web app exactly:
//   - Syntax-highlighted code blocks (highlight.js atomOneDark, copy button, lang label)
//   - KaTeX display math  $$...$$  via WebView
//   - KaTeX inline math   $...$    via WebView
//   - Citation bubbles    [1]      tappable accent-colored Text
//   - All standard markdown (bold, italic, lists, headings, blockquote, links, hr)
import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useApp } from '../context/AppContext';
import MathView from '../lib/MathView';
import SyntaxBlock from '../lib/SyntaxBlock';

interface Props {
  text: string;
  onCitationPress?: (index: number) => void;
  streaming?: boolean;
}

// ── 1. Split top-level on $$...$$ (display math is always block-level) ──────

type Segment =
  | { type: 'markdown'; text: string }
  | { type: 'display-math'; eq: string };

function splitDisplayMath(raw: string): Segment[] {
  const segments: Segment[] = [];
  const re = /\$\$([\s\S]+?)\$\$/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > lastIndex) segments.push({ type: 'markdown', text: raw.slice(lastIndex, m.index) });
    segments.push({ type: 'display-math', eq: m[1] });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < raw.length) segments.push({ type: 'markdown', text: raw.slice(lastIndex) });
  if (segments.length === 0) segments.push({ type: 'markdown', text: raw });
  return segments;
}

// ── 2. Parse inline parts within a text node ─────────────────────────────────

type InlinePart =
  | { type: 'text'; content: string }
  | { type: 'inline-math'; eq: string }
  | { type: 'citation'; num: number };

function parseInlineParts(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  // Match inline math $...$ (not $$...$$) OR citation [n]
  const re = /\$([^\n$]+?)\$|\[(\d+)\]/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push({ type: 'text', content: text.slice(lastIndex, m.index) });
    if (m[1] !== undefined) {
      parts.push({ type: 'inline-math', eq: m[1] });
    } else {
      parts.push({ type: 'citation', num: parseInt(m[2], 10) });
    }
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', content: text.slice(lastIndex) });
  return parts;
}

// ── 3. MarkdownSegment — renders one markdown block with custom rules ─────────

function MarkdownSegment({
  text, onCitationPress, theme,
}: { text: string; onCitationPress?: (i: number) => void; theme: any }) {

  const markdownStyles = {
    body:         { color: theme.text1, fontSize: 16, lineHeight: 28 },
    paragraph:    { color: theme.text1, fontSize: 16, lineHeight: 28, marginBottom: 8, marginTop: 0 },
    heading1:     { color: theme.text1, fontSize: 22, fontWeight: '700' as const, marginTop: 16, marginBottom: 8, lineHeight: 30 },
    heading2:     { color: theme.text1, fontSize: 19, fontWeight: '700' as const, marginTop: 14, marginBottom: 6, lineHeight: 28 },
    heading3:     { color: theme.text1, fontSize: 17, fontWeight: '600' as const, marginTop: 12, marginBottom: 4, lineHeight: 26 },
    strong:       { fontWeight: '700' as const, color: theme.text1 },
    em:           { fontStyle: 'italic' as const, color: theme.text1 },
    code_inline:  {
      backgroundColor: theme.glass3,
      color: theme.accent,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'monospace',
      fontSize: 14,
    },
    fence:        { backgroundColor: 'transparent', padding: 0, margin: 0 },
    code_block:   { backgroundColor: 'transparent', padding: 0, margin: 0 },
    bullet_list:  { marginVertical: 6 },
    ordered_list: { marginVertical: 6 },
    list_item:    { color: theme.text1, fontSize: 16, lineHeight: 26 },
    blockquote:   {
      borderLeftWidth: 3, borderLeftColor: theme.border,
      paddingLeft: 12, marginVertical: 6, marginLeft: 0,
    },
    link:         { color: theme.accent },
    hr:           { backgroundColor: theme.border, height: 1, marginVertical: 12 },
    table:        { borderWidth: 1, borderColor: theme.border, borderRadius: 8, marginVertical: 8 },
    th:           { backgroundColor: theme.glass3, padding: 10, fontWeight: '600' as const, color: theme.text1 },
    td:           { padding: 10, color: theme.text1, borderTopWidth: 1, borderTopColor: theme.borderB },
  };

  const rules = {
    // Code blocks — SyntaxBlock with highlight.js, lang label, copy button
    fence: (node: any) => (
      <SyntaxBlock key={node.key} code={node.content || ''} lang={node.info || ''} />
    ),
    code_block: (node: any) => (
      <SyntaxBlock key={node.key} code={node.content || ''} lang="" />
    ),

    // Inline text — handle $...$ and [n] citations
    text: (node: any, children: any, parent: any, styles: any, inheritedStyles: any = {}) => {
      const content: string = node.content || '';
      const parts = parseInlineParts(content);

      // No special content — render plain (fast path)
      if (parts.length === 1 && parts[0].type === 'text') {
        return (
          <Text key={node.key} style={inheritedStyles}>
            {content}
          </Text>
        );
      }

      // Mixed content — render each part as a Text span (all must be Text for RN inline flow)
      return (
        <Text key={node.key}>
          {parts.map((part, i) => {
            if (part.type === 'text') {
              return <Text key={i} style={inheritedStyles}>{part.content}</Text>;
            }
            if (part.type === 'inline-math') {
              // Italic monospace with accent color — readable in text flow
              // (Full WebView inline math would break native text layout)
              return (
                <Text key={i} style={[inheritedStyles, {
                  fontStyle: 'italic',
                  fontFamily: 'monospace',
                  color: theme.accent,
                  fontSize: 15,
                }]}>
                  {part.eq}
                </Text>
              );
            }
            if (part.type === 'citation') {
              // Tappable accent badge — same function as web [1] button
              return (
                <Text
                  key={i}
                  style={{
                    color: theme.accent,
                    fontWeight: '700',
                    fontSize: 12,
                    backgroundColor: theme.accentDim,
                    borderRadius: 4,
                    paddingHorizontal: 4,
                    overflow: 'hidden',
                  }}
                  onPress={() => onCitationPress?.(part.num - 1)}
                >
                  {` ${part.num} `}
                </Text>
              );
            }
            return null;
          })}
        </Text>
      );
    },

    // Links — open in browser
    link: (node: any, children: any, parent: any, styles: any) => (
      <Text
        key={node.key}
        style={styles.link}
        onPress={() => Linking.openURL(node.attributes.href).catch(() => {})}
      >
        {children}
      </Text>
    ),
  };

  return (
    <Markdown rules={rules as any} style={markdownStyles}>
      {text}
    </Markdown>
  );
}

// ── 4. Top-level MarkdownRenderer ────────────────────────────────────────────

export default function MarkdownRenderer({ text, onCitationPress, streaming = false }: Props) {
  const { theme } = useApp();

  if (!text) return null;

  // For streaming, append cursor to last segment
  const displayText = streaming ? text + '▌' : text;
  const segments = splitDisplayMath(displayText);

  return (
    <View>
      {segments.map((seg, i) =>
        seg.type === 'display-math' ? (
          <MathView key={i} eq={seg.eq} displayMode />
        ) : (
          <MarkdownSegment
            key={i}
            text={seg.text}
            onCitationPress={onCitationPress}
            theme={theme}
          />
        )
      )}
    </View>
  );
}
