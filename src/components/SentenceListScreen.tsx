import React, { useState } from 'react';
import { Sentence, SentenceProgress } from '../types';
import { YouTubePlayer, YouTubePlayerHandle } from './YouTubePlayer';
import { Play, ArrowRight, Eye, EyeOff, Settings2, Sparkles, ChevronRight } from 'lucide-react';

interface SentenceListScreenProps {
  sentences: Sentence[];
  progress: Record<number, SentenceProgress>;
  onSelectSentence: (index: number) => void;
  onGoToEdit: () => void;
  onGoToStart: () => void;
  playerRef: React.RefObject<YouTubePlayerHandle | null>;
}

export const SentenceListScreen: React.FC<SentenceListScreenProps> = ({
  sentences,
  progress,
  onSelectSentence,
  onGoToEdit,
  onGoToStart,
  playerRef,
}) => {
  const [hideAllText, setHideAllText] = useState(false);
  const [previewingId, setPreviewingId] = useState<number | null>(null);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'done':
        return <span className="text-amber-400 font-bold" title="Done (Step 4 completed)">★</span>;
      case 'practiced':
        return <span className="text-emerald-400 font-bold" title="Practiced">◐</span>;
      default:
        return <span className="text-slate-500 font-bold" title="Not started">☆</span>;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'done':
        return 'Done / 완료';
      case 'practiced':
        return 'Practiced / 연습함';
      default:
        return 'Not started / 시작 전';
    }
  };

  const handlePreview = (e: React.MouseEvent, sentence: Sentence) => {
    e.stopPropagation();
    setPreviewingId(sentence.id);
    playerRef.current?.playSegment(sentence.start, sentence.end, false, () => {
      setPreviewingId(null);
    });
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-12 animate-fade-in">
      {/* Top Video Player */}
      <div className="w-full">
        <YouTubePlayer ref={playerRef} showCredit={true} />
      </div>

      {/* List Header & Controls */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Practice Sentences</span>
            <span className="text-xs font-normal text-slate-400">
              ({sentences.length} sentences)
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            문장을 선택하여 4단계 쉐도잉을 시작하세요.
          </p>
        </div>

        <button
          onClick={() => setHideAllText(!hideAllText)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-300 transition-colors cursor-pointer"
          title="Toggle text visibility"
        >
          {hideAllText ? <Eye className="w-3.5 h-3.5 text-amber-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          <span>{hideAllText ? 'Show Text' : 'Hide Text'}</span>
        </button>
      </div>

      {/* Empty State Check */}
      {sentences.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-8 text-center flex flex-col items-center gap-3">
          <p className="text-slate-300 text-sm font-medium">
            No sentences yet. Tap Edit Sentences to add some.
          </p>
          <p className="text-slate-500 text-xs">
            등록된 문장이 없습니다. 문장 편집에서 새로운 대사를 추가해보세요.
          </p>
          <button
            onClick={onGoToEdit}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            <Settings2 className="w-4 h-4" />
            <span>Edit Sentences / 문장 편집</span>
          </button>
        </div>
      ) : (
        /* Sentences Cards List */
        <div className="flex flex-col gap-2.5">
          {sentences.map((s, index) => {
            const p = progress[s.id];
            const isPreviewing = previewingId === s.id;

            return (
              <div
                key={s.id}
                onClick={() => onSelectSentence(index)}
                className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer flex flex-col gap-1.5 ${
                  isPreviewing
                    ? 'border-amber-400/80 bg-slate-900/90 shadow-md ring-1 ring-amber-400/50'
                    : 'border-slate-800/90 bg-slate-900/60 hover:bg-slate-900 hover:border-emerald-700/60'
                }`}
              >
                {/* Top Row: #, Speaker, Progress Badge, Preview Button */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-emerald-950 border border-emerald-700/50 text-emerald-300 flex items-center justify-center font-bold text-[11px]">
                      {index + 1}
                    </span>
                    <span
                      className={`font-semibold tracking-wide ${
                        s.speaker.toLowerCase().includes('hulk')
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {s.speaker}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {s.start.toFixed(1)}s - {s.end.toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Progress Symbol */}
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-sm">{getStatusIcon(p?.status)}</span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">
                        {getStatusLabel(p?.status)}
                      </span>
                    </div>

                    {/* Preview Clip Audio button */}
                    <button
                      onClick={(e) => handlePreview(e, s)}
                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Quick Preview Segment"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </div>
                </div>

                {/* Sentence English Text */}
                <div className="pt-0.5">
                  {hideAllText ? (
                    <div className="h-6 flex items-center text-xs text-slate-500 italic bg-slate-950/40 px-2 rounded">
                      [Text hidden / 문장 숨김] Tap to practice
                    </div>
                  ) : (
                    <p className="text-[15px] font-medium text-slate-100 leading-snug">
                      {s.text}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                    {s.korean}
                  </p>
                </div>

                {/* Bottom Row: Stats & Action prompt */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span>Plays: {p?.plays || 0}</span>
                    <span>·</span>
                    <span>Records: {p?.recordings || 0}</span>
                  </div>
                  <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                    Practice <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Nav / Utility Links */}
      <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-400">
        <button
          onClick={onGoToStart}
          className="hover:text-amber-400 transition-colors py-2 cursor-pointer"
        >
          ← Start Screen / 처음으로
        </button>
        <button
          onClick={onGoToEdit}
          className="hover:text-amber-400 transition-colors py-2 flex items-center gap-1 cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Edit Sentences / 문장 편집</span>
        </button>
      </div>
    </div>
  );
};
