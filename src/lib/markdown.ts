// markdown.ts — v1.0 (Expo)
// In React Native we use react-native-markdown-display for rendering.
// This file only keeps the pure-JS helpers used by useChat.ts.

export function getTime(): string {
  const d = new Date();
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Strip markdown syntax to plain text for display in previews / notifications.
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/`[^`]+`/g, '[code]')
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^\s*[-*+]\s/gm, '• ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}
