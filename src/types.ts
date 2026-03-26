// types.ts — v1.0
export type View = 'chat' | 'settings' | 'profile' | 'personalization' | 'about' | 'licenses';

export interface Attachment {
  name: string;
  type: 'image' | 'pdf' | 'text' | 'docx';
  mimeType: string;
  content: string; // base64 for images, extracted text for docs
}

export interface Source {
  title: string;
  url: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
  model?: string;
  disclaimer?: 'critical' | 'web' | false;
  webSearchUsed?: boolean;
  sources?: Source[];
  attachment?: {
    name: string;
    type: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}
