import React, { useState } from "react";
import api from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, FileText, Loader2, CheckCircle2, Plus, X } from "lucide-react";

export default function AIQuestionGenerator({ examId, onQuestionsGenerated }) {
    const [mode, setMode] = useState("notes"); // "notes" | "file"
    const [notes, setNotes] = useState("");
    const [file, setFile] = useState(null);
    const [numQuestions, setNumQuestions] = useState(5);
    const [questionType, setQuestionType] = useState("mixed"); // "mcq" | "theory" | "mixed"
    const [marksPerQuestion, setMarksPerQuestion] = useState(2);
    const [loading, setLoading] = useState(false);
    const [generatedQuestions, setGeneratedQuestions] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (f) setFile(f);
    };

    const handleGenerate = async () => {
        setLoading(true);
        setGeneratedQuestions([]);
        setSelectedIds(new Set());

        const formData = new FormData();
        formData.append("mode", mode);
        formData.append("numQuestions", String(numQuestions));
        formData.append("questionType", questionType);
        formData.append("marksPerQuestion", String(marksPerQuestion));

        if (mode === "file" && file) {
            formData.append("file", file);
        } else {
            formData.append("notes", notes);
        }

        try {
            const response = await api.post('/ai/generate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const result = response.data;

            const questions = (result?.questions || []).map((q, i) => ({
                ...q,
                marks: marksPerQuestion,
                _tempId: i,
            }));

            setGeneratedQuestions(questions);
            setSelectedIds(new Set(questions.map((q) => q._tempId)));
            setLoading(false);
        } catch (error) {
            console.error('Failed to generate questions:', error);
            setLoading(false);
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleAddToExam = async () => {
        const toAdd = generatedQuestions.filter((q) => selectedIds.has(q._tempId));
        const existingRes = await api.get(`/questions?exam_id=${examId}`);
        const existing = existingRes.data || [];
        const startIndex = existing.length;

        await api.post('/questions/bulk', {
            questions: toAdd.map((q, i) => ({
                exam_id: examId,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options || [],
                correct_answer: q.correct_answer,
                marks: q.marks,
                order_index: startIndex + i,
            }))
        });

        onQuestionsGenerated();
        setGeneratedQuestions([]);
        setSelectedIds(new Set());
        setNotes("");
        setFile(null);
    };

    return (
        <div className="space-y-4 border border-blue-500/30 bg-blue-500/5 rounded-xl p-4">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">AI Question Generator</h3>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2">
                <Button
                    size="sm"
                    variant={mode === "notes" ? "default" : "outline"}
                    onClick={() => setMode("notes")}
                    className={mode === "notes" ? "bg-blue-600" : "border-slate-700 text-slate-400"}
                >
                    <FileText className="w-3 h-3 mr-1" /> Paste Notes
                </Button>
                <Button
                    size="sm"
                    variant={mode === "file" ? "default" : "outline"}
                    onClick={() => setMode("file")}
                    className={mode === "file" ? "bg-blue-600" : "border-slate-700 text-slate-400"}
                >
                    <Upload className="w-3 h-3 mr-1" /> Upload PDF / DOCX
                </Button>
            </div>

            {mode === "notes" ? (
                <div className="space-y-2">
                    <Label className="text-slate-300">Study Notes / Content</Label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white h-32"
                        placeholder="Paste lecture notes, chapter summaries, or any study content here..."
                    />
                </div>
            ) : (
                <div className="space-y-2">
                    <Label className="text-slate-300">Upload File (PDF or DOCX)</Label>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors text-sm text-slate-300">
                            <Upload className="w-4 h-4" />
                            {file ? file.name : "Choose file..."}
                            <input type="file" accept=".pdf,.docx,.doc,.txt" className="hidden" onChange={handleFileChange} />
                        </label>
                        {file && (
                            <Button size="sm" variant="ghost" onClick={() => setFile(null)} className="text-slate-500 h-8 w-8 p-0">
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Options */}
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">No. of Questions</Label>
                    <Input
                        type="number"
                        min={1} max={20}
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        className="bg-slate-800 border-slate-700 text-white h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Question Type</Label>
                    <Select value={questionType} onValueChange={setQuestionType}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="mixed">Mixed</SelectItem>
                            <SelectItem value="mcq">MCQ Only</SelectItem>
                            <SelectItem value="theory">Theory Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-slate-400 text-xs">Marks Each</Label>
                    <Input
                        type="number"
                        min={1}
                        value={marksPerQuestion}
                        onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                        className="bg-slate-800 border-slate-700 text-white h-8 text-sm"
                    />
                </div>
            </div>

            <Button
                onClick={() => { handleGenerate().catch(console.error); }}
                disabled={loading || (mode === "notes" ? !notes.trim() : !file)}
                className="bg-blue-600 hover:bg-blue-700 gap-2 w-full"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Generating questions..." : "Generate Questions"}
            </Button>

            {/* Generated Questions Preview */}
            {generatedQuestions.length > 0 && (
                <div className="space-y-3 mt-2">
                    <div className="flex items-center justify-between">
                        <p className="text-slate-300 text-sm font-medium">
                            {selectedIds.size} of {generatedQuestions.length} selected
                        </p>
                        <Button
                            size="sm"
                            onClick={handleAddToExam}
                            disabled={selectedIds.size === 0}
                            className="bg-emerald-600 hover:bg-emerald-700 gap-1 h-8"
                        >
                            <Plus className="w-3 h-3" /> Add to Exam
                        </Button>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {generatedQuestions.map((q) => (
                            <div
                                key={q._tempId}
                                onClick={() => toggleSelect(q._tempId)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all text-sm ${selectedIds.has(q._tempId)
                                    ? "border-blue-500/50 bg-blue-500/10"
                                    : "border-slate-700 bg-slate-800/40 opacity-60"
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedIds.has(q._tempId) ? "text-blue-400" : "text-slate-600"}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white">{q.question_text}</p>
                                        <div className="flex gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                                                {q.question_type === "mcq" ? "MCQ" : "Theory"}
                                            </Badge>
                                            <span className="text-xs text-slate-500">{q.marks} marks</span>
                                            {q.question_type === "mcq" && (
                                                <span className="text-xs text-emerald-400">Answer: {q.correct_answer}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}