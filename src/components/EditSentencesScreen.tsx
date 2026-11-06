import React, { useState } from 'react';
import { Sentence, MOVIE_SETTINGS } from '../types';
import { YouTubePlayer, YouTubePlayerHandle } from './YouTubePlayer';
import {
  Plus,
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  Copy,
  Download,
  Upload,
  RotateCcw,
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface EditSentencesScreenProps {
  sentences: Sentence[];
  onSaveSentences: (newSentences: Sentence[]) => void;
  onResetDefaults: () => void;
  onGoBack: () => void;
  playerRef: React.RefObject<YouTubePlayerHandle | null>;
}

export const EditSentencesScreen: React.FC<EditSentencesScreenProps> = ({
  sentences,
  onSaveSentences,
  onResetDefaults,
  onGoBack,
  playerRef,
}) => {
  // Form fields
  const [editingId, setEditingId] = useState<number | null>(null);
  const [speaker, setSpeaker] = useState<string>('Ancient One');
  const [text, setText] = useState<string>('');
  const [korean, setKorean] = useState<string>('');
  const [stressInput, setStressInput] = useState<string>('');
  const [startTime, setStartTime] = useState<number>(10.0);
  const [endTime, setEndTime] = useState<number>(14.0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Import / Export JSON modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const resetForm = () => {
    setEditingId(null);
    setSpeaker('Ancient One');
    setText('');
    setKorean('');
    setStressInput('');
    setStartTime(10.0);
    setEndTime(14.0);
    setErrorMsg(null);
  };

  const handleEditClick = (s: Sentence) => {
    setEditingId(s.id);
    setSpeaker(s.speaker);
    setText(s.text);
    setKorean(s.korean);
    setStressInput(s.stress ? s.stress.join(', ') : '');
    setStartTime(s.start);
    setEndTime(s.end);
    setErrorMsg(null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // Set start / end to current video time
  const handleSetStartNow = () => {
    const curTime = playerRef.current?.getCurrentTime() || MOVIE_SETTINGS.startSeconds;
    const rounded = Math.round(curTime * 10) / 10;
    setStartTime(rounded);
    if (endTime <= rounded) {
      setEndTime(Math.min(MOVIE_SETTINGS.endSeconds, Math.round((rounded + 2.5) * 10) / 10));
    }
    showToast(`Start time set to ${rounded}s`);
  };

  const handleSetEndNow = () => {
    const curTime = playerRef.current?.getCurrentTime() || MOVIE_SETTINGS.endSeconds;
    const rounded = Math.round(curTime * 10) / 10;
    setEndTime(rounded);
    showToast(`End time set to ${rounded}s`);
  };

  // Test current segment
  const handleTestSegment = (startVal?: number, endVal?: number) => {
    const s = startVal !== undefined ? startVal : startTime;
    const e = endVal !== undefined ? endVal : endTime;
    if (e <= s) {
      setErrorMsg('End time must be greater than Start time.');
      return;
    }
    playerRef.current?.playSegment(s, e, false);
  };

  // Validation
  const validateForm = (): boolean => {
    if (!text.trim()) {
      setErrorMsg('Please enter the English sentence.');
      return false;
    }
    if (startTime < MOVIE_SETTINGS.startSeconds || startTime > MOVIE_SETTINGS.endSeconds) {
      setErrorMsg(
        `Start time must be between ${MOVIE_SETTINGS.startSeconds}s and ${MOVIE_SETTINGS.endSeconds}s.`
      );
      return false;
    }
    if (endTime < MOVIE_SETTINGS.startSeconds || endTime > MOVIE_SETTINGS.endSeconds) {
      setErrorMsg(
        `End time must be between ${MOVIE_SETTINGS.startSeconds}s and ${MOVIE_SETTINGS.endSeconds}s.`
      );
      return false;
    }
    if (endTime <= startTime) {
      setErrorMsg('End time must be greater than start time.');
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  // Warnings for length & words
  const duration = Math.round((endTime - startTime) * 10) / 10;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const hasDurationWarning = duration > 4.0;
  const hasWordCountWarning = wordCount > 12;

  // Save Sentence
  const handleSaveSentence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const parsedStress = stressInput
      .split(',')
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (editingId !== null) {
      // Update existing
      const updated = sentences.map((s) => {
        if (s.id === editingId) {
          return {
            ...s,
            speaker: speaker.trim() || 'Speaker',
            text: text.trim(),
            korean: korean.trim(),
            stress: parsedStress,
            start: startTime,
            end: endTime,
          };
        }
        return s;
      });
      onSaveSentences(updated);
      showToast('Sentence updated!');
      resetForm();
    } else {
      // Add new
      const nextId =
        sentences.length > 0 ? Math.max(...sentences.map((s) => s.id)) + 1 : 1;
      const newSentence: Sentence = {
        id: nextId,
        speaker: speaker.trim() || 'Speaker',
        text: text.trim(),
        korean: korean.trim(),
        stress: parsedStress,
        start: startTime,
        end: endTime,
      };
      onSaveSentences([...sentences, newSentence]);
      showToast('New sentence added!');
      resetForm();
    }
  };

  // Delete
  const handleDeleteSentence = (id: number) => {
    if (window.confirm('Delete this sentence? / 이 문장을 삭제하시겠습니까?')) {
      const updated = sentences.filter((s) => s.id !== id);
      onSaveSentences(updated);
      showToast('Sentence deleted');
      if (editingId === id) resetForm();
    }
  };

  // Reorder
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sentences.length) return;
    const reordered = [...sentences];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    onSaveSentences(reordered);
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(sentences, null, 2);
    navigator.clipboard
      .writeText(jsonStr)
      .then(() => {
        showToast('JSON copied to clipboard! / 클립보드에 복사되었습니다.');
      })
      .catch(() => {
        alert(jsonStr);
      });
  };

  // Import JSON
  const handleImportSubmit = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Imported data must be a JSON array of sentences.');
      }
      for (const item of parsed) {
        if (
          typeof item.text !== 'string' ||
          typeof item.start !== 'number' ||
          typeof item.end !== 'number'
        ) {
          throw new Error('Each sentence must have text, start, and end properties.');
        }
      }
      onSaveSentences(parsed);
      setIsImportModalOpen(false);
      setImportJsonText('');
      showToast('Sentences imported successfully!');
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON format.');
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 pb-12 animate-fade-in">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-1.5 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Video Player */}
      <div className="w-full">
        <YouTubePlayer ref={playerRef} showCredit={true} />
      </div>

      {/* Screen Title & Back */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-bold text-white">Edit Sentences / 문장 편집</h2>
          <p className="text-xs text-slate-400">
            영상 타이밍을 맞추고 연습할 문장을 추가하거나 수정하세요.
          </p>
        </div>
        <button
          onClick={onGoBack}
          className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
        >
          ← Done / 완료
        </button>
      </div>

      {/* Add / Edit Form */}
      <form
        onSubmit={handleSaveSentence}
        className="rounded-2xl border border-emerald-800/40 bg-slate-900/90 p-4 shadow-md flex flex-col gap-3"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-amber-300">
            {editingId !== null ? '✏️ Edit Sentence / 문장 수정' : '➕ Add New Sentence / 새 문장 추가'}
          </span>
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              Cancel Edit / 취소
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-700/60 text-red-200 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Gentle Warnings */}
        {(hasDurationWarning || hasWordCountWarning) && (
          <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-600/50 text-amber-200 text-[11px] flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              {hasDurationWarning && (
                <p>• Sentence duration is {duration}s (&gt;4s). Shorter segments are easier for shadowing.</p>
              )}
              {hasWordCountWarning && (
                <p>• Sentence has {wordCount} words (&gt;12 words). Consider splitting for better flow.</p>
              )}
            </div>
          </div>
        )}

        {/* Speaker & Timing Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Speaker / 화자
            </label>
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              placeholder="Ancient One / Hulk"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Stress Words (comma-separated) / 강세 단어
            </label>
            <input
              type="text"
              value={stressInput}
              onChange={(e) => setStressInput(e.target.value)}
              placeholder="careful, waxed"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* English Text */}
        <div>
          <label className="block text-[11px] text-slate-400 font-medium mb-1">
            English Sentence / 영어 문장 *
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="I'd be careful going that way..."
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none resize-none"
          />
        </div>

        {/* Korean Meaning */}
        <div>
          <label className="block text-[11px] text-slate-400 font-medium mb-1">
            Korean Meaning / 한국어 해석
          </label>
          <input
            type="text"
            value={korean}
            onChange={(e) => setKorean(e.target.value)}
            placeholder="조심해, 거기 방금 왁스 칠했어."
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {/* Start / End Time with 'Set = now' and 'Test' controls */}
        <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Timestamp Adjustment (10.0s – 55.0s)</span>
            <span className="font-mono text-amber-300">Duration: {duration}s</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Start Time Box */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">Start (s)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min={MOVIE_SETTINGS.startSeconds}
                  max={MOVIE_SETTINGS.endSeconds}
                  value={startTime}
                  onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleSetStartNow}
                  className="px-2 py-1.5 rounded bg-emerald-950 border border-emerald-600/60 text-emerald-300 hover:bg-emerald-900 text-[10px] font-bold whitespace-nowrap cursor-pointer"
                  title="Capture current playing time as start"
                >
                  Set = now
                </button>
              </div>
            </div>

            {/* End Time Box */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-400">End (s)</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.1"
                  min={MOVIE_SETTINGS.startSeconds}
                  max={MOVIE_SETTINGS.endSeconds}
                  value={endTime}
                  onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleSetEndNow}
                  className="px-2 py-1.5 rounded bg-emerald-950 border border-emerald-600/60 text-emerald-300 hover:bg-emerald-900 text-[10px] font-bold whitespace-nowrap cursor-pointer"
                  title="Capture current playing time as end"
                >
                  Set = now
                </button>
              </div>
            </div>
          </div>

          {/* Test Segment Button */}
          <button
            type="button"
            onClick={() => handleTestSegment()}
            className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Test This Segment ({startTime.toFixed(1)}s ~ {endTime.toFixed(1)}s)</span>
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="min-h-[48px] rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          {editingId !== null ? (
            <>
              <Check className="w-4 h-4" />
              <span>Update Sentence / 문장 수정 저장</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Add Sentence to List / 문장 추가</span>
            </>
          )}
        </button>
      </form>

      {/* Current Sentences Management Table / List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-300">
            Current Sentences ({sentences.length})
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Export JSON</span>
            </button>
            <span className="text-slate-600">·</span>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {sentences.map((s, index) => (
          <div
            key={s.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-slate-800 text-slate-300 font-mono flex items-center justify-center font-bold text-[11px]">
                  {index + 1}
                </span>
                <span className="font-semibold text-amber-400">{s.speaker}</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {s.start.toFixed(1)}s - {s.end.toFixed(1)}s
                </span>
              </div>

              {/* Action Buttons: Test, Edit, Move Up/Down, Delete */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleTestSegment(s.start, s.end)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Test segment"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-20"
                  title="Move up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === sentences.length - 1}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 disabled:opacity-20"
                  title="Move down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleEditClick(s)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                  title="Edit"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSentence(s.id)}
                  className="p-1 rounded bg-slate-800 hover:bg-red-900/60 text-red-400"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-200">{s.text}</p>
            <p className="text-[11px] text-slate-400">{s.korean}</p>
          </div>
        ))}

        {/* Reset to Default Sentences */}
        <div className="pt-3 text-center">
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Reset all sentences back to the original 8 Avengers movie lines? / 원래 8개 대사로 초기화하시겠습니까?'
                )
              ) {
                onResetDefaults();
                showToast('Reset to default 8 sentences');
              }
            }}
            className="text-xs text-slate-500 hover:text-amber-400 underline inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset to Original 8 Sentences / 기본 문장으로 복원</span>
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Import Sentences JSON</span>
            </h3>
            <p className="text-xs text-slate-400">
              Paste the sentence JSON array exported from another device or backup.
            </p>

            {importError && (
              <div className="p-2 rounded bg-red-950/70 border border-red-700 text-red-200 text-xs">
                {importError}
              </div>
            )}

            <textarea
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="[ { id: 1, speaker: '...', text: '...', start: 14.0, end: 18.0 } ]"
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono resize-none focus:outline-none focus:border-emerald-500"
            />

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportError(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
