import React, { useState } from "react";
import api from "@/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';
import {
    Plus, FileText, Clock, Hash, Pencil, Trash2, Eye, Play, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";
import { format } from "date-fns";
import QuestionForm from "@/components/exam/QuestionForm";
import AIQuestionGenerator from "@/components/exam/AIQuestionGenerator";

const STATUS_COLORS = {
    draft: "bg-slate-700 text-slate-300",
    published: "bg-blue-500/20 text-blue-400",
    active: "bg-emerald-500/20 text-emerald-400",
    completed: "bg-violet-500/20 text-violet-400",
};

export default function ExamManager() {
    const [showCreateExam, setShowCreateExam] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [expandedExam, setExpandedExam] = useState(null);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const queryClient = useQueryClient();

    const [examForm, setExamForm] = useState({
        title: "", description: "", subject: "", duration_minutes: 60,
        randomize_questions: true, passing_percentage: 40, status: "draft",
    });

    const { data: exams = [], isLoading } = useQuery({
        queryKey: ["exams"],
        queryFn: () => api.get("/exams").then(res => res.data),
    });

    const { data: allQuestions = [] } = useQuery({
        queryKey: ["questions"],
        queryFn: () => api.get("/questions").then(res => res.data),
    });

    /** @type {import('@tanstack/react-query').UseMutationResult<any, any, any, any>} */
    const createExam = useMutation({
        mutationFn: async (examData) => {
            const { data: user } = await api.get('/auth/me');
            return api.post('/exams', { ...examData, teacher_email: user.email });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exams"] });
            setShowCreateExam(false);
            resetForm();
            toast.success("Exam created successfully");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to create exam"),
    });

    /** @type {import('@tanstack/react-query').UseMutationResult<any, any, any, any>} */
    const updateExam = useMutation({
        mutationFn: ({ id, data }) => api.put(`/exams/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exams"] });
            setEditingExam(null);
            setShowCreateExam(false);
            resetForm();
            toast.success("Exam updated");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to update exam"),
    });

    /** @type {import('@tanstack/react-query').UseMutationResult<any, any, any, any>} */
    const deleteExam = useMutation({
        mutationFn: (id) => api.delete(`/exams/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exams"] });
            toast.success("Exam deleted");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to delete exam"),
    });

    /** @type {import('@tanstack/react-query').UseMutationResult<any, any, any, any>} */
    const createQuestion = useMutation({
        mutationFn: (data) => api.post('/questions', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["questions"] });
            setShowQuestionForm(false);
            setEditingQuestion(null);
            toast.success("Question added");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to add question"),
    });

    /** @type {import('@tanstack/react-query').UseMutationResult<any, any, any, any>} */
    const updateQuestion = useMutation({
        mutationFn: ({ id, data }) => api.put(`/questions/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["questions"] });
            setShowQuestionForm(false);
            setEditingQuestion(null);
            toast.success("Question updated");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to update question"),
    });

    /** @type {import('@tanstack/react-query').UseMutationResult<any, any, any, any>} */
    const deleteQuestion = useMutation({
        mutationFn: (id) => api.delete(`/questions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["questions"] });
            toast.success("Question deleted");
        },
        onError: (error) => toast.error(error.response?.data?.message || "Failed to delete question"),
    });

    const resetForm = () => {
        setExamForm({
            title: "", description: "", subject: "", duration_minutes: 60,
            randomize_questions: true, passing_percentage: 40, status: "draft",
        });
    };

    const handleEditExam = (exam) => {
        setExamForm({
            title: exam.title, description: exam.description || "", subject: exam.subject || "",
            duration_minutes: exam.duration_minutes, randomize_questions: exam.randomize_questions ?? true,
            passing_percentage: exam.passing_percentage || 40, status: exam.status,
        });
        setEditingExam(exam);
        setShowCreateExam(true);
    };

    const handleSubmitExam = () => {
        const totalMarks = expandedExam
            ? allQuestions.filter(q => q.exam_id === editingExam?.id).reduce((a, b) => a + (b.marks || 0), 0)
            : 0;

        if (editingExam) {
            updateExam.mutate({ id: editingExam.id, data: { ...examForm, total_marks: totalMarks || examForm.total_marks || 0 } });
        } else {
            createExam.mutate(examForm);
        }
    };

    const handleSaveQuestion = (data) => {
        if (editingQuestion) {
            updateQuestion.mutate({ id: editingQuestion.id, data: { ...data, exam_id: expandedExam } });
        } else {
            const examQuestions = allQuestions.filter(q => q.exam_id === expandedExam);
            createQuestion.mutate({ ...data, exam_id: expandedExam, order_index: examQuestions.length });
        }
    };

    const getExamQuestions = (examId) => allQuestions.filter(q => q.exam_id === examId);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Exam Manager</h1>
                    <p className="text-slate-500 mt-1">Create and manage your exams</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setEditingExam(null); setShowCreateExam(true); }}
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                    <Plus className="w-4 h-4" /> New Exam
                </Button>
            </div>

            {/* Create/Edit Exam Dialog */}
            <Dialog open={showCreateExam} onOpenChange={setShowCreateExam}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingExam ? "Edit Exam" : "Create New Exam"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Title</Label>
                            <Input value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                                className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Midterm - Data Structures" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Description</Label>
                            <Textarea value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                                className="bg-slate-800 border-slate-700 text-white" placeholder="Instructions for students..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Subject</Label>
                                <Input value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                                    className="bg-slate-800 border-slate-700 text-white" placeholder="e.g. Computer Science" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Duration (minutes)</Label>
                                <Input type="number" value={examForm.duration_minutes} onChange={(e) => setExamForm({ ...examForm, duration_minutes: Number(e.target.value) })}
                                    className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">Passing %</Label>
                                <Input type="number" value={examForm.passing_percentage} onChange={(e) => setExamForm({ ...examForm, passing_percentage: Number(e.target.value) })}
                                    className="bg-slate-800 border-slate-700 text-white" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-300">Status</Label>
                                <Select value={examForm.status} onValueChange={(v) => setExamForm({ ...examForm, status: v })}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setShowCreateExam(false)} className="text-slate-400">Cancel</Button>
                            <Button onClick={handleSubmitExam} className="bg-blue-600 hover:bg-blue-700">
                                {editingExam ? "Update" : "Create"} Exam
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Exams List */}
            {isLoading ? (
                <div className="text-center text-slate-500 py-12">Loading exams...</div>
            ) : exams.length === 0 ? (
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">No exams yet. Create your first exam!</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {exams.map((exam) => {
                        const questions = getExamQuestions(exam.id);
                        const isExpanded = expandedExam === exam.id;
                        return (
                            <Card key={exam.id} className="bg-slate-900 border-slate-800 overflow-hidden">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <CardTitle className="text-white text-lg">{exam.title}</CardTitle>
                                                <Badge className={STATUS_COLORS[exam.status]}>{exam.status}</Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                                {exam.subject && <span>{exam.subject}</span>}
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.duration_minutes} min</span>
                                                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {questions.length} questions</span>
                                                <span>{questions.reduce((a, b) => a + (b.marks || 0), 0)} marks</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditExam(exam)} className="text-slate-400 hover:text-white">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteExam.mutate(exam.id)} className="text-slate-400 hover:text-red-400">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost" size="icon"
                                                onClick={() => setExpandedExam(isExpanded ? null : exam.id)}
                                                className="text-slate-400 hover:text-white"
                                            >
                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>

                                {isExpanded && (
                                    <CardContent className="border-t border-slate-800 pt-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-white font-medium">Questions</h3>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline"
                                                    onClick={() => { setShowAIGenerator(!showAIGenerator); setShowQuestionForm(false); }}
                                                    className="border-blue-500/40 text-blue-400 hover:bg-blue-500/10 gap-1">
                                                    <Sparkles className="w-3 h-3" /> AI Generate
                                                </Button>
                                                <Button size="sm" onClick={() => { setEditingQuestion(null); setShowQuestionForm(true); setShowAIGenerator(false); }} className="bg-blue-600 hover:bg-blue-700 gap-1">
                                                    <Plus className="w-3 h-3" /> Add Question
                                                </Button>
                                            </div>
                                        </div>

                                        {showAIGenerator && (
                                            <AIQuestionGenerator
                                                examId={exam.id}
                                                onQuestionsGenerated={() => {
                                                    queryClient.invalidateQueries({ queryKey: ["questions"] });
                                                    setShowAIGenerator(false);
                                                }}
                                            />
                                        )}

                                        {showQuestionForm && (
                                            <QuestionForm
                                                onSave={handleSaveQuestion}
                                                onCancel={() => { setShowQuestionForm(false); setEditingQuestion(null); }}
                                                initialData={editingQuestion}
                                            />
                                        )}

                                        {questions.length === 0 && !showQuestionForm ? (
                                            <p className="text-slate-500 text-sm py-4 text-center">No questions yet. Add your first question!</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {questions.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((q, i) => (
                                                    <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                                                        <span className="text-blue-400 font-mono text-sm mt-0.5">Q{i + 1}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm">{q.question_text}</p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <Badge variant="outline" className="text-xs text-slate-400 border-slate-700">
                                                                    {q.question_type === "mcq" ? "MCQ" : "Theory"}
                                                                </Badge>
                                                                <span className="text-xs text-slate-500">{q.marks} marks</span>
                                                                {q.question_type === "mcq" && (
                                                                    <span className="text-xs text-emerald-400">Answer: {q.correct_answer}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-white"
                                                                onClick={() => { setEditingQuestion(q); setShowQuestionForm(true); }}>
                                                                <Pencil className="w-3 h-3" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-400"
                                                                onClick={() => deleteQuestion.mutate(q.id)}>
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}