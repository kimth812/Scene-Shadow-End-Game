export interface Sentence {
  id: number;
  speaker: string;
  text: string;
  korean: string;
  stress: string[];
  start: number;
  end: number;
}

export type SelfCheckRating = 'good' | 'ok' | 'poor' | null;

export interface SentenceProgress {
  id: number;
  plays: number;
  recordings: number;
  selfCheck: [SelfCheckRating, SelfCheckRating, SelfCheckRating]; // [speed, stress, intonation]
  status: 'new' | 'practiced' | 'done';
}

export type ShadowStep = 1 | 2 | 3 | 4;

export type AppScreen = 'start' | 'list' | 'practice' | 'edit' | 'finish';

export interface MovieSettings {
  englishTitle: string;
  koreanTitle: string;
  releaseYear: string;
  director: string;
  screenplay: string;
  production: string;
  distribution: string;
  sceneDescription: string;
  youtubeTitle: string;
  youtubeChannel: string;
  youtubeUrl: string;
  videoId: string;
  startSeconds: number;
  endSeconds: number;
  madeBy: string;
  appName: string;
}

export const MOVIE_SETTINGS: MovieSettings = {
  englishTitle: 'Avengers: Endgame',
  koreanTitle: '어벤져스: 엔드게임',
  releaseYear: '2019',
  director: 'Anthony Russo, Joe Russo',
  screenplay: 'Christopher Markus, Stephen McFeely',
  production: 'Marvel Studios',
  distribution: 'Walt Disney Studios Motion Pictures',
  sceneDescription: '시간이동 후 에인션트 원, 헐크 만남 장면',
  youtubeTitle: '에인션트 원, 헐크 만남 장면 | 어벤져스: 엔드게임 (Avengers: Endgame, 2019) [4K]',
  youtubeChannel: 'OneVIEW',
  youtubeUrl: 'https://www.youtube.com/watch?v=9kuoe40Hwg8&list=PLTinAYQ4oBg2KrP0VnOh9yaHPARUXLwht&index=2',
  videoId: '9kuoe40Hwg8',
  startSeconds: 10,
  endSeconds: 55,
  madeBy: '김태희',
  appName: 'Scene Shadow: End Game',
};

// Mandatory one-line credit (at least 13px, gray)
export const ONE_LINE_CREDIT =
  'Clip: Avengers: Endgame (2019), Walt Disney Studios Motion Pictures / Marvel Studios · via YouTube · For educational use only';
