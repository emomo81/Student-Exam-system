import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";

const statusConfig = {
  submitted: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Submitted" },
  in_progress: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10", label: "In Progress" },
  flagged: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10", label: "Flagged" },
  timed_out: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Timed Out" },
};

export default function RecentActivity({ sessions = [] }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="border-b border-slate-800 pb-4">
        <CardTitle className="text-white text-lg">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No recent activity</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {sessions.slice(0, 8).map((session) => {
              const config = statusConfig[session.status] || statusConfig.in_progress;
              const Icon = config.icon;
              return (
                <div key={session.id} className="flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                  <div className={`w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{session.student_name || session.student_email}</p>
                    <p className="text-xs text-slate-500">
                      {session.created_date ? format(new Date(session.created_date), "MMM d, h:mm a") : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${config.bg} ${config.color} border-0 text-xs`}>
                      {config.label}
                    </Badge>
                    {session.focus_loss_count > 0 && (
                      <p className="text-xs text-amber-400 mt-1">{session.focus_loss_count} flags</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}