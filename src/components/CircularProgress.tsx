"use client";

import React, { useEffect, useState } from "react";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  label?: string;
}

export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  colorClass = "text-blue-600 dark:text-blue-400",
  label,
}: CircularProgressProps) {
  const [currentPercent, setCurrentPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPercent(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (currentPercent / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-slate-100 dark:text-slate-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Foreground circle */}
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center Text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-slate-800 dark:text-white">
          {Math.round(currentPercent)}%
        </span>
        {label && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wider uppercase">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  percentage: number;
  label: string;
  colorClass?: string;
}

export function ProgressBar({ percentage, label, colorClass = "bg-blue-600 dark:bg-blue-500" }: ProgressBarProps) {
  const [currentPercent, setCurrentPercent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPercent(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <span className="font-bold text-slate-900 dark:text-white">{Math.round(currentPercent)}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: `${currentPercent}%` }}
        />
      </div>
    </div>
  );
}
