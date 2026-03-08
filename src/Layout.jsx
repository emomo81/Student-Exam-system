import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/api/apiClient";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import {
    LayoutDashboard, FileText, Shield, BarChart3, GraduationCap,
    LogOut, Menu, X, ChevronRight, User
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = {
    admin: [
        { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
        { label: "Exam Manager", icon: FileText, page: "ExamManager" },
        { label: "Integrity Analytics", icon: Shield, page: "IntegrityAnalytics" },
        { label: "Results", icon: BarChart3, page: "Results" },
    ],
    teacher: [
        { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
        { label: "Exam Manager", icon: FileText, page: "ExamManager" },
        { label: "Integrity Analytics", icon: Shield, page: "IntegrityAnalytics" },
        { label: "Results", icon: BarChart3, page: "Results" },
    ],
    student: [
        { label: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
        { label: "My Exams", icon: GraduationCap, page: "StudentExams" },
        { label: "My Results", icon: BarChart3, page: "Results" },
    ],
};

export default function Layout({ children, currentPageName }) {
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    if (currentPageName === "TakeExam") {
        return <>{children}</>;
    }

    const role = user?.role || "student";
    const navItems = NAV_ITEMS[role] || NAV_ITEMS.student;

    return (
        <div className="min-h-screen bg-slate-950 flex">
            <style>{`
        :root {
          --accent: #3b82f6;
          --accent-light: #60a5fa;
        }
      `}</style>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-white font-bold text-lg tracking-tight">ExamGuard</h1>
                                <p className="text-slate-500 text-xs">Universal Exam Platform</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive = currentPageName === item.page;
                            return (
                                <Link
                                    key={item.page}
                                    to={createPageUrl(item.page)}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                            : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                        }
                  `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User */}
                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{user?.full_name || "User"}</p>
                                <p className="text-xs text-slate-500 capitalize">{role}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-500 hover:text-red-400"
                                onClick={() => logout()}
                            >
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 min-h-screen">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <span className="text-white font-bold">ExamGuard</span>
                    </div>
                    <div className="w-10" />
                </div>

                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}