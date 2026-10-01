"use client";

import React, { useState, useEffect } from "react";

interface DashboardLoaderProps {
  message?: string;
  role?: string | null;
}

const TSION_TIPS = [
  {
    category: "POS & Cashier",
    title: "Quick Receipt Printing",
    description:
      "Cashiers can generate instant receipts and download PDFs directly from the Cashier Checkout tab.",
    icon: "🧾",
  },
  {
    category: "Inventory & Bar",
    title: "Stock Handoff Records",
    description:
      "Store managers can log shift item transfers to the bar under the Give to Bar module with real-time audit history.",
    icon: "🍷",
  },
  {
    category: "Night Sales Telemetry",
    title: "Automated Reconciliation",
    description:
      "Night Bar sales are automatically grouped by item and server for smooth end-of-day revenue audits.",
    icon: "🌙",
  },
  {
    category: "Security & Auditing",
    title: "Role-Based Access Control",
    description:
      "Super Admins and Managers have isolated privilege levels ensuring data integrity across all departments.",
    icon: "🛡️",
  },
  {
    category: "Operational Efficiency",
    title: "Live Dashboard Analytics",
    description:
      "Track daily totals, cashier reports, and low-stock alerts live from the centralized System Overview dashboard.",
    icon: "📊",
  },
];

const LOADING_STEPS = [
  { label: "Validating secure session token", duration: 400 },
  { label: "Synchronizing user profile & role permissions", duration: 500 },
  { label: "Loading inventory & cashier telemetry data", duration: 600 },
  { label: "Finalizing dashboard layout", duration: 400 },
];

export default function DashboardLoader({
  message = "Loading your dashboard...",
  role,
}: DashboardLoaderProps) {
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-rotate tips every 4.2 seconds unless hovered
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % TSION_TIPS.length);
    }, 4200);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Smooth progress bar & step progression
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prevStep) => {
        if (prevStep < LOADING_STEPS.length - 1) {
          return prevStep + 1;
        }
        return prevStep;
      });
    }, 650);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95; // Hold at 95% until unmounted
        const bump = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + bump, 95);
      });
    }, 250);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const handleNextTip = () => {
    setActiveTipIndex((prev) => (prev + 1) % TSION_TIPS.length);
  };

  const handlePrevTip = () => {
    setActiveTipIndex((prev) => (prev - 1 + TSION_TIPS.length) % TSION_TIPS.length);
  };

  const currentTip = TSION_TIPS[activeTipIndex];

  return (
    <div className="relative min-h-dvh w-full flex items-center justify-center bg-[#0f1117] text-[#e8e6e1] overflow-hidden p-4 sm:p-6 font-sans">
      {/* Dynamic Luxury Ambient Glowing Orbs */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(201,168,76,0.14)_0%,rgba(15,17,23,0)_70%)] pointer-events-none blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(30,36,53,0.6)_0%,rgba(15,17,23,0)_70%)] pointer-events-none blur-3xl" />

      {/* Decorative Subtle Background Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `linear-gradient(#c9a84c 1px, transparent 1px), linear-gradient(to right, #c9a84c 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center">
        
        {/* Animated Brand Emblem Header */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer Rotating Conic Ring */}
          <div className="absolute w-28 h-28 rounded-full bg-[conic-gradient(from_0deg,#c9a84c,transparent_60%,#c9a84c)] animate-[spin_4s_linear_infinite] opacity-70 p-[2px]">
            <div className="w-full h-full bg-[#0f1117] rounded-full" />
          </div>

          {/* Pulsing Glow Ring */}
          <div className="absolute w-24 h-24 rounded-full bg-[#c9a84c]/20 animate-ping opacity-30" />

          {/* Center Luxury Badge */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#242b3d] to-[#141824] border border-[#c9a84c]/40 flex items-center justify-center shadow-[0_0_35px_rgba(201,168,76,0.25)]">
            <div className="flex flex-col items-center justify-center">
              <span className="font-display font-bold text-2xl text-[#c9a84c] tracking-wider leading-none">
                T
              </span>
              <span className="text-[9px] uppercase tracking-widest text-[#a07828] font-semibold mt-1">
                Tsion
              </span>
            </div>
          </div>
        </div>

        {/* Title & Brand Name */}
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#e8e6e1] tracking-wide mb-1">
            Tsion Bar & Restaurant
          </h1>
          <p className="text-xs sm:text-sm text-[#7a8090]">
            {role ? `Preparing ${role.replace(/_/g, " ")} Workspace` : message}
          </p>
        </div>

        {/* Progress Bar Component */}
        <div className="w-full bg-[#181c27] border border-[#252b3b] rounded-2xl p-4 sm:p-5 shadow-xl mb-6 backdrop-blur-md">
          {/* Bar Header */}
          <div className="flex items-center justify-between text-xs font-medium mb-2.5">
            <span className="text-[#c9a84c] flex items-center gap-2 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse" />
              {LOADING_STEPS[currentStepIndex]?.label ?? "Finalizing setup..."}
            </span>
            <span className="text-[#e8e6e1] font-mono font-bold">{progress}%</span>
          </div>

          {/* Track & Filled Bar */}
          <div className="relative w-full h-2.5 bg-[#0f1117] rounded-full overflow-hidden border border-[#252b3b]">
            <div
              className="h-full bg-gradient-to-r from-[#a07828] via-[#c9a84c] to-[#e6ca65] rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(201,168,76,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Checklist Pipeline */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#252b3b]/60">
            {LOADING_STEPS.map((step, idx) => {
              const isDone = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2 text-[11px] transition-colors duration-300 ${
                    isDone
                      ? "text-[#c9a84c]"
                      : isCurrent
                      ? "text-[#e8e6e1] font-medium"
                      : "text-[#7a8090]/50"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
                      isDone
                        ? "bg-[#c9a84c] text-[#0f1117]"
                        : isCurrent
                        ? "border border-[#c9a84c] text-[#c9a84c] animate-pulse"
                        : "border border-[#252b3b] text-[#7a8090]/40"
                    }`}
                  >
                    {isDone ? "✓" : idx + 1}
                  </span>
                  <span className="truncate">{step.label.split(" ")[0]} {step.label.split(" ")[1]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive "Tsion Insights" Carousel Card */}
        <div
          className="w-full bg-[#181c27]/90 border border-[#c9a84c]/20 hover:border-[#c9a84c]/40 rounded-2xl p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Tip Header */}
          <div className="flex items-center justify-between mb-3 border-b border-[#252b3b] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentTip.icon}</span>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#c9a84c]">
                {currentTip.category}
              </span>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#7a8090] mr-1 font-mono">
                {activeTipIndex + 1} / {TSION_TIPS.length}
              </span>
              <button
                type="button"
                onClick={handlePrevTip}
                className="w-6 h-6 rounded-lg bg-[#0f1117] hover:bg-[#252b3b] border border-[#252b3b] flex items-center justify-center text-[#e8e6e1] hover:text-[#c9a84c] transition-colors text-xs cursor-pointer"
                title="Previous Tip"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={handleNextTip}
                className="w-6 h-6 rounded-lg bg-[#0f1117] hover:bg-[#252b3b] border border-[#252b3b] flex items-center justify-center text-[#e8e6e1] hover:text-[#c9a84c] transition-colors text-xs cursor-pointer"
                title="Next Tip"
              >
                ›
              </button>
            </div>
          </div>

          {/* Tip Content */}
          <div className="min-h-[56px] flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-[#e8e6e1] mb-1">
              {currentTip.title}
            </h3>
            <p className="text-xs text-[#7a8090] leading-relaxed">
              {currentTip.description}
            </p>
          </div>
        </div>

        {/* Footer System Status Pills */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-[#7a8090]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </span>
          <span className="text-[#252b3b]">|</span>
          <span>Encrypted Session</span>
          <span className="text-[#252b3b]">|</span>
          <span>Tsion v2.0</span>
        </div>

      </div>
    </div>
  );
}
