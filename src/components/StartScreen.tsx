import React from 'react';
import { MOVIE_SETTINGS, Sentence, SentenceProgress } from '../types';
import { Play, Settings2, ExternalLink, Headphones, Sparkles, BookOpen, User } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  onGoToEdit: () => void;
  onGoToList: () => void;
  sentences: Sentence[];
  progress: Record<number, SentenceProgress>;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  onGoToEdit,
  onGoToList,
  sentences,
  progress,
}) => {
  const practicedCount = Object.values(progress).filter(
    (p) => p.status === 'practiced' || p.status === 'done'
  ).length;

  return (
    <div className="w-full flex flex-col gap-6 pb-12 animate-fade-in">
      {/* Hero Header */}
      <div className="flex flex-col items-center text-center pt-2">
        {/* Subtle Marvel Time Stone Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 text-xs font-medium mb-3 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Avengers: Endgame Clip Shadowing</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-display">
          Scene Shadow: <span className="text-amber-400 italic">End Game</span>
        </h1>
        <p className="text-base text-emerald-200/90 font-medium">
          Listen. Copy. Speak at the same time.
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          듣고, 흉내 내고, 배우와 동시에 말해보세요.
        </p>
      </div>

      {/* Hero Poster / Scene Highlight Card */}
      <div className="relative rounded-2xl overflow-hidden border border-emerald-800/40 bg-gradient-to-b from-emerald-950/40 to-slate-900/90 p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Featured Scene
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5 leading-snug">
              {MOVIE_SETTINGS.sceneDescription}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Ancient One &amp; Bruce Banner (Hulk)
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-3 font-mono">
              <span>{sentences.length} Sentences</span>
              <span>·</span>
              <span>Range: 0:10 – 0:55</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-900/60 border border-emerald-600/50 flex items-center justify-center text-amber-400 shrink-0 shadow-md">
            <Headphones className="w-6 h-6" />
          </div>
        </div>

        {practicedCount > 0 && (
          <div className="mt-4 pt-3 border-t border-emerald-900/50 flex items-center justify-between text-xs">
            <span className="text-emerald-300">
              Your progress: <strong className="text-white">{practicedCount}</strong> of {sentences.length} practiced
            </span>
            <button
              onClick={onGoToList}
              className="text-amber-400 hover:text-amber-300 underline font-medium"
            >
              View sentences →
            </button>
          </div>
        )}
      </div>

      {/* What is Shadowing Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-md">
        <div className="flex items-center gap-2 mb-3 text-amber-400 font-semibold text-sm">
          <BookOpen className="w-4 h-4" />
          <span>What is Shadowing? / 쉐도잉이란?</span>
        </div>
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-semibold text-slate-100">Listen closely to natural sounds</p>
              <p className="text-slate-400 text-[11px]">배우의 발음, 끊어읽기, 억양에 집중하여 2~3회 반복해서 듣습니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-semibold text-slate-100">Copy the rhythm &amp; stress</p>
              <p className="text-slate-400 text-[11px]">머릿속 번역 없이 굵은 강세 단어를 배우의 호흡 그대로 따라 흉내 냅니다.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-600/50 text-emerald-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-semibold text-slate-100">Speak at the same time</p>
              <p className="text-slate-400 text-[11px]">영상과 거의 동시에(0.5초 차이) 자신 있게 소리 내어 말해봅니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onStart}
          className="w-full min-h-[54px] rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-base shadow-lg shadow-emerald-900/30 active:scale-[0.99] transition-all flex flex-col items-center justify-center cursor-pointer border border-emerald-400/30"
        >
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 fill-current" />
            <span>Start Practice</span>
          </div>
          <span className="text-[11px] font-normal opacity-90 text-slate-900">
            연습 시작
          </span>
        </button>

        <div className="flex items-center justify-between px-1 text-xs text-slate-400">
          <button
            onClick={onGoToList}
            className="hover:text-amber-400 transition-colors py-2 px-1 flex items-center gap-1.5 cursor-pointer"
          >
            <span>Sentence List / 문장 목록</span>
          </button>
          <button
            onClick={onGoToEdit}
            className="hover:text-amber-400 transition-colors py-2 px-1 flex items-center gap-1 cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Edit Sentences / 문장 편집</span>
          </button>
        </div>
      </div>

      {/* Educational Use Notice & Source Card (Section 0-2 & 0-3 MUST appear) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 text-xs text-slate-400 leading-relaxed space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="font-bold text-slate-200 text-xs tracking-wide">
            Educational Use &amp; Source / 교육용 고지 및 출처
          </h3>
          <span className="text-[10px] text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded">
            비영리 교육용
          </span>
        </div>

        {/* Section 0-2 Notice */}
        <div className="space-y-1.5 text-[11px] text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
          <p className="font-semibold text-slate-300">
            Educational use only / 교육 목적 전용
          </p>
          <p>
            This app was made <strong>only for non-commercial English learning</strong> in the university course <em>AI and English Language Education</em> (ENG3088, Sungkyunkwan University). The film clip is used <strong>only to practice listening and speaking (shadowing)</strong>. It is not sold, shared for profit, downloaded, or edited. All rights to the film belong to its copyright holders.
          </p>
          <p className="text-slate-400 pt-1">
            이 앱은 성균관대학교 「인공지능과 영어교육」(ENG3088) 수업의 <strong>비영리 영어 학습 목적으로만</strong> 제작되었습니다. 영화 장면은 듣기·말하기(쉐도잉) 연습에만 사용하며, 판매·영리적 배포·다운로드·편집을 하지 않습니다. 영화의 모든 권리는 저작권자에게 있습니다.
          </p>
        </div>

        {/* Source metadata lines */}
        <div className="grid grid-cols-1 gap-1 text-[11px] pt-1 border-t border-slate-800/60">
          <div>
            <span className="text-slate-500">Movie Title: </span>
            <span className="text-slate-300 font-medium">{MOVIE_SETTINGS.englishTitle} ({MOVIE_SETTINGS.koreanTitle})</span>
          </div>
          <div>
            <span className="text-slate-500">Release Year: </span>
            <span className="text-slate-300">{MOVIE_SETTINGS.releaseYear}</span>
          </div>
          <div>
            <span className="text-slate-500">Director: </span>
            <span className="text-slate-300">{MOVIE_SETTINGS.director}</span>
          </div>
          <div>
            <span className="text-slate-500">Screenplay: </span>
            <span className="text-slate-300">{MOVIE_SETTINGS.screenplay}</span>
          </div>
          <div>
            <span className="text-slate-500">Production / Distribution: </span>
            <span className="text-slate-300">{MOVIE_SETTINGS.production} / {MOVIE_SETTINGS.distribution}</span>
          </div>
          <div>
            <span className="text-slate-500">Scene: </span>
            <span className="text-slate-300">{MOVIE_SETTINGS.sceneDescription}</span>
          </div>
          <div>
            <span className="text-slate-500">Practice Range: </span>
            <span className="text-amber-300/90 font-mono font-medium">0:10 – 0:55</span>
          </div>
          <div>
            <span className="text-slate-500">YouTube Channel &amp; Title: </span>
            <span className="text-slate-300">{MOVIE_SETTINGS.youtubeChannel} — {MOVIE_SETTINGS.youtubeTitle}</span>
          </div>
          <div className="pt-1 flex items-center justify-between">
            <a
              href={MOVIE_SETTINGS.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 underline font-medium"
            >
              <span>View Source on YouTube</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-500 text-[10px] flex items-center gap-1">
              <User className="w-2.5 h-2.5" /> Made by {MOVIE_SETTINGS.madeBy}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
