import React, { useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [studentId, setStudentId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const { user, isLoadingAuth } = useAuth();

    // Protect route: Only admins can access this page
    if (!isLoadingAuth && (!user || user.role !== 'admin')) {
        toast.error("Unauthorized: Only Administrators can create accounts.");
        return <Navigate to="/" replace />;
    }

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Validate student_id requirement locally before API ping
        if (role === 'student' && !studentId.trim()) {
            toast.error("Student ID is required for student accounts");
            setIsLoading(false);
            return;
        }

        try {
            await api.post('/auth/register', {
                name,
                email,
                password,
                role,
                student_id: role === 'student' ? studentId : undefined
            });

            toast.success(`${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully!`);
            // Reset form for admin to add another
            setName(''); setEmail(''); setPassword(''); setStudentId('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Prevent flash of form before auth check completes
    if (isLoadingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative pt-20">
            {/* Absolute positioning for Admin Dashboard Back Link so it doesn't shift the card */}
            <div className="absolute top-8 left-8">
                <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
                    ← Return to Dashboard
                </Link>
            </div>

            <Card className="w-full max-w-md shadow-xl border-slate-200/60">
                <CardHeader className="space-y-2 pb-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl font-bold tracking-tight">Create User</CardTitle>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Admin Access</span>
                    </div>
                    <CardDescription className="text-slate-500">Register a new student, teacher, or administrator to the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2.5">
                            <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                            <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required className="transition-all duration-200 focus-visible:ring-2" />
                        </div>
                        <div className="space-y-2.5">
                            <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                            <Input id="email" type="email" placeholder="john@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="transition-all duration-200 focus-visible:ring-2" />
                        </div>
                        <div className="space-y-2.5">
                            <Label htmlFor="role" className="text-slate-700">Account Type</Label>
                            <select
                                id="role"
                                value={role}
                                onChange={(e) => {
                                    setRole(e.target.value);
                                    if (e.target.value !== 'student') setStudentId('');
                                }}
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:bg-slate-50 cursor-pointer"
                            >
                                <option value="student">Student</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Administrator</option>
                            </select>
                        </div>

                        {/* Dynamic Field: Student ID */}
                        <div className={`space-y-2.5 overflow-hidden transition-all duration-300 ease-in-out ${role === 'student' ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <Label htmlFor="studentId" className="text-slate-700 flex justify-between">
                                Student ID Roll/Index
                                <span className="text-xs font-normal text-orange-500">* Required</span>
                            </Label>
                            <Input
                                id="studentId"
                                type="text"
                                placeholder="e.g. STU-2026-001"
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                                required={role === 'student'}
                                className="border-orange-200 focus-visible:ring-orange-500 bg-orange-50/30"
                            />
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="password" className="text-slate-700">Temporary Password</Label>
                            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="transition-all duration-200 focus-visible:ring-2" />
                        </div>

                        <div className="pt-2">
                            <Button type="submit" className="w-full h-11 font-medium transition-all" disabled={isLoading}>
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    "Register User"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
