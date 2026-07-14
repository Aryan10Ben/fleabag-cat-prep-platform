"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative overflow-hidden bg-[url('/fleabag-bg.jpg')] bg-cover bg-center">
      {/* Dark premium overlay for readability */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-0"></div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="max-w-3xl w-full flex flex-col items-center justify-center text-center space-y-6 md:space-y-8">
          
          {/* Logo Badge */}
          <div className="flex justify-center w-full">
            <Image 
              src="/landing-logo.png" 
              alt="CATPrep Logo" 
              width={160} 
              height={216} 
              className="w-36 sm:w-44 h-auto mx-auto drop-shadow-2xl object-contain" 
              priority
            />
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] drop-shadow-md">
            hi, Fleabag :)
          </h1>

          {/* Call to Action */}
          <div className="flex items-center justify-center mt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl shadow-md backdrop-blur-md active:scale-[0.98] transition-all"
            >
              Start <ArrowRight className="h-4.5 w-4.5 opacity-90" />
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
