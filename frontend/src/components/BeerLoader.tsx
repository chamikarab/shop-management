"use client";

import React, { useEffect, useState } from "react";

const BeerLoader = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xl transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="relative flex flex-col items-center">
        {/* --- 2026 CRAFT STEIN --- */}
        <div className="relative transform scale-110 sm:scale-125 mb-16 group">
          
          {/* Heavy Glass Handle with Inner Shadow */}
          <div className="absolute top-10 -right-9 w-14 h-24 border-[8px] border-white/80 border-l-0 rounded-r-[3rem] shadow-[inset_-4px_0_15px_rgba(255,255,255,0.1),10px_0_30px_rgba(0,0,0,0.3)] z-0 transition-transform duration-500 group-hover:scale-105"></div>
          
          {/* Tapered Mug Body */}
          <div className="relative w-32 h-44 bg-white/5 border-[7px] border-white/95 rounded-b-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(255,255,255,0.05),inset_0_0_40px_rgba(255,255,255,0.1)] z-10 backdrop-blur-md">
            
            {/* Architectural Glass Dimples (Creative Texturing) */}
            <div className="absolute inset-0 grid grid-cols-3 gap-2 p-4 opacity-15 pointer-events-none">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-full h-10 rounded-full bg-gradient-to-br from-white/30 to-transparent border border-white/10 shadow-inner"></div>
              ))}
            </div>

            {/* Frost/Condensation Gradient */}
            <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-white/10 to-transparent opacity-40 z-20"></div>

            {/* Beer Liquid Container */}
            <div className="absolute bottom-0 left-0 w-full animate-beer-fill-enhanced origin-bottom overflow-visible">
              
              {/* Complex Amber Liquid with Internal Glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#8E2D00] via-[#D35400] via-[#F39C12] to-[#FFD700] shadow-[inset_0_15px_30px_rgba(255,255,255,0.4)]">
                
                {/* Waving Liquid Surface */}
                <div className="absolute top-[-10px] left-0 w-[200%] h-4 bg-[#FFD700] animate-liquid-wave opacity-80"></div>

                {/* Dynamic Carbonation Bubbles */}
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`bubble-enhanced bubble-${(i % 8) + 1}`}
                  ></div>
                ))}
              </div>

              {/* Artisan Foam Head - Overflowing & Rich */}
              <div className="absolute bottom-full left-[-15%] w-[130%] h-18 opacity-0 animate-foam-appear-enhanced z-40">
                <div className="relative w-full h-full">
                  <div className="absolute bottom-0 left-4 w-16 h-16 bg-white rounded-full shadow-lg"></div>
                  <div className="absolute bottom-2 left-12 w-20 h-20 bg-white rounded-full shadow-lg"></div>
                  <div className="absolute bottom-1 left-24 w-18 h-18 bg-white rounded-full shadow-lg"></div>
                  <div className="absolute bottom-[-5px] left-[-5px] w-14 h-14 bg-white rounded-full shadow-lg"></div>
                  <div className="absolute bottom-[-10px] right-[-5px] w-12 h-12 bg-white rounded-full shadow-lg"></div>
                  
                  {/* Foam Highlight */}
                  <div className="absolute bottom-10 left-1/4 w-1/2 h-2 bg-white/40 rounded-full blur-[2px]"></div>
                </div>
              </div>
            </div>

            {/* High-Key Glass Reflections */}
            <div className="absolute top-6 left-6 w-3 h-32 bg-white/20 rounded-full blur-[3px] z-50"></div>
            <div className="absolute bottom-10 right-4 w-1.5 h-16 bg-white/10 rounded-full blur-[2px] z-50"></div>
          </div>

          {/* Polished Rim Geometry */}
          <div className="absolute -top-2 left-0 w-32 h-8 border-[4px] border-white/40 rounded-[50%] z-30 bg-white/10 backdrop-blur-md shadow-2xl"></div>
        </div>

        {/* --- CINEMATIC BRANDING --- */}
        <div className="flex flex-col items-center gap-8 mt-12 text-center">
          <div className="space-y-3 relative">
            <div className="absolute -inset-6 bg-amber-500/5 blur-3xl rounded-full animate-pulse"></div>
            <h3 className="relative text-white font-black tracking-[0.8em] text-sm sm:text-base uppercase drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
              Crafting Experience
            </h3>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
              <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.5em] animate-pulse">
                Synchronizing Nodes
              </p>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
            </div>
          </div>

          <div className="relative group">
            <div className="h-[2px] w-64 bg-white/5 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent animate-loading-bar-cinematic" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeerLoader;
