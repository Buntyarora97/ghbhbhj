import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Crown, Mail, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState("admin@hks.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || "Failed to login");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`} 
          alt="Royal Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-yellow-700 shadow-xl shadow-primary/20 mb-6 relative">
            <div className="absolute inset-1 rounded-full border-2 border-black/20" />
            <Crown className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">Haryana Ki Shan</h1>
          <p className="text-primary tracking-widest uppercase text-sm font-semibold">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card/60 backdrop-blur-xl p-8 rounded-3xl border border-border shadow-2xl shadow-black/50">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">Email Address</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-5 h-5" />}
                placeholder="admin@hks.com"
                className="bg-black/40 border-white/10 focus-visible:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5 ml-1">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                placeholder="••••••••"
                className="bg-black/40 border-white/10 focus-visible:ring-primary/50"
              />
            </div>
          </div>

          <Button type="submit" className="w-full text-lg h-14 mt-4" isLoading={isLoggingIn}>
            Access Portal
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
