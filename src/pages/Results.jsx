import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Search, Shield
} from "lucide-react";
import { format } from "date-fns";

const RISK_COLOR = (score) => {
  if (score >= 60) return "text-red-400";
  if (score >= 30) return "text-amber-400";
  return "text-emerald-400";
};

const RISK_LABEL = (score) => {
  if (score >= 60) return { text: "High Risk", cls: "bg-red-500/20 text-red-400" };
  if (score >= 30) return { text: "Medium Risk", cls: "bg-amber-500/20 text-amber-400" };
  return { text: "Low Risk", cls: "bg-emerald-500/20 text-emerald-400" };
};

export default function Results() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: exams = [] } = useQuery({
    queryKey: ["exams"],
    queryFn: () => base44.entities.Exam.list("-created_date", 100),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => base44.entities.ExamSession.list("-updated_date", 200),
  });

  const isTeacherOrAdmin = user?.role === "admin" || user?.role === "teacher";

  const filteredSessions = sessions
    .filter(s => !isTeacherOrAdmin ? s.student_email === user?.email : true)
    .filter(s => s.status === "submitted" || s.status === "flagged" || s.status === "timed_out")
    .filter(s => examFilter === "all" ? true : s.exam_id === examFilter)
    .filter(s => search
      ? (s.student_name || s.student_email || "").toLowerCase().includes(search.toLowerCase())
      : true
    );

  const getExamName = (id) => exams.find(e => e.id === id)?.title || "Unknown Exam";

  // Score distribution for chart
  const buckets = [
    { range: "0–20%", count: 0 },
    { range: "21–40%", count: 0 },
    { range: "41–60%", count: 0 },
    { range: "61–80%", count: 0 },
    { range: "81–100%", count: 0 },
  ];
  filteredSessions.forEach(s => {
    const p = s.percentage || 0;
    if (p <= 20) buckets[0].count++;
    else if (p <= 40) buckets[1].count++;
    else if (p <= 60) buckets[2].count++;
    else if (p <= 80) buckets[3].count++;
    else buckets[4].count++;
  });

  const BUCKET_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

  const avgScore = filteredSessions.filter(s => s.percentage != null).length > 0
    ? Math.round(filteredSessions.filter(s => s.percentage != null).reduce((a, b) => a + (b.percentage || 0), 0) / filteredSessions.filter(s => s.percentage != null).length)
    : 0;

  const passingRate = filteredSessions.length > 0
    ? Math.round((filteredSessions.filter(s => (s.percentage || 0) >= (exams.find(e => e.id === s.exam_id)?.passing_percentage || 40)).length / filteredSessions.length) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Results</h1>
        <p className="text-slate-500 mt-1">{isTeacherOrAdmin ? "All student results" : "Your exam results"}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Results", value: filteredSessions.length, color: "text-blue-400" },
          { label: "Average Score", value: `${avgScore}%`, color: "text-violet-400" },
          { label: "Passing Rate", value: `${passingRate}%`, color: "text-emerald-400" },
          { label: "Flagged", value: filteredSessions.filter(s => s.status === "flagged" || s.focus_loss_count > 2).length, color: "text-red-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-900 border-slate-800">
            <CardContent className="p-5">
              <p className="text-slate-500 text-sm">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {isTeacherOrAdmin && filteredSessions.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-white text-base">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={buckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#94a3b8" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {buckets.map((_, i) => <Cell key={i} fill={BUCKET_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {isTeacherOrAdmin && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student..."
              className="pl-9 bg-slate-900 border-slate-700 text-white"
            />
          </div>
        )}
        <Select value={examFilter} onValueChange={setExamFilter}>
          <SelectTrigger className="w-56 bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="Filter by exam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {isTeacherOrAdmin && <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Student</th>}
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Exam</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Score</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
                {isTeacherOrAdmin && <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Integrity</th>}
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-12">No results found</td>
                </tr>
              ) : filteredSessions.map((session) => {
                const passingPct = exams.find(e => e.id === session.exam_id)?.passing_percentage || 40;
                const passed = (session.percentage || 0) >= passingPct;
                const risk = RISK_LABEL(session.cheating_risk_score || 0);
                return (
                  <tr key={session.id} className="hover:bg-slate-800/30 transition-colors">
                    {isTeacherOrAdmin && (
                      <td className="px-6 py-4">
                        <p className="text-white text-sm font-medium">{session.student_name || session.student_email}</p>
                        <p className="text-slate-500 text-xs">{session.student_email}</p>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="text-slate-300 text-sm">{getExamName(session.exam_id)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-bold ${passed ? "text-emerald-400" : "text-red-400"}`}>
                          {session.percentage != null ? `${session.percentage}%` : "—"}
                        </span>
                        {passed
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          : <XCircle className="w-4 h-4 text-red-400" />
                        }
                      </div>
                      {session.score != null && (
                        <p className="text-slate-500 text-xs mt-0.5">{session.score} pts</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={
                        session.status === "flagged" ? "bg-red-500/20 text-red-400 border-0" :
                        session.status === "timed_out" ? "bg-amber-500/20 text-amber-400 border-0" :
                        "bg-emerald-500/20 text-emerald-400 border-0"
                      }>
                        {session.status === "timed_out" ? "Timed Out" : session.status === "flagged" ? "Flagged" : "Submitted"}
                      </Badge>
                    </td>
                    {isTeacherOrAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className={`w-4 h-4 ${RISK_COLOR(session.cheating_risk_score || 0)}`} />
                          <Badge className={`${risk.cls} border-0 text-xs`}>{risk.text}</Badge>
                        </div>
                        {session.focus_loss_count > 0 && (
                          <p className="text-xs text-slate-500 mt-1">{session.focus_loss_count} focus loss events</p>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {session.submitted_at ? format(new Date(session.submitted_at), "MMM d, h:mm a") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}