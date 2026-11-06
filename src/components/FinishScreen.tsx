import React, { useEffect } from 'react';
import { Sentence, SentenceProgress, ONE_LINE_CREDIT } from '../types';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, ListFilter, Play, Sparkles, Smile, CheckCircle } from 'lucide-react';

interface FinishScreenProps {
  sentences: Sentence[];
  progress: Record<number, SentenceProgress>;
  onPracticeSentence: (sentenceIndex: number) => void;
  onGoToList: () => void;
  onRestart: () => void;
}

export const FinishScreen: React.FC<FinishScreenProps> = ({
  sentences,
  progress,
  onPracticeSentence,
  onGoToList,
  onRestart,
}) => {
  // Fire celebratory confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#34d399', '#fbbf24', '#ffffff'],
      });
    } catch {
      // safe fallback if canvas-confetti is unavailable
    }
  }, []);

  const totalCompleted = sentences.filter((s) => progress[s.id]?.status === 'done').length;
  const totalPracticed = sentences.filter(
    (s) => progress[s.id]?.status === 'practiced' || progress[s.id]?.status === 'done'
  ).length;
  const totalRecordings = Object.values(progress).reduce(
    (sum, p) => sum + (p.recordings || 0),
    0
  );

  // Find sentences where any selfCheck question was marked 'poor' (😐)
  const needsReviewSentences = sentences.filter((s) => {
    const p = progress[s.id];
    return p?.selfCheck?.includes('poor');
  });

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-fade-in text-center">
      {/* Trophy / Celebration Icon */}
      <div className="flex flex-col items-center pt-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-amber-500 p-0.5 shadow-xl flex items-center justify-center mb-3">
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-white font-display">
          Great Job!
        </h1>
        <p className="text-base font-semibold text-emerald-400 mt-0.5">
          수고하셨습니다! 연습을 멋지게 마쳤습니다.
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          배우들의 대사를 직접 따라 말하며 영어의 리듬과 억양을 익혔습니다.
        </p>
      </div>

      {/* Summary KPI Stats */}
      <div className="grid grid-cols-3 gap-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black text-amber-400 font-mono">
            {totalCompleted} / {sentences.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            Step 4 Completed
          </span>
          <span className="text-[10px] text-slate-500">완전 완료</span>
        </div>

        <div className="flex flex-col items-center border-x border-slate-800 px-1">
          <span className="text-2xl font-black text-emerald-400 font-mono">
            {totalPracticed}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            Practiced Lines
          </span>
          <span className="text-[10px] text-slate-500">연습한 문장</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-2xl font-black text-white font-mono">
            {totalRecordings}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">
            Total Recordings
          </span>
          <span className="text-[10px] text-slate-500">총 녹음 횟수</span>
        </div>
      </div>

      {/* Sentences Marked 😐 (Needs Practice / Review) */}
      {needsReviewSentences.length > 0 && (
        <div className="rounded-2xl border border-amber-900/50 bg-slate-900/90 p-4 text-left flex flex-col gap-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <span>😐 Focus Review List / 재연습 추천 문장</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                {needsReviewSentences.length}
              </span>
            </span>
            <span className="text-[10px] text-slate-500">
              자가진단에서 😐로 체크된 문장입니다
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {needsReviewSentences.map((s) => {
              const originalIndex = sentences.findIndex((item) => item.id === s.id);
              return (
                <div
                  key={s.id}
                  className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] mb-0.5">
                      <span className="text-amber-400 font-bold">#{originalIndex + 1}</span>
                      <span className="text-slate-400 font-medium">{s.speaker}</span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium truncate">{s.text}</p>
                    <p className="text-[11px] text-slate-500 truncate">{s.korean}</p>
                  </div>

                  <button
                    onClick={() => onPracticeSentence(originalIndex)}
                    className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Practice again / 다시 연습</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Action Navigation */}
      <div className="flex flex-col gap-2.5 pt-2">
        <button
          onClick={onGoToList}
          className="w-full min-h-[50px] rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <ListFilter className="w-4 h-4" />
          <div className="flex flex-col text-center">
            <span>View All Sentences</span>
            <span className="text-[10px] font-normal text-slate-900">전체 문장 목록 보기</span>
          </div>
        </button>

        <button
          onClick={onRestart}
          className="w-full min-h-[46px] rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Practice from Beginning / 처음부터 다시하기</span>
        </button>
      </div>

      {/* Mandatory One-Line Credit at Bottom of Finish Screen (Section 0-3 #3) */}
      <div className="mt-6 pt-4 border-t border-slate-900">
        <p className="text-[13px] leading-relaxed text-slate-400 font-normal">
          {ONE_LINE_CREDIT}
        </p>
      </div>
    </div>
  );
};
