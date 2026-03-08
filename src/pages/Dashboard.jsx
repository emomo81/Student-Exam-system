import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Users, Shield, BarChart3, Plus, ArrowRight, GraduationCap, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatCard from "@/components/dashboard/StatCard";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: exams = [] } = useQuery({
    queryKey: ["exams"],
    queryFn: () => base44.entities.Exam.list("-created_date", 100),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => base44.entities.ExamSession.list("-created_date", 50),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.MalpracticeLog.list("-created_date", 100),
  });

  const role = user?.role || "student";
  const isTeacherOrAdmin = role === "admin" || role === "teacher";

  const activeExams = exams.filter(e => e.status === "active" || e.status === "published").length;
  const completedSessions = sessions.filter(s => s.status === "submitted").length;
  const flaggedSessions = sessions.filter(s => s.focus_loss_count > 2).length;
  const avgScore = sessions.filter(s => s.percentage != null).length > 0
    ? Math.round(sessions.filter(s => s.percentage != null).reduce((a, b) => a + b.percentage, 0) / sessions.filter(s => s.percentage != null).length)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isTeacherOrAdmin ? "Here's your examination overview" : "Ready for your next exam?"}
          </p>
        </div>
        {isTeacherOrAdmin && (
          <Link to={createPageUrl("ExamManager")}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Create Exam
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isTeacherOrAdmin ? (
          <>
            <StatCard title="Total Exams" value={exams.length} icon={FileText} color="blue" subtitle={`${activeExams} active`} />
            <StatCard title="Submissions" value={completedSessions} icon={Users} color="green" />
            <StatCard title="Flagged Sessions" value={flaggedSessions} icon={AlertTriangle} color="orange" />
            <StatCard title="Avg Score" value={`${avgScore}%`} icon={BarChart3} color="purple" />
          </>
        ) : (
          <>
            <StatCard title="Available Exams" value={activeExams} icon={GraduationCap} color="blue" />
            <StatCard title="Completed" value={sessions.filter(s => s.student_email === user?.email && s.status === "submitted").length} icon={FileText} color="green" />
            <StatCard title="My Avg Score" value={`${(() => {
              const mySessions = sessions.filter(s => s.student_email === user?.email && s.percentage != null);
              return mySessions.length ? Math.round(mySessions.reduce((a, b) => a + b.percentage, 0) / mySessions.length) : 0;
            })()}%`} icon={BarChart3} color="purple" />
            <StatCard title="Integrity Flags" value={sessions.filter(s => s.student_email === user?.email).reduce((a, b) => a + (b.focus_loss_count || 0), 0)} icon={Shield} color="orange" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity sessions={isTeacherOrAdmin ? sessions : sessions.filter(s => s.student_email === user?.email)} />
        </div>

        {/* Quick Actions */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {isTeacherOrAdmin ? (
              <>
                <Link to={createPageUrl("ExamManager")} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">Create New Exam</p>
                      <p className="text-xs text-slate-500">Set up questions & timer</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                </Link>
                <Link to={createPageUrl("IntegrityAnalytics")} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">Integrity Analytics</p>
                      <p className="text-xs text-slate-500">Review cheating risk scores</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
                  </div>
                </Link>
                <Link to={createPageUrl("Results")} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">View Results</p>
                      <p className="text-xs text-slate-500">Grades & performance data</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link to={createPageUrl("StudentExams")} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">Take an Exam</p>
                      <p className="text-xs text-slate-500">Browse available exams</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                </Link>
                <Link to={createPageUrl("Results")} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">My Results</p>
                      <p className="text-xs text-slate-500">View grades & performance</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}