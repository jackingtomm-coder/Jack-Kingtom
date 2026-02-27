export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  prompt?: string;
  createdAt: number;
}

export interface Scene {
  id: string;
  imageUrl: string;
  prompt: string;
  characterIds: string[];
  aspectRatio: '1:1' | '16:9' | '9:16';
  createdAt: number;
}

export type AppTab = 'characters' | 'scenes' | 'library';
