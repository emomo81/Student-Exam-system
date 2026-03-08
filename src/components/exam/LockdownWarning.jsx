import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LockdownWarning({ show, warningCount, onDismiss }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-900 border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">⚠ Focus Loss Detected</h2>
            <p className="text-slate-400 text-sm mb-4">
              You have switched away from the exam window. This incident has been logged.
            </p>
            <div className="bg-red-500/10 rounded-lg p-3 mb-6">
              <p className="text-red-400 font-medium text-sm">
                Warning #{warningCount} — Repeated violations may result in exam disqualification.
              </p>
            </div>
            <Button onClick={onDismiss} className="bg-red-600 hover:bg-red-700 w-full">
              Return to Exam
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}