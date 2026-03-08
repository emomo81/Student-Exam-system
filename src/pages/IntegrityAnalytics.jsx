import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, LineChart, Line, Legend, PieChart, Pie
} from "recharts";
import { Shield, AlertTriangle, Activity, Clock, TrendingUp, Eye } from "lucide-react";
import { format } from "date-fns";

const COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

// ─── Risk Score Gauge ────────────────────────────────────────────────────────
function RiskGauge({ score }) {
  const color = score >= 60 ? "#ef4444" : score >= 30 ? "#f59e0b" : "#10b981";
  const label = score >= 60 ? "HIGH RISK" : score >= 30 ? "MEDIUM RISK" : "LOW RISK";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(${color} ${score * 3.6}deg, #1e293b 0deg)`,
        }}
      >
        <div className="absolute w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">{score}</span>
        </div>
      </div>
      <span className={`text-xs font-bold tracking-wider ${score >= 60 ? "text-red-400" : score >= 30 ? "text-amber-400" : "text-emerald-400"}`}>
        {label}
      </span>
    </div>
  );
}

// ─── Event timeline mini chart ──────────────────────────────────────────────
function EventTimeline({ logs }) {
  const byHour = {};
  logs.forEach(log => {
    const h = log.timestamp ? new Date(log.timestamp).getHours() : 0;
    byHour[h] = (byHour[h] || 0) + 1;
  });
  const data = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, events: byHour[i] || 0 }));
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barSize={6}>
        <XAxis dataKey="hour" tick={{ fill: "#475569", fontSize: 10 }} interval={3} />
        <YAxis tick={{ fill: "#475569", fontSize: 10 }} />
        <Tooltip
          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: 12 }}
          labelStyle={{ color: "#fff" }}
        />
        <Bar dataKey="events" fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function IntegrityAnalytics() {
  const [examFilter, setExamFilter] = useState("all");

  const { data: exams = [] } = useQuery({
    queryKey: ["exams"],
    queryFn: () => base44.entities.Exam.list("-created_date", 100),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => base44.entities.ExamSession.list("-updated_date", 500),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.MalpracticeLog.list("-created_date", 500),
  });

  const filteredSessions = examFilter === "all" ? sessions : sessions.filter(s => s.exam_id === examFilter);
  const filteredLogs = examFilter === "all" ? logs : logs.filter(l => l.exam_id === examFilter);

  const completedSessions = filteredSessions.filter(s => s.status !== "in_progress");
  const flaggedSessions = completedSessions.filter(s => s.focus_loss_count > 2 || s.status === "flagged");
  const avgRisk = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((a, b) => a + (b.cheating_risk_score || 0), 0) / completedSessions.length)
    : 0;
  const totalFocusLoss = filteredLogs.filter(l => l.event_type === "focus_loss").length;

  // Event type breakdown for pie chart
  const eventCounts = {};
  filteredLogs.forEach(l => { eventCounts[l.event_type] = (eventCounts[l.event_type] || 0) + 1; });
  const pieData = Object.entries(eventCounts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  // Answering velocity scatter data (time per question)
  const velocityData = completedSessions.map(s => ({
    name: s.student_name || s.student_email?.split("@")[0] || "Student",
    avgTime: s.answers?.length > 0
      ? Math.round(s.answers.reduce((a, b) => a + (b.time_spent_seconds || 0), 0) / s.answers.length)
      : 0,
    score: s.percentage || 0,
    risk: s.cheating_risk_score || 0,
  })).filter(d => d.avgTime > 0);

  // Risk distribution
  const riskBuckets = [
    { label: "Low (0-29)", count: completedSessions.filter(s => (s.cheating_risk_score || 0) < 30).length, color: "#10b981" },
    { label: "Med (30-59)", count: completedSessions.filter(s => (s.cheating_risk_score || 0) >= 30 && (s.cheating_risk_score || 0) < 60).length, color: "#f59e0b" },
    { label: "High (60+)", count: completedSessions.filter(s => (s.cheating_risk_score || 0) >= 60).length, color: "#ef4444" },
  ];

  // Top flagged students
  const sortedByRisk = [...completedSessions]
    .sort((a, b) => (b.cheating_risk_score || 0) - (a.cheating_risk_score || 0))
    .slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Integrity Analytics</h1>
          <p className="text-slate-500 mt-1">Anomaly detection & behavioral analysis</p>
        </div>
        <Select value={examFilter} onValueChange={setExamFilter}>
          <SelectTrigger className="w-56 bg-slate-900 border-slate-700 text-white">
            <SelectValue placeholder="All Exams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Exams</SelectItem>
            {exams.map(e => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", value: completedSessions.length, icon: Activity, color: "text-blue-400" },
          { label: "Flagged Sessions", value: flaggedSessions.length, icon: AlertTriangle, color: "text-red-400" },
          { label: "Avg Risk Score", value: avgRisk, icon: Shield, color: avgRisk >= 60 ? "text-red-400" : avgRisk >= 30 ? "text-amber-400" : "text-emerald-400" },
          { label: "Focus Loss Events", value: totalFocusLoss, icon: Eye, color: "text-violet-400" },
        ].map((kpi) => (
          <Card key={kpi.label} className="bg-slate-900 border-slate-800">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-slate-500 text-xs">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Timeline */}
        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              Malpractice Events by Hour
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <EventTimeline logs={filteredLogs} />
          </CardContent>
        </Card>

        {/* Event Type Breakdown */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-white text-base">Event Types</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pieData.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No events logged</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-400 text-xs capitalize">{d.name}</span>
                      </div>
                      <span className="text-white text-xs font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={riskBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskBuckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Answering Velocity Scatter */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="border-b border-slate-800 pb-4">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Answering Velocity vs Score
            </CardTitle>
            <p className="text-slate-500 text-xs mt-1">Avg seconds per question vs final score — clustering reveals behavioral patterns</p>
          </CardHeader>
          <CardContent className="p-6">
            {velocityData.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No velocity data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="avgTime" name="Avg Time (s)" tick={{ fill: "#64748b", fontSize: 11 }} label={{ value: "Avg Time/Q (s)", position: "insideBottom", offset: -5, fill: "#475569", fontSize: 11 }} />
                  <YAxis dataKey="score" name="Score %" tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                  <ZAxis dataKey="risk" range={[40, 200]} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", fontSize: 12 }}
                    formatter={(val, name) => [val, name === "avgTime" ? "Avg Time (s)" : name === "score" ? "Score %" : "Risk"]}
                  />
                  <Scatter data={velocityData} fill="#3b82f6">
                    {velocityData.map((d, i) => (
                      <Cell key={i} fill={d.risk >= 60 ? "#ef4444" : d.risk >= 30 ? "#f59e0b" : "#3b82f6"} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Flagged Students Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="border-b border-slate-800 pb-4">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Student Risk Leaderboard
          </CardTitle>
          <p className="text-slate-500 text-xs mt-1">Sorted by cheating risk score (focus-loss × 15)</p>
        </CardHeader>
        <CardContent className="p-0">
          {sortedByRisk.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No completed sessions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {["Rank", "Student", "Exam", "Score", "Focus Loss", "Risk Score", "Risk Level", "Submitted"].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedByRisk.map((s, i) => {
                    const risk = s.cheating_risk_score || 0;
                    const riskLabel = risk >= 60 ? { text: "High", cls: "bg-red-500/20 text-red-400" } :
                      risk >= 30 ? { text: "Medium", cls: "bg-amber-500/20 text-amber-400" } :
                      { text: "Low", cls: "bg-emerald-500/20 text-emerald-400" };
                    return (
                      <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <span className={`font-bold text-sm ${i === 0 ? "text-red-400" : i === 1 ? "text-amber-400" : i === 2 ? "text-yellow-400" : "text-slate-500"}`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-white text-sm">{s.student_name || "—"}</p>
                          <p className="text-slate-500 text-xs">{s.student_email}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-sm">
                          {exams.find(e => e.id === s.exam_id)?.title || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-bold ${(s.percentage || 0) >= 40 ? "text-emerald-400" : "text-red-400"}`}>
                            {s.percentage != null ? `${s.percentage}%` : "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span className={`text-sm font-medium ${s.focus_loss_count > 2 ? "text-red-400" : "text-slate-400"}`}>
                              {s.focus_loss_count || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <RiskGauge score={risk} />
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={`${riskLabel.cls} border-0`}>{riskLabel.text}</Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-sm">
                          {s.submitted_at ? format(new Date(s.submitted_at), "MMM d, h:mm a") : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}