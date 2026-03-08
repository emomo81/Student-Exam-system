import React, { useState, useEffect } from "react";
import api from "@/api/apiClient";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Hash, Play, CheckCircle2, AlertTriangle } from "lucide-react";

export default function StudentExams() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        api.get("/auth/me").then(res => setUser(res.data)).catch(() => { });
    }, []);

    const { data: exams = [] } = useQuery({
        queryKey: ["exams"],
        queryFn: () => api.get("/exams").then(res => res.data),
    });

    const { data: sessions = [] } = useQuery({
        queryKey: ["my-sessions"],
        queryFn: () => api.get("/exam-sessions").then(res => res.data),
    });

    const { data: questions = [] } = useQuery({
        queryKey: ["questions"],
        queryFn: () => api.get("/questions").then(res => res.data),
    });

    const availableExams = exams.filter(e => e.status === "published" || e.status === "active");
    const mySessions = sessions.filter(s => s.student_email === user?.email);

    const getSessionForExam = (examId) => mySessions.find(s => s.exam_id === examId);
    const getQuestionCount = (examId) => questions.filter(q => q.exam_id === examId).length;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">My Exams</h1>
                <p className="text-slate-500 mt-1">Available exams and your progress</p>
            </div>

            {availableExams.length === 0 ? (
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="py-12 text-center">
                        <p className="text-slate-400">No exams are currently available.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableExams.map((exam) => {
                        const session = getSessionForExam(exam.id);
                        const isCompleted = session?.status === "submitted" || session?.status === "timed_out";
                        const isInProgress = session?.status === "in_progress";
                        const qCount = getQuestionCount(exam.id);

                        return (
                            <Card key={exam.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all duration-300 group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-white text-lg">{exam.title}</CardTitle>
                                        {isCompleted && (
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                                            </Badge>
                                        )}
                                        {isInProgress && (
                                            <Badge className="bg-amber-500/20 text-amber-400 border-0">
                                                <AlertTriangle className="w-3 h-3 mr-1" /> In Progress
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {exam.description && (
                                        <p className="text-slate-400 text-sm mb-4">{exam.description}</p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                        {exam.subject && <span>{exam.subject}</span>}
                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.duration_minutes} min</span>
                                        <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {qCount} questions</span>
                                    </div>

                                    {isCompleted ? (
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800">
                                            <div>
                                                <p className="text-sm text-slate-400">Your Score</p>
                                                <p className="text-xl font-bold text-white">{session.percentage != null ? `${Math.round(session.percentage)}%` : "Pending"}</p>
                                            </div>
                                            <Link to={createPageUrl("Results")}>
                                                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-700">
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <Link to={createPageUrl(`TakeExam?examId=${exam.id}${isInProgress && session ? `&sessionId=${session.id}` : ""}`)}>
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                                                <Play className="w-4 h-4" />
                                                {isInProgress ? "Resume Exam" : "Start Exam"}
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}