import React from "react";
import { Clock, AlertTriangle } from "lucide-react";

export default function ExamTimer({ secondsLeft }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLow = secondsLeft < 300; // less than 5 min
  const isCritical = secondsLeft < 60;

  return (
    <div className={`
      flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold
      transition-all duration-500
      ${isCritical ? "bg-red-500/20 text-red-400 animate-pulse" :
        isLow ? "bg-amber-500/20 text-amber-400" :
        "bg-slate-800 text-white"}
    `}>
      {isCritical ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}