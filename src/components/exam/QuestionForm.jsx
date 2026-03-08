import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_OPTIONS = [
  { label: "A", text: "" },
  { label: "B", text: "" },
  { label: "C", text: "" },
  { label: "D", text: "" },
];

export default function QuestionForm({ onSave, onCancel, initialData }) {
  const [data, setData] = useState(initialData || {
    question_text: "",
    question_type: "mcq",
    options: DEFAULT_OPTIONS,
    correct_answer: "",
    marks: 1,
  });

  const handleOptionChange = (index, value) => {
    const opts = [...data.options];
    opts[index] = { ...opts[index], text: value };
    setData({ ...data, options: opts });
  };

  const addOption = () => {
    const nextLabel = String.fromCharCode(65 + data.options.length);
    setData({ ...data, options: [...data.options, { label: nextLabel, text: "" }] });
  };

  const removeOption = (index) => {
    if (data.options.length <= 2) return;
    setData({ ...data, options: data.options.filter((_, i) => i !== index) });
  };

  const handleSaveWrapper = () => {
    if (!data.question_text.trim()) {
      return toast.error("Question text is required.");
    }
    if (data.question_type === "mcq") {
      if (data.options.some((opt) => !opt.text.trim())) {
        return toast.error("All multiple choice options must have text.");
      }
      if (!data.correct_answer) {
        return toast.error("Please select a correct answer.");
      }
    } else if (data.question_type === "theory") {
      if (!data.correct_answer.trim()) {
        return toast.error("A model answer is required.");
      }
    }
    if (!data.marks || data.marks < 1) {
      return toast.error("Marks must be at least 1.");
    }

    onSave(data);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-white text-base">{initialData ? "Edit Question" : "New Question"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label className="text-slate-300">Question Text</Label>
            <Textarea
              value={data.question_text}
              onChange={(e) => setData({ ...data, question_text: e.target.value })}
              placeholder="Enter your question..."
              className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
            />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Type</Label>
              <Select value={data.question_type} onValueChange={(v) => setData({ ...data, question_type: v })}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="theory">Theory / Essay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Marks</Label>
              <Input
                type="number"
                min={1}
                value={data.marks}
                onChange={(e) => setData({ ...data, marks: Number(e.target.value) })}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>
        </div>

        {data.question_type === "mcq" && (
          <div className="space-y-3">
            <Label className="text-slate-300">Options</Label>
            {data.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-blue-400 font-mono w-6 text-center">{opt.label}</span>
                <Input
                  value={opt.text}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={`Option ${opt.label}`}
                  className="bg-slate-900 border-slate-700 text-white flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => removeOption(i)} className="text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption} className="text-slate-400 border-slate-700 hover:bg-slate-800">
              <Plus className="w-3 h-3 mr-1" /> Add Option
            </Button>

            <div className="space-y-2">
              <Label className="text-slate-300">Correct Answer</Label>
              <Select value={data.correct_answer} onValueChange={(v) => setData({ ...data, correct_answer: v })}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white w-32">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {data.options.map((opt) => (
                    <SelectItem key={opt.label} value={opt.label}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {data.question_type === "theory" && (
          <div className="space-y-2">
            <Label className="text-slate-300">Model Answer (for reference)</Label>
            <Textarea
              value={data.correct_answer}
              onChange={(e) => setData({ ...data, correct_answer: e.target.value })}
              placeholder="Enter the model answer..."
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white">Cancel</Button>
          <Button onClick={handleSaveWrapper} className="bg-blue-600 hover:bg-blue-700 gap-1">
            <Save className="w-4 h-4" /> Save Question
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}