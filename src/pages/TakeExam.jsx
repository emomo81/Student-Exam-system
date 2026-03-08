import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Clock, ChevronRight, ChevronLeft,
  CheckCircle2, Shield, Eye, EyeOff
} from "lucide-react";

// ─── Lockdown Banner ────────────────────────────────────────────────────────
function LockdownBanner({ count }) {
  if (count === 0) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600/90 backdrop-blur-sm px-4 py-2 flex items-center justify-center gap-2 animate-pulse">
      <AlertTriangle className="w-4 h-4 text-white" />
      <span className="text-white text-sm font-medium">
        Focus violation detected — {count} incident{count > 1 ? "s" : ""} logged
      </span>
    </div>
  );
}

// ─── Timer ──────────────────────────────────────────────────────────────────
function ExamTimer({ secondsLeft }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isWarning = secondsLeft < 300;
  const isCritical = secondsLeft < 60;
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold
      ${isCritical ? "bg-red-500/20 text-red-400 animate-pulse" : isWarning ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-white"}`}>
      <Clock className="w-5 h-5" />
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}

// ─── Question Card ───────────────────────────────────────────────────────────
function QuestionCard({ question, index, total, answer, onAnswer }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-blue-400 font-mono text-sm">Q{index + 1}/{total}</span>
        <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
          {question.question_type === "mcq" ? "Multiple Choice" : "Theory"} · {question.marks} mark{question.marks > 1 ? "s" : ""}
        </Badge>
      </div>

      <p className="text-white text-lg leading-relaxed">{question.question_text}</p>

      {question.question_type === "mcq" && question.options && (
        <div className="space-y-3">
          {question.options.map((opt) => {
            const selected = answer === opt.label;
            return (
              <button
                key={opt.label}
                onClick={() => onAnswer(opt.label)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200
                  ${selected
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                  }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0
                  ${selected ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-400"}`}>
                  {opt.label}
                </span>
                <span className="flex-1">{opt.text}</span>
                {selected && <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {question.question_type === "theory" && (
        <textarea
          value={answer || ""}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Write your answer here..."
          className="w-full min-h-[200px] bg-slate-800 border border-slate-700 rounded-xl p-4 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-blue-500 transition-colors"
        />
      )}
    </div>
  );
}

// ─── Main TakeExam Page ──────────────────────────────────────────────────────
export default function TakeExam() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const examId = urlParams.get("examId");
  const existingSessionId = urlParams.get("sessionId");

  const [user, setUser] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [session, setSession] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timePerQuestion, setTimePerQuestion] = useState({});

  const timerRef = useRef(null);
  const autosaveRef = useRef(null);
  const sessionRef = useRef(null);
  const focusRef = useRef(0);

  // ── Load exam data ──────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const me = await base44.auth.me();
      setUser(me);

      const [allExams, allQuestions] = await Promise.all([
        base44.entities.Exam.list(),
        base44.entities.Question.filter({ exam_id: examId }),
      ]);

      const foundExam = allExams.find(e => e.id === examId);
      if (!foundExam) { navigate(createPageUrl("StudentExams")); return; }
      setExam(foundExam);

      let ordered = allQuestions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      if (foundExam.randomize_questions) {
        ordered = [...ordered].sort(() => Math.random() - 0.5);
      }
      setQuestions(ordered);

      // Create or resume session
      let activeSession;
      if (existingSessionId) {
        const sessions = await base44.entities.ExamSession.list();
        activeSession = sessions.find(s => s.id === existingSessionId);
        if (activeSession?.answers) {
          const ansMap = {};
          activeSession.answers.forEach(a => { ansMap[a.question_id] = a.answer; });
          setAnswers(ansMap);
        }
        setSecondsLeft(activeSession?.time_remaining_seconds || foundExam.duration_minutes * 60);
        setFocusLossCount(activeSession?.focus_loss_count || 0);
        focusRef.current = activeSession?.focus_loss_count || 0;
      } else {
        activeSession = await base44.entities.ExamSession.create({
          exam_id: examId,
          student_email: me.email,
          student_name: me.full_name,
          status: "in_progress",
          started_at: new Date().toISOString(),
          focus_loss_count: 0,
          answers: [],
          time_remaining_seconds: foundExam.duration_minutes * 60,
        });
        setSecondsLeft(foundExam.duration_minutes * 60);
      }

      setSession(activeSession);
      sessionRef.current = activeSession;
      setLoading(false);
    }
    if (examId) init();
  }, [examId]);

  // ── Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!session || submitted || loading) return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [session, submitted, loading]);

  // ── Autosave every 30s ──────────────────────────────────────────
  useEffect(() => {
    if (!session || submitted) return;
    autosaveRef.current = setInterval(() => {
      if (sessionRef.current) {
        const answersArr = Object.entries(answers).map(([qid, ans]) => ({
          question_id: qid, answer: ans, time_spent_seconds: timePerQuestion[qid] || 0
        }));
        base44.entities.ExamSession.update(sessionRef.current.id, {
          answers: answersArr,
          time_remaining_seconds: secondsLeft,
          focus_loss_count: focusRef.current,
        });
      }
    }, 30000);
    return () => clearInterval(autosaveRef.current);
  }, [session, submitted, answers, secondsLeft, timePerQuestion]);

  // ── Focus loss detection ────────────────────────────────────────
  const handleFocusLoss = useCallback(async () => {
    if (submitted || !sessionRef.current) return;
    focusRef.current += 1;
    setFocusLossCount(focusRef.current);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3000);

    await base44.entities.MalpracticeLog.create({
      session_id: sessionRef.current.id,
      exam_id: examId,
      student_email: user?.email || "",
      event_type: "focus_loss",
      timestamp: new Date().toISOString(),
      details: `Focus lost on question ${currentIndex + 1}`,
      question_index: currentIndex,
    });

    await base44.entities.ExamSession.update(sessionRef.current.id, {
      focus_loss_count: focusRef.current,
      status: focusRef.current > 5 ? "flagged" : "in_progress",
    });
  }, [submitted, examId, user, currentIndex]);

  useEffect(() => {
    window.addEventListener("blur", handleFocusLoss);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) handleFocusLoss();
    });
    // Disable right click
    const noRight = (e) => { if (!submitted) e.preventDefault(); };
    document.addEventListener("contextmenu", noRight);
    // Disable common shortcuts
    const noShortcuts = (e) => {
      if (submitted) return;
      const blocked = (e.altKey && e.key === "Tab") || (e.ctrlKey && (e.key === "c" || e.key === "v")) || e.key === "F12";
      if (blocked) {
        e.preventDefault();
        handleFocusLoss();
        base44.entities.MalpracticeLog.create({
          session_id: sessionRef.current?.id || "",
          exam_id: examId,
          student_email: user?.email || "",
          event_type: blocked ? "shortcut_attempt" : "focus_loss",
          timestamp: new Date().toISOString(),
          details: `Key: ${e.key}`,
          question_index: currentIndex,
        });
      }
    };
    document.addEventListener("keydown", noShortcuts);

    return () => {
      window.removeEventListener("blur", handleFocusLoss);
      document.removeEventListener("contextmenu", noRight);
      document.removeEventListener("keydown", noShortcuts);
    };
  }, [handleFocusLoss, submitted]);

  // ── Answer + time tracking ──────────────────────────────────────
  const handleAnswer = (value) => {
    if (!questions[currentIndex]) return;
    setAnswers(prev => ({ ...prev, [questions[currentIndex].id]: value }));
  };

  const handleNavigate = (dir) => {
    const elapsed = Math.round((Date.now() - questionStartTime) / 1000);
    if (questions[currentIndex]) {
      setTimePerQuestion(prev => ({
        ...prev,
        [questions[currentIndex].id]: (prev[questions[currentIndex].id] || 0) + elapsed,
      }));
    }
    setQuestionStartTime(Date.now());
    setCurrentIndex(prev => Math.max(0, Math.min(questions.length - 1, prev + dir)));
  };

  // ── Submit ──────────────────────────────────────────────────────
  const handleSubmit = async (timedOut = false) => {
    if (submitted || !sessionRef.current) return;
    setSubmitted(true);
    clearInterval(timerRef.current);
    clearInterval(autosaveRef.current);

    const answersArr = Object.entries(answers).map(([qid, ans]) => ({
      question_id: qid, answer: ans, time_spent_seconds: timePerQuestion[qid] || 0
    }));

    // Auto-grade MCQs
    const mcqQuestions = questions.filter(q => q.question_type === "mcq");
    let score = 0;
    let totalMcqMarks = 0;
    mcqQuestions.forEach(q => {
      totalMcqMarks += q.marks || 1;
      if (answers[q.id] === q.correct_answer) score += q.marks || 1;
    });
    const totalMarks = questions.reduce((a, b) => a + (b.marks || 1), 0);
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

    // Cheating risk score: weighted formula
    const riskScore = Math.min(100, focusRef.current * 15);

    await base44.entities.ExamSession.update(sessionRef.current.id, {
      status: timedOut ? "timed_out" : focusRef.current > 5 ? "flagged" : "submitted",
      submitted_at: new Date().toISOString(),
      answers: answersArr,
      time_remaining_seconds: 0,
      score,
      percentage: Math.round(percentage),
      cheating_risk_score: riskScore,
      focus_loss_count: focusRef.current,
    });

    navigate(createPageUrl("Results"));
  };

  // ── Fullscreen on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!loading && session) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    return () => {
      document.exitFullscreen?.().catch(() => {});
    };
  }, [loading, session]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400">Preparing your exam...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Exam Submitted!</h2>
          <p className="text-slate-400">Redirecting to results...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answered = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 select-none" style={{ userSelect: "none" }}>
      <LockdownBanner count={focusLossCount} />

      {/* Warning Flash */}
      {showWarning && (
        <div className="fixed inset-0 border-4 border-red-500/60 pointer-events-none z-40 animate-pulse rounded-none" />
      )}

      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-6 py-3 flex items-center justify-between ${focusLossCount > 0 ? "mt-9" : ""}`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span className="text-white font-semibold text-sm">{exam?.title}</span>
          </div>
          {focusLossCount > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-0 gap-1">
              <Eye className="w-3 h-3" /> {focusLossCount} flag{focusLossCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ExamTimer secondsLeft={secondsLeft} />
          <span className="text-slate-500 text-sm">{answered}/{questions.length} answered</span>
        </div>
      </div>

      {/* Body */}
      <div className={`flex min-h-screen ${focusLossCount > 0 ? "pt-28" : "pt-20"}`}>

        {/* Question panel */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto px-6 py-8">
          {/* Progress */}
          <div className="mb-6">
            <Progress value={progress} className="h-1.5 bg-slate-800" />
          </div>

          {/* Question */}
          {currentQ && (
            <Card className="bg-slate-900 border-slate-800 flex-1">
              <CardContent className="p-8">
                <QuestionCard
                  question={currentQ}
                  index={currentIndex}
                  total={questions.length}
                  answer={answers[currentQ.id]}
                  onAnswer={handleAnswer}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => handleNavigate(-1)}
              disabled={currentIndex === 0}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button onClick={() => handleNavigate(1)} className="bg-blue-600 hover:bg-blue-700 gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={() => handleSubmit(false)}
                className="bg-emerald-600 hover:bg-emerald-700 gap-2 px-8"
              >
                <CheckCircle2 className="w-4 h-4" /> Submit Exam
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar: question navigator */}
        <div className="hidden xl:flex flex-col w-56 border-l border-slate-800 p-6">
          <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mb-4">Questions</p>
          <div className="grid grid-cols-4 gap-2">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.id];
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => { handleNavigate(i - currentIndex); }}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all
                    ${isCurrent ? "bg-blue-500 text-white" :
                      isAnswered ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                      "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-6 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-slate-800" />
              <span>Unanswered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}