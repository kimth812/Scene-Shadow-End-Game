import React, { useState, useEffect, useRef } from 'react';
import { Sentence, SentenceProgress, AppScreen, MOVIE_SETTINGS, ONE_LINE_CREDIT } from './types';
import {
  loadSentences,
  saveSentences,
  loadProgress,
  saveProgress,
  createInitialProgress,
  resetToDefaults,
} from './data/initialData';
import { YouTubePlayerHandle } from './components/YouTubePlayer';
import { StartScreen } from './components/StartScreen';
import { SentenceListScreen } from './components/SentenceListScreen';
import { ShadowPracticeScreen } from './components/ShadowPracticeScreen';
import { EditSentencesScreen } from './components/EditSentencesScreen';
import { FinishScreen } from './components/FinishScreen';
import {
  Headphones,
  List,
  Home,
  Info,
  Settings2,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('start');
  const [sentences, setSentences] = useState<Sentence[]>(() => loadSentences());
  const [progress, setProgress] = useState<Record<number, SentenceProgress>>(() => {
    const loaded = loadProgress();
    const initial: Record<number, SentenceProgress> = { ...loaded };
    const currSentences = loadSentences();
    currSentences.forEach((s) => {
      if (!initial[s.id]) {
        initial[s.id] = createInitialProgress(s.id);
      }
    });
    return initial;
  });

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState<number>(0);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);

  // Player ref to control playback across views
  const playerRef = useRef<YouTubePlayerHandle | null>(null);

  // Sync sentences to storage
  const handleSaveSentences = (newSentences: Sentence[]) => {
    setSentences(newSentences);
    saveSentences(newSentences);
    // Ensure every sentence has a progress entry
    const updatedProgress = { ...progress };
    newSentences.forEach((s) => {
      if (!updatedProgress[s.id]) {
        updatedProgress[s.id] = createInitialProgress(s.id);
      }
    });
    setProgress(updatedProgress);
    saveProgress(updatedProgress);
  };

  // Sync progress
  const handleUpdateProgress = (updatedProg: SentenceProgress) => {
    const updated = {
      ...progress,
      [updatedProg.id]: updatedProg,
    };
    setProgress(updated);
    saveProgress(updated);
  };

  // Reset to default 8 sentences
  const handleResetDefaults = () => {
    const { sentences: defSentences, progress: defProgress } = resetToDefaults();
    setSentences(defSentences);
    setProgress(defProgress);
    setCurrentSentenceIndex(0);
  };

  // Screen Navigation handlers
  const handleStartPractice = () => {
    if (sentences.length === 0) {
      setScreen('edit');
    } else {
      setCurrentSentenceIndex(0);
      setScreen('practice');
    }
  };

  const handleSelectSentence = (index: number) => {
    setCurrentSentenceIndex(index);
    setScreen('practice');
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex + 1 < sentences.length) {
      setCurrentSentenceIndex(currentSentenceIndex + 1);
    } else {
      setScreen('finish');
    }
  };

  const handlePrevSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(currentSentenceIndex - 1);
    }
  };

  const currentSentence = sentences[currentSentenceIndex] || sentences[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Mobile container - Max-width 480px mobile-first centered */}
      <div className="w-full max-w-[480px] min-h-screen bg-slate-950 flex flex-col relative sm:border-x sm:border-slate-800/80 sm:shadow-2xl">
        {/* Top Header / App Bar */}
        <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-emerald-950 px-4 py-3 flex items-center justify-between">
          {/* Brand Wordmark (Single text element) */}
          <button
            onClick={() => setScreen('start')}
            className="flex items-center gap-2 text-left cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-600/50 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block leading-tight font-display">
                Scene Shadow <span className="text-amber-400">End Game</span>
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                Avengers: Endgame 쉐도잉
              </span>
            </div>
          </button>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setScreen('list')}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                screen === 'list'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Sentence List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setScreen('edit')}
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                screen === 'edit'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Edit Sentences"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNoticeModal(true)}
              className="p-2 rounded-lg text-xs text-slate-400 hover:text-amber-400 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Educational Use & Sources"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 pb-20">
          {screen === 'start' && (
            <StartScreen
              onStart={handleStartPractice}
              onGoToEdit={() => setScreen('edit')}
              onGoToList={() => setScreen('list')}
              sentences={sentences}
              progress={progress}
            />
          )}

          {screen === 'list' && (
            <SentenceListScreen
              sentences={sentences}
              progress={progress}
              onSelectSentence={handleSelectSentence}
              onGoToEdit={() => setScreen('edit')}
              onGoToStart={() => setScreen('start')}
              playerRef={playerRef}
            />
          )}

          {screen === 'practice' && currentSentence && (
            <ShadowPracticeScreen
              key={currentSentence.id}
              sentence={currentSentence}
              currentIndex={currentSentenceIndex}
              totalSentences={sentences.length}
              progress={progress[currentSentence.id] || createInitialProgress(currentSentence.id)}
              onUpdateProgress={handleUpdateProgress}
              onPrev={handlePrevSentence}
              onNext={handleNextSentence}
              onGoToList={() => setScreen('list')}
              playerRef={playerRef}
            />
          )}

          {screen === 'edit' && (
            <EditSentencesScreen
              sentences={sentences}
              onSaveSentences={handleSaveSentences}
              onResetDefaults={handleResetDefaults}
              onGoBack={() => setScreen(sentences.length > 0 ? 'list' : 'start')}
              playerRef={playerRef}
            />
          )}

          {screen === 'finish' && (
            <FinishScreen
              sentences={sentences}
              progress={progress}
              onPracticeSentence={(idx) => {
                setCurrentSentenceIndex(idx);
                setScreen('practice');
              }}
              onGoToList={() => setScreen('list')}
              onRestart={() => {
                setCurrentSentenceIndex(0);
                setScreen('practice');
              }}
            />
          )}
        </main>

        {/* Bottom Navigation Bar for Mobile Thumb Ergonomics */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="w-full max-w-[480px] bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-4 py-2 flex items-center justify-around pointer-events-auto shadow-lg">
            <button
              onClick={() => setScreen('start')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs transition-colors cursor-pointer ${
                screen === 'start' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-4 h-4 mb-0.5" />
              <span>Start</span>
            </button>
            <button
              onClick={() => setScreen('list')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs transition-colors cursor-pointer ${
                screen === 'list' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4 mb-0.5" />
              <span>Sentences</span>
            </button>
            <button
              onClick={() => {
                if (sentences.length > 0) {
                  setScreen('practice');
                } else {
                  setScreen('edit');
                }
              }}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs transition-colors cursor-pointer ${
                screen === 'practice'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Headphones className="w-4 h-4 mb-0.5" />
              <span>Practice</span>
            </button>
            <button
              onClick={() => setScreen('edit')}
              className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs transition-colors cursor-pointer ${
                screen === 'edit' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings2 className="w-4 h-4 mb-0.5" />
              <span>Edit</span>
            </button>
          </div>
        </nav>

        {/* Global Educational Notice Modal */}
        {showNoticeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Educational Use &amp; Source</span>
                </div>
                <button
                  onClick={() => setShowNoticeModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Full Notice */}
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <p className="font-semibold text-slate-100">
                  Educational use only / 교육 목적 전용
                </p>
                <p>
                  This app was made <strong>only for non-commercial English learning</strong> in the university course <em>AI and English Language Education</em> (ENG3088, Sungkyunkwan University). The film clip is used <strong>only to practice listening and speaking (shadowing)</strong>. It is not sold, shared for profit, downloaded, or edited. All rights to the film belong to its copyright holders.
                </p>
                <p className="pt-1 text-slate-400">
                  이 앱은 성균관대학교 「인공지능과 영어교육」(ENG3088) 수업의 <strong>비영리 영어 학습 목적으로만</strong> 제작되었습니다. 영화 장면은 듣기·말하기(쉐도잉) 연습에만 사용하며, 판매·영리적 배포·다운로드·편집을 하지 않습니다. 영화의 모든 권리는 저작권자에게 있습니다.
                </p>
              </div>

              {/* Metadata */}
              <div className="space-y-1 text-xs text-slate-400">
                <p><strong className="text-slate-300">Movie Title:</strong> {MOVIE_SETTINGS.englishTitle} ({MOVIE_SETTINGS.koreanTitle})</p>
                <p><strong className="text-slate-300">Release Year:</strong> {MOVIE_SETTINGS.releaseYear}</p>
                <p><strong className="text-slate-300">Director:</strong> {MOVIE_SETTINGS.director}</p>
                <p><strong className="text-slate-300">Screenplay:</strong> {MOVIE_SETTINGS.screenplay}</p>
                <p><strong className="text-slate-300">Production / Distribution:</strong> {MOVIE_SETTINGS.production} / {MOVIE_SETTINGS.distribution}</p>
                <p><strong className="text-slate-300">Scene:</strong> {MOVIE_SETTINGS.sceneDescription}</p>
                <p><strong className="text-slate-300">Practice Range:</strong> 0:10 – 0:55</p>
                <p><strong className="text-slate-300">YouTube Channel &amp; Title:</strong> {MOVIE_SETTINGS.youtubeChannel} — {MOVIE_SETTINGS.youtubeTitle}</p>
                <p><strong className="text-slate-300">Made by:</strong> {MOVIE_SETTINGS.madeBy}</p>

                <div className="pt-2">
                  <a
                    href={MOVIE_SETTINGS.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 underline font-medium text-xs"
                  >
                    <span>Open YouTube Clip in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowNoticeModal(false)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
                >
                  Close / 닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
