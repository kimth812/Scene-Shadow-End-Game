import { Sentence, SentenceProgress } from '../types';

export const DEFAULT_SENTENCES: Sentence[] = [
  {
    id: 1,
    speaker: 'Ancient One',
    text: "I'd be careful going that way, we just had the floors waxed.",
    korean: '조심해, 거기 방금 왁스 칠했어.',
    stress: ['careful', 'waxed'],
    start: 14.0,
    end: 18.0,
  },
  {
    id: 2,
    speaker: 'Hulk',
    text: "I'm looking for Dr.Strange.",
    korean: '닥터스트레인지를 찾고있어.',
    stress: ['looking', 'Strange'],
    start: 22.0,
    end: 24.0,
  },
  {
    id: 3,
    speaker: 'Ancient One',
    text: "You're about five years too early.",
    korean: '5년정도 너무 일찍 왔네.',
    stress: ['early'],
    start: 26.0,
    end: 28.0,
  },
  {
    id: 4,
    speaker: 'Ancient One',
    text: 'Steven strange is currently performing surgery about 20 blocks that way.',
    korean: '스티븐 스트레인지는 지금 저쪽 20블럭 밖에서 수술 중이야.',
    stress: ['surgery'],
    start: 29.0,
    end: 33.0,
  },
  {
    id: 5,
    speaker: 'Ancient One',
    text: 'What do you want from him?',
    korean: '그에게서 원하는 게 뭐야?',
    stress: ['want'],
    start: 35.0,
    end: 36.0,
  },
  {
    id: 6,
    speaker: 'Ancient One',
    text: "Ah! I'm afraid not.",
    korean: '아! 미안하지만 안돼.',
    stress: ['afraid'],
    start: 39.0,
    end: 42.0,
  },
  {
    id: 7,
    speaker: 'Hulk',
    text: "Sorry but it wasn't asking.",
    korean: '미안한데 물어본거 아니었어.',
    stress: ['asking'],
    start: 42.0,
    end: 44.0,
  },
  {
    id: 8,
    speaker: 'Ancient One',
    text: "You don't want to do this.",
    korean: '후회할 거야.',
    stress: ["don't", 'want'],
    start: 45.0,
    end: 46.0,
  },
];

const SENTENCES_STORAGE_KEY = 'scene_shadow_sentences_v1';
const PROGRESS_STORAGE_KEY = 'scene_shadow_progress_v1';

// In-memory fallback if localStorage fails or is disabled
let memorySentences: Sentence[] = [...DEFAULT_SENTENCES];
let memoryProgress: Record<number, SentenceProgress> = {};

export function createInitialProgress(sentenceId: number): SentenceProgress {
  return {
    id: sentenceId,
    plays: 0,
    recordings: 0,
    selfCheck: [null, null, null],
    status: 'new',
  };
}

export function loadSentences(): Sentence[] {
  try {
    const raw = localStorage.getItem(SENTENCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memorySentences = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('localStorage not available, using in-memory store for sentences', e);
  }
  return memorySentences;
}

export function saveSentences(sentences: Sentence[]): void {
  memorySentences = [...sentences];
  try {
    localStorage.setItem(SENTENCES_STORAGE_KEY, JSON.stringify(sentences));
  } catch (e) {
    console.warn('Could not save sentences to localStorage', e);
  }
}

export function loadProgress(): Record<number, SentenceProgress> {
  try {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        memoryProgress = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('localStorage not available, using in-memory store for progress', e);
  }
  return memoryProgress;
}

export function saveProgress(progress: Record<number, SentenceProgress>): void {
  memoryProgress = { ...progress };
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Could not save progress to localStorage', e);
  }
}

export function resetToDefaults(): { sentences: Sentence[]; progress: Record<number, SentenceProgress> } {
  saveSentences(DEFAULT_SENTENCES);
  const initialProg: Record<number, SentenceProgress> = {};
  DEFAULT_SENTENCES.forEach((s) => {
    initialProg[s.id] = createInitialProgress(s.id);
  });
  saveProgress(initialProg);
  return { sentences: DEFAULT_SENTENCES, progress: initialProg };
}
