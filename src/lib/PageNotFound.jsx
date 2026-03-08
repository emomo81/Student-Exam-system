import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Shield, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <Shield className="w-16 h-16 text-blue-400 mx-auto mb-6 opacity-50" />
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <p className="text-slate-400 text-lg mb-8">Page not found</p>
        <Link to={createPageUrl("Dashboard")}>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Home className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}