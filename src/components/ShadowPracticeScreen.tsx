import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sentence, SentenceProgress, ShadowStep, SelfCheckRating } from '../types';
import { YouTubePlayer, YouTubePlayerHandle } from './YouTubePlayer';
import {
  Play,
  Pause,
  Repeat,
  Mic,
  Square,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Smile,
  Meh,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Radio,
} from 'lucide-react';

interface ShadowPracticeScreenProps {
  sentence: Sentence;
  currentIndex: number;
  totalSentences: number;
  progress: SentenceProgress;
  onUpdateProgress: (updated: SentenceProgress) => void;
  onPrev: () => void;
  onNext: () => void;
  onGoToList: () => void;
  playerRef: React.RefObject<YouTubePlayerHandle | null>;
}

export const ShadowPracticeScreen: React.FC<ShadowPracticeScreenProps> = ({
  sentence,
  currentIndex,
  totalSentences,
  progress,
  onUpdateProgress,
  onPrev,
  onNext,
  onGoToList,
  playerRef,
}) => {
  // Shadowing step: 1 (Listen), 2 (Mumble), 3 (Read & Shadow), 4 (Shadow)
  const [activeStep, setActiveStep] = useState<ShadowStep>(1);
  const [isTextHidden, setIsTextHidden] = useState<boolean>(true); // Steps 1, 2, 4 default hidden
  const [isKoreanHidden, setIsKoreanHidden] = useState<boolean>(false);

  // Playback & Segment controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(1.0);

  // Audio recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingUserVoice, setIsPlayingUserVoice] = useState<boolean>(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Speech Recognition (Word Check)
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);
  const [recognizedWords, setRecognizedWords] = useState<string[] | null>(null);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check speech recognition support once
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
    }
  }, []);

  // Sync step changes with text visibility defaults
  const handleStepChange = (step: ShadowStep) => {
    setActiveStep(step);
    if (step === 3) {
      setIsTextHidden(false); // Step 3: Read & Shadow shows text
    } else {
      setIsTextHidden(true); // Steps 1, 2, 4 hide text for ear training
    }
  };

  // Reset local state when switching to another sentence
  useEffect(() => {
    setIsPlaying(false);
    setIsRecording(false);
    setRecordedAudioUrl(null);
    setIsPlayingUserVoice(false);
    setRecognizedWords(null);
    setSpeechFeedback(null);
    // default back to step 1
    setActiveStep(1);
    setIsTextHidden(true);
  }, [sentence.id]);

  // Clean up recording object URL
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  // Handle Play/Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pause();
      setIsPlaying(false);
    } else {
      playerRef.current?.playSegment(sentence.start, sentence.end, isLooping, () => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
      // Increment play count
      onUpdateProgress({
        ...progress,
        plays: progress.plays + 1,
      });
    }
  };

  // Handle Loop Toggle
  const handleToggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (isPlaying) {
      // Re-trigger segment with new loop mode
      playerRef.current?.playSegment(sentence.start, sentence.end, nextLoop, () => {
        setIsPlaying(false);
      });
    }
  };

  // Handle Playback Rate / Speed change
  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed);
    playerRef.current?.setSpeed(speed);
  };

  // Recording logic with MediaRecorder
  const startRecordingFlow = async () => {
    try {
      setMicPermissionDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 0) {
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);

          // Update progress
          const newStatus =
            activeStep === 4 ? 'done' : progress.status === 'done' ? 'done' : 'practiced';
          onUpdateProgress({
            ...progress,
            recordings: progress.recordings + 1,
            status: newStatus,
          });
        }
        // Stop stream tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Play video segment once (Loop is ignored while recording)
      playerRef.current?.playSegment(sentence.start, sentence.end, false, () => {
        // Stop recording 1 second after the sentence ends per PRD
        setTimeout(() => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        }, 1000);
      });
    } catch (err: any) {
      console.warn('Microphone permission or recording error:', err);
      setMicPermissionDenied(true);
      setIsRecording(false);
    }
  };

  const handleStopRecordingManual = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    playerRef.current?.pause();
    setIsRecording(false);
  };

  // Play User's Voice
  const handlePlayUserVoice = () => {
    if (!recordedAudioUrl) return;

    if (isPlayingUserVoice && userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
      setIsPlayingUserVoice(false);
      return;
    }

    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.src = recordedAudioUrl;
      userAudioPlayerRef.current.play();
      setIsPlayingUserVoice(true);
      userAudioPlayerRef.current.onended = () => {
        setIsPlayingUserVoice(false);
      };
    }
  };

  // Play Original Video Clip right after
  const handlePlayOriginal = () => {
    playerRef.current?.playSegment(sentence.start, sentence.end, false);
  };

  // Self-check rating updater
  const handleSelfCheck = (index: 0 | 1 | 2, rating: SelfCheckRating) => {
    const updatedCheck: [SelfCheckRating, SelfCheckRating, SelfCheckRating] = [
      ...progress.selfCheck,
    ];
    // Toggle off if clicked again
    updatedCheck[index] = updatedCheck[index] === rating ? null : rating;
    onUpdateProgress({
      ...progress,
      selfCheck: updatedCheck,
    });
  };

  // Web Speech API Word Check
  const handleCheckMyWords = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isRecognizing) {
      recognitionRef.current?.stop();
      setIsRecognizing(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecognizing(true);
        setSpeechFeedback('Listening... Speak the sentence now! / 듣고 있습니다. 문장을 말해보세요!');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        const spokenWords = transcript
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .trim()
          .split(/\s+/);

        setRecognizedWords(spokenWords);

        // Calculate matched words
        const targetWords = sentence.text
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .trim()
          .split(/\s+/);

        let matchCount = 0;
        targetWords.forEach((tw) => {
          if (spokenWords.includes(tw)) {
            matchCount++;
          }
        });

        setSpeechFeedback(
          `You said ${matchCount} of ${targetWords.length} words! (${Math.round(
            (matchCount / targetWords.length) * 100
          )}%) — Great pronunciation practice!`
        );
        setIsRecognizing(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setSpeechFeedback('Could not hear clearly. Please try again! / 소리를 잘 인식하지 못했습니다. 다시 시도해보세요.');
        setIsRecognizing(false);
      };

      recognition.onend = () => {
        setIsRecognizing(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition start failed', e);
      setIsRecognizing(false);
    }
  };

  // Render sentence with stress words bolded & optional speech recognition color-coding
  const renderSentenceText = () => {
    const words = sentence.text.split(' ');
    const stressList = (sentence.stress || []).map((s) => s.toLowerCase().replace(/[^\w]/g, ''));

    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {words.map((word, idx) => {
          const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
          const isStressed = stressList.includes(cleanWord);

          // Word check matching state
          let wordMatchColor = '';
          if (recognizedWords) {
            const isMatched = recognizedWords.includes(cleanWord);
            if (isMatched) {
              wordMatchColor = 'text-emerald-400 font-bold';
            } else {
              wordMatchColor = 'text-slate-500 underline decoration-amber-400/80 decoration-2';
            }
          }

          return (
            <span
              key={idx}
              className={`text-[23px] sm:text-[25px] tracking-wide transition-colors ${
                wordMatchColor
                  ? wordMatchColor
                  : isStressed
                  ? 'font-extrabold text-amber-300 underline decoration-amber-500/40 decoration-2'
                  : 'font-normal text-slate-100'
              }`}
            >
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  const stepInstructions: Record<ShadowStep, { en: string; ko: string }> = {
    1: {
      en: 'Listen carefully without reading (2–3 times).',
      ko: '글을 보지 말고 소리에 집중해 2~3번 들어보세요.',
    },
    2: {
      en: 'Whisper or mumble along quietly with the sound.',
      ko: '소리를 조용히 웅얼거리며 따라 해보세요.',
    },
    3: {
      en: 'Read the bold stress words and speak along together.',
      ko: '굵은 강세 단어를 보며 영상과 동시에 말해보세요.',
    },
    4: {
      en: 'Hide the text and speak along in real time!',
      ko: '자막 없이 영상과 동시에 소리 내어 말해보세요.',
    },
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-12 animate-fade-in">
      {/* Hidden audio element for user recording */}
      <audio ref={userAudioPlayerRef} className="hidden" />

      {/* Top Video Player */}
      <div className="w-full">
        <YouTubePlayer ref={playerRef} showCredit={true} />
      </div>

      {/* Sentence Navigation & Progress Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            title="Previous sentence"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white tracking-wide font-mono">
            Sentence {currentIndex + 1} / {totalSentences}
          </span>
          <button
            onClick={onNext}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition-colors"
            title="Next sentence"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded border ${
              sentence.speaker.toLowerCase().includes('hulk')
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-700/50'
                : 'bg-amber-950/70 text-amber-300 border-amber-700/50'
            }`}
          >
            {sentence.speaker}
          </span>
          <button
            onClick={onGoToList}
            className="text-xs text-slate-400 hover:text-amber-400 underline"
          >
            List
          </button>
        </div>
      </div>

      {/* 4-Step Shadowing Guide Tabs */}
      <div className="flex flex-col gap-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 shadow-sm">
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-950 rounded-xl">
          {(
            [
              { num: 1, label: '1. Listen', ko: '듣기' },
              { num: 2, label: '2. Mumble', ko: '웅얼' },
              { num: 3, label: '3. Read', ko: '읽기' },
              { num: 4, label: '4. Shadow', ko: '쉐도잉' },
            ] as const
          ).map((step) => {
            const isActive = activeStep === step.num;
            return (
              <button
                key={step.num}
                onClick={() => handleStepChange(step.num as ShadowStep)}
                className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className="text-xs font-bold leading-tight">{step.label}</span>
                <span className={`text-[10px] ${isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                  {step.ko}
                </span>
              </button>
            );
          })}
        </div>

        {/* Short Step Instruction in English + Korean */}
        <div className="px-2 pt-1 text-center">
          <p className="text-xs font-semibold text-amber-300 leading-tight">
            {stepInstructions[activeStep].en}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {stepInstructions[activeStep].ko}
          </p>
        </div>
      </div>

      {/* Sentence Text Box (≥22px, bold stress words, hide toggles) */}
      <div className="relative rounded-2xl border border-emerald-900/40 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-lg flex flex-col items-center text-center gap-3 min-h-[140px] justify-center">
        {/* Visibility Toggles */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          <button
            onClick={() => setIsTextHidden(!isTextHidden)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors cursor-pointer"
            title="Toggle text visibility"
          >
            {isTextHidden ? <Eye className="w-3 h-3 text-amber-400" /> : <EyeOff className="w-3 h-3 text-slate-400" />}
            <span>{isTextHidden ? 'Show Text' : 'Hide Text'}</span>
          </button>
        </div>

        {/* Speaker Name Tag */}
        <div className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
          {sentence.speaker} speaks:
        </div>

        {/* English Sentence Display */}
        <div className="w-full my-1">
          {isTextHidden ? (
            <div className="py-6 flex flex-col items-center justify-center text-slate-500 gap-1">
              <span className="text-sm italic font-medium">[Text Hidden for Ear Training]</span>
              <span className="text-xs text-slate-600">자막이 숨겨져 있습니다. 소리에 집중해보세요.</span>
            </div>
          ) : (
            renderSentenceText()
          )}
        </div>

        {/* Korean Meaning (small, gray, can be toggled) */}
        {!isKoreanHidden ? (
          <div className="pt-2 border-t border-slate-800/70 w-full flex items-center justify-between text-xs text-slate-400">
            <span className="text-center w-full">{sentence.korean}</span>
            <button
              onClick={() => setIsKoreanHidden(true)}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline shrink-0"
            >
              Hide
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsKoreanHidden(false)}
            className="text-[11px] text-slate-500 hover:text-amber-400 underline"
          >
            Show Korean Meaning / 한국어 뜻 보기
          </button>
        )}
      </div>

      {/* Control Row: ▶ Play, 🔁 Loop, Speed (0.5× / 0.75× / 1.0×) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-3 shadow-md flex flex-wrap items-center justify-between gap-2">
        {/* Play Button (min 48px height) */}
        <button
          onClick={handleTogglePlay}
          className="min-h-[48px] px-5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-sm shadow-md flex items-center gap-2 cursor-pointer transition-all"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause / 일시정지</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Play / 재생</span>
            </>
          )}
        </button>

        {/* Loop Toggle Button */}
        <button
          onClick={handleToggleLoop}
          className={`min-h-[48px] px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
            isLooping
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-inner'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
          }`}
          title="Loop sentence with 1.5s pause"
        >
          <Repeat className={`w-4 h-4 ${isLooping ? 'text-emerald-400 animate-spin-slow' : 'text-slate-400'}`} />
          <div className="flex flex-col text-left">
            <span>Loop {isLooping ? 'ON' : 'OFF'}</span>
            <span className="text-[9px] text-slate-400">1.5초 간격 반복</span>
          </div>
        </button>

        {/* Speed Selector (0.5× / 0.75× / 1.0×) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {([0.5, 0.75, 1.0] as const).map((rate) => {
            const isSelected = currentSpeed === rate;
            return (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`min-h-[38px] px-2.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}×
              </button>
            );
          })}
        </div>
      </div>

      {/* Record & Compare Area */}
      <div className="rounded-2xl border border-emerald-800/40 bg-slate-900/90 p-4 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Mic className="w-4 h-4 text-emerald-400" />
            <span>Voice Recording / 녹음 및 확인</span>
          </span>
          {progress.recordings > 0 && (
            <span className="text-[11px] text-emerald-400 font-mono">
              Recorded: {progress.recordings} time{progress.recordings > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Mic Permission Denied Message */}
        {micPermissionDenied && (
          <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-700/60 text-xs text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold">Mic is off. You can still listen and shadow out loud.</p>
              <p className="text-[11px] text-amber-300/80">
                마이크 권한이 꺼져 있어도 듣기와 소리내어 따라하기는 가능합니다.
              </p>
            </div>
          </div>
        )}

        {/* Record Button (min 48px height) */}
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <button
              onClick={startRecordingFlow}
              className="flex-1 min-h-[50px] rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Mic className="w-5 h-5 fill-current" />
              <div className="flex flex-col text-left">
                <span>🎙 Record &amp; Shadow</span>
                <span className="text-[10px] font-normal text-slate-900">클립 재생과 함께 녹음 시작</span>
              </div>
            </button>
          ) : (
            <button
              onClick={handleStopRecordingManual}
              className="flex-1 min-h-[50px] rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer animate-pulse"
            >
              <Square className="w-4 h-4 fill-current" />
              <div className="flex flex-col text-left">
                <span>Stop Recording</span>
                <span className="text-[10px] font-normal opacity-90">녹음 종료</span>
              </div>
            </button>
          )}
        </div>

        {/* My Voice & Original Audio Buttons (Shown once recorded) */}
        {recordedAudioUrl && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handlePlayUserVoice}
              className="min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-emerald-600/40 text-emerald-300 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingUserVoice ? 'Pause Voice' : '▶ My Voice / 내 목소리'}</span>
            </button>
            <button
              onClick={handlePlayOriginal}
              className="min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-600/40 text-amber-300 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>▶ Original / 원본 듣기</span>
            </button>
          </div>
        )}
      </div>

      {/* Self-Check Area (after recording or practicing) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-200">
            Self-Check / 자가 진단
          </span>
          <span className="text-[10px] text-slate-500">
            Select 😀 Great / 🙂 Good / 😐 Needs practice
          </span>
        </div>

        {/* 3 Questions per PRD */}
        {(
          [
            {
              id: 0,
              questionEn: 'Did I keep up with the speed?',
              questionKo: '속도를 잘 맞추었나요?',
            },
            {
              id: 1,
              questionEn: 'Did I stress the bold words?',
              questionKo: '강조할 단어에 힘을 주었나요?',
            },
            {
              id: 2,
              questionEn: 'Did my voice go up and down like the actor?',
              questionKo: '억양과 높낮이를 살렸나요?',
            },
          ] as const
        ).map((q) => {
          const currentRating = progress.selfCheck[q.id];

          return (
            <div
              key={q.id}
              className="flex items-center justify-between gap-2 py-1 border-b border-slate-800/40 last:border-none"
            >
              <div className="flex-1 pr-2">
                <p className="text-xs font-medium text-slate-200 leading-snug">
                  {q.questionEn}
                </p>
                <p className="text-[11px] text-slate-500">{q.questionKo}</p>
              </div>

              {/* 😀 / 🙂 / 😐 Rating Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {(
                  [
                    { rating: 'good', icon: '😀', label: 'Great' },
                    { rating: 'ok', icon: '🙂', label: 'Good' },
                    { rating: 'poor', icon: '😐', label: 'Needs practice' },
                  ] as const
                ).map((btn) => {
                  const isSelected = currentRating === btn.rating;
                  return (
                    <button
                      key={btn.rating}
                      onClick={() => handleSelfCheck(q.id, btn.rating as SelfCheckRating)}
                      className={`min-w-[40px] min-h-[40px] rounded-lg text-base flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? btn.rating === 'good'
                            ? 'bg-emerald-950 border border-emerald-500 scale-105 shadow'
                            : btn.rating === 'ok'
                            ? 'bg-amber-950 border border-amber-500 scale-105 shadow'
                            : 'bg-slate-800 border border-slate-400 scale-105 shadow'
                          : 'bg-slate-950 border border-slate-800 hover:border-slate-700 opacity-60'
                      }`}
                      title={btn.label}
                    >
                      <span>{btn.icon}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional Word Check (Web Speech API) */}
      {isSpeechSupported && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>Pronunciation Word Check / 발음 단어 확인</span>
            </span>
            <button
              onClick={handleCheckMyWords}
              disabled={isRecognizing}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            >
              {isRecognizing ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>Listening...</span>
                </>
              ) : (
                <span>Check My Words / 발음 확인</span>
              )}
            </button>
          </div>

          {speechFeedback && (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <p className="text-emerald-300 font-medium">{speechFeedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Next Button (min 48px height) */}
      <button
        onClick={onNext}
        className="w-full min-h-[50px] rounded-xl bg-gradient-to-r from-emerald-600 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-slate-950 font-bold text-base shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
      >
        <span>
          {currentIndex + 1 < totalSentences
            ? 'Next Sentence / 다음 문장'
            : 'Finish Practice / 연습 완료'}
        </span>
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};
