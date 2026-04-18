import React, { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

interface Project4ViewProps {
  onBack: () => void;
}

export default function Project4View({ onBack }: Project4ViewProps) {
  // Counts for each of the 6 groups
  const [counts, setCounts] = useState([0, 0, 0, 0, 0, 0]);

  const incrementGroup = (index: number) => {
    const newCounts = [...counts];
    newCounts[index] += 1;
    setCounts(newCounts);
  };

  const maxCount = useMemo(() => Math.max(1, ...counts), [counts]);

  return (
    <div className="h-screen bg-[#1e293b] flex flex-col font-sans text-white overflow-hidden">
      <header className="h-[70px] bg-[#0f172a] border-b border-white/10 flex items-center px-6 shrink-0 relative z-10">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[20px] font-bold ml-4">按键互动动态排名 (项目4)</h1>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Side (2/3 width) - Chart Area */}
        <div className="flex-[2] p-8 border-r border-white/10 relative flex flex-col">
          <div className="absolute top-8 left-8">
            <h2 className="text-2xl font-bold text-white/50 tracking-wider">实时排名大屏</h2>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-4 mt-16 pb-4">
            {counts.map((count, index) => {
              // Calculate percentage height with a small baseline so bars never completely disappear
              const heightPercent = maxCount === 0 ? 0 : (count / maxCount) * 100;
              
              // Colors for different groups
              const colors = [
                "bg-blue-500", 
                "bg-emerald-500", 
                "bg-amber-500", 
                "bg-rose-500", 
                "bg-purple-500", 
                "bg-cyan-500"
              ];
              const colorCls = colors[index];

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="mb-4 text-[24px] font-black text-white/80 group-hover:text-white transition-colors">
                    {count}
                  </div>
                  <div className="w-full relative h-full flex items-end justify-center">
                    <motion.div 
                      className={`w-full max-w-[80px] rounded-t-xl ${colorCls} shadow-[0_0_20px_rgba(255,255,255,0.1)]`}
                      initial={{ height: "0%" }}
                      animate={{ height: `${Math.max(2, heightPercent)}%` }} // At least 2% height so it's visible
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    />
                  </div>
                  <div className="mt-6 text-[18px] font-bold text-white/60 tracking-wider w-full text-center py-2 border-t border-white/10">
                    组 {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side (1/3 width) - Buttons */}
        <div className="flex-[1] bg-[#0f172a]/50 p-8 flex flex-col items-center justify-center gap-6">
          <h3 className="text-xl font-bold text-white/70 mb-4 whitespace-nowrap">按下按钮积分</h3>
          
          <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 w-full">
            {counts.map((_, index) => {
               const colors = [
                "hover:bg-blue-600 bg-blue-500/20 text-blue-400 border-blue-500/30", 
                "hover:bg-emerald-600 bg-emerald-500/20 text-emerald-400 border-emerald-500/30", 
                "hover:bg-amber-600 bg-amber-500/20 text-amber-400 border-amber-500/30", 
                "hover:bg-rose-600 bg-rose-500/20 text-rose-400 border-rose-500/30", 
                "hover:bg-purple-600 bg-purple-500/20 text-purple-400 border-purple-500/30", 
                "hover:bg-cyan-600 bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
              ];
              const btnCls = colors[index];

              return (
                <button
                  key={index}
                  onClick={() => incrementGroup(index)}
                  className={`w-full aspect-square max-h-[160px] rounded-2xl border-2 font-black text-2xl uppercase tracking-widest transition-all active:scale-95 ${btnCls} hover:text-white hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`}
                >
                  组 {index + 1}
                </button>
              );
            })}
          </div>
          
          <button 
             onClick={() => setCounts([0,0,0,0,0,0])}
             className="mt-8 text-white/30 hover:text-white/60 underline underline-offset-4 font-medium transition-colors"
          >
             重置所有分数
          </button>
        </div>
      </main>
    </div>
  );
}
