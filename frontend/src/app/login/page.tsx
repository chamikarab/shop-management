"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FaBeer, FaEnvelope, FaLock, FaArrowRight } from "react-icons/fa";
import BeerLoader from "@/components/BeerLoader";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }

      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success("Identity Verified. Welcome back!");
      router.push("/admin");
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : "Unexpected error";
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      {loading && <BeerLoader />}
    <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* --- LAYER 1: DYNAMIC MESH GRADIENT --- */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[100%] md:w-[60%] h-[60%] bg-indigo-900/20 blur-[120px] rounded-full animate-mesh-1" />
        <div className="absolute bottom-[0%] right-[-5%] w-[100%] md:w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full animate-mesh-2" />
        <div className="absolute top-[30%] left-[20%] w-[100%] md:w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full animate-mesh-3" />
        
        {/* Fine Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <div className="relative z-10 w-full max-w-[520px] px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* --- BRANDING: LUXURY STACK --- */}
        <div className="text-center mb-8 sm:mb-12 space-y-4 sm:space-y-6">
          <div className="relative inline-block">
            {/* Reactive Glow behind Logo */}
            <div className={`absolute inset-[-20px] bg-indigo-500/20 blur-3xl rounded-full transition-all duration-700 ${focusField ? 'opacity-60 scale-125' : 'opacity-20 scale-100'}`} />
            
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl group transition-all duration-700 hover:scale-110 hover:rotate-3">
              <div className="absolute inset-1 border border-white/5 rounded-[1.8rem] sm:rounded-[2.2rem]" />
              <FaBeer className="text-indigo-500 text-3xl sm:text-4xl drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-3 px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.08em] text-white uppercase italic leading-none">
              SISILA <span className="text-transparent bg-clip-text bg-gradient-to-b from-indigo-200 via-indigo-500 to-indigo-200 not-italic">BEER</span>
            </h1>
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <div className="h-px w-6 sm:w-10 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              <p className="text-slate-500 font-black text-[8px] sm:text-[10px] uppercase tracking-[0.4em] sm:tracking-[0.6em] whitespace-nowrap">Premium POS System 2026</p>
              <div className="h-px w-6 sm:w-10 bg-gradient-to-l from-transparent via-slate-700 to-transparent" />
            </div>
          </div>
        </div>

        {/* --- AUTHENTICATION: 2026 TACTILE PORTAL --- */}
        <div className={`w-full relative group/card transition-all duration-1000 ${focusField ? 'scale-[1.01]' : 'scale-100'}`}>
          {/* Reactive Outer Glow */}
          <div className={`absolute -inset-1 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-indigo-500/20 blur-2xl rounded-[3rem] sm:rounded-[4rem] transition-opacity duration-1000 ${focusField ? 'opacity-100' : 'opacity-0'}`} />
          
          <div className={`relative overflow-hidden bg-slate-950/40 backdrop-blur-[120px] border rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 md:p-14 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] transition-all duration-700 ${focusField ? 'border-indigo-500/40 shadow-indigo-500/10' : 'border-white/10'}`}>
            {/* Architectural Glass Details */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            {/* Dynamic Light Sweep */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-[2.5rem] sm:rounded-[3.5rem]">
              <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-25deg] animate-sweep" />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-10 relative z-10">
              <div className="space-y-6 sm:space-y-8">
                {/* Precision Input: Registry ID */}
                <div className="space-y-2 group/input">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] group-focus-within/input:text-indigo-400 transition-colors duration-500">Registry ID</label>
                    <span className="text-[7px] sm:text-[8px] font-black text-indigo-500/40 uppercase tracking-widest opacity-0 group-focus-within/input:opacity-100 transition-opacity whitespace-nowrap">Active Node</span>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-500 transition-all duration-500 group-focus-within/input:scale-110">
                      <FaEnvelope size={12} className="sm:size-[14px]" />
                    </div>
                    <input
                      type="email"
                      placeholder="admin@sisilabeer.com"
                      value={email}
                      onFocus={() => setFocusField("email")}
                      onBlur={() => setFocusField(null)}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.05] rounded-[1.2rem] sm:rounded-[1.5rem] py-4 sm:py-5 pl-12 sm:pl-14 pr-4 sm:pr-6 text-white placeholder:text-slate-800 focus:outline-none focus:bg-black/60 focus:border-indigo-500/50 focus:ring-[1px] focus:ring-white/10 transition-all duration-500 font-medium text-sm sm:text-base shadow-inner"
                      required
                    />
                    {/* Focus Underline Accent */}
                    <div className="absolute bottom-0 left-4 sm:left-6 right-4 sm:right-6 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-700" />
                  </div>
                </div>

                {/* Precision Input: Security Key */}
                <div className="space-y-2 group/input">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] group-focus-within/input:text-indigo-400 transition-colors duration-500">Security Key</label>
                    <button type="button" className="text-[8px] sm:text-[9px] font-black text-slate-600 hover:text-indigo-400 uppercase tracking-widest transition-colors whitespace-nowrap">Emergency Protocol</button>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-500 transition-all duration-500 group-focus-within/input:scale-110">
                      <FaLock size={12} className="sm:size-[14px]" />
                    </div>
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onFocus={() => setFocusField("password")}
                      onBlur={() => setFocusField(null)}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/[0.05] rounded-[1.2rem] sm:rounded-[1.5rem] py-4 sm:py-5 pl-12 sm:pl-14 pr-4 sm:pr-6 text-white placeholder:text-slate-800 focus:outline-none focus:bg-black/60 focus:border-indigo-500/50 focus:ring-[1px] focus:ring-white/10 transition-all duration-500 font-medium text-sm sm:text-base tracking-widest shadow-inner"
                      required
                    />
                    {/* Focus Underline Accent */}
                    <div className="absolute bottom-0 left-4 sm:left-6 right-4 sm:right-6 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-700" />
                  </div>
                </div>
              </div>

              {/* High-Impact Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group/btn py-5 sm:py-6 bg-white rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.15)]"
              >
                {/* Internal Shimmer */}
                <div className="absolute inset-0 translate-x-[-150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-slate-100/80 to-transparent skew-x-[-25deg] z-20" />
                
                {/* Fill Animation */}
                <div className="absolute inset-0 bg-slate-950 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4">
                  {loading ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-3 border-slate-900 group-hover/btn:border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-slate-950 group-hover/btn:text-white font-black uppercase tracking-[0.4em] sm:tracking-[0.6em] text-[11px] sm:text-[13px] transition-colors duration-500 whitespace-nowrap">Initialize POS</span>
                      <FaArrowRight className="text-slate-950 group-hover/btn:text-white group-hover:translate-x-2 transition-all duration-500" size={12} />
                    </>
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>

        {/* --- FOOTER: MINIMALIST ELEGANCE --- */}
        <div className="mt-8 sm:mt-16 text-center space-y-4 sm:space-y-6 opacity-40 hover:opacity-100 transition-opacity duration-700 w-full px-4">
          <div className="group/credit cursor-default">
            <p className="text-slate-600 font-bold text-[9px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.3em] uppercase">
              POWERED BY <span className="text-white font-black group-hover/credit:text-indigo-500 transition-all duration-700 relative inline-block">
                CHAMIKARA BANDARA
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-500/50 transition-all duration-700 group-hover/credit:w-full" />
              </span>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes mesh-1 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10%, 10%) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes mesh-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10%, -5%) scale(1.2); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes mesh-3 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, -10%) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-mesh-1 { animation: mesh-1 20s ease-in-out infinite; }
        .animate-mesh-2 { animation: mesh-2 25s ease-in-out infinite; }
        .animate-mesh-3 { animation: mesh-3 18s ease-in-out infinite; }
        @keyframes sweep {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
        .animate-sweep {
          animation: sweep 10s ease-in-out infinite;
        }
      `}</style>
    </div>
    </>
  );
}

