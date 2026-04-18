import React from 'react';
import { Activity, ClipboardList, BarChart3, Settings } from 'lucide-react';
import { ViewState } from '../App';

interface HomeViewProps {
  onNavigate: (view: ViewState) => void;
}

export default function HomeView({ onNavigate }: HomeViewProps) {
  const cardStyles = "bg-white p-8 rounded-[20px] shadow-[0_10px_25px_rgba(0,0,0,0.05)] border border-[#e2e8f0] flex flex-col items-center justify-center cursor-pointer transition-all hover:-translate-y-2 hover:shadow-[0_20px_35px_rgba(0,0,0,0.1)] group";

  return (
    <div className="h-screen bg-[#f8fafc] font-sans p-6 lg:p-12 flex flex-col overflow-hidden">
      <header className="flex justify-between items-center mb-8 shrink-0">
        <h1 className="text-[32px] font-[800] text-[#1e293b] tracking-tight">体育项目总考核</h1>
        <button 
          onClick={() => onNavigate('teacher')}
          className="flex items-center gap-2 bg-white border border-[#e2e8f0] px-5 py-2.5 rounded-xl text-[#64748b] hover:text-[#2563eb] hover:border-[#2563eb] transition-colors font-medium shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
        >
          <Settings className="w-5 h-5" />
          后台管理
        </button>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto w-full h-full">
          <div className={cardStyles} onClick={() => onNavigate('jump')}>
            <div className="w-20 h-20 rounded-full bg-[#eff6ff] text-[#2563eb] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <Activity className="w-10 h-10" />
            </div>
            <h2 className="text-[22px] font-bold text-[#1e293b] mb-2">跳跃小裁判</h2>
            <p className="text-[#64748b] text-center text-[14px]">双脚/单脚跳跃AI智能检测评分</p>
          </div>

          <div className={cardStyles} onClick={() => onNavigate('p1')}>
            <div className="w-20 h-20 rounded-full bg-[#f0fdf4] text-[#10b981] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-10 h-10" />
            </div>
            <h2 className="text-[22px] font-bold text-[#1e293b] mb-2">项目1</h2>
            <p className="text-[#64748b] text-center text-[14px]">基本动作三项指标快速打分</p>
          </div>

          <div className={cardStyles} onClick={() => onNavigate('p2')}>
            <div className="w-20 h-20 rounded-full bg-[#fffbeb] text-[#d97706] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-10 h-10" />
            </div>
            <h2 className="text-[22px] font-bold text-[#1e293b] mb-2">项目2</h2>
            <p className="text-[#64748b] text-center text-[14px]">进阶标准考核三项指标快速打分</p>
          </div>

          <div className={cardStyles} onClick={() => onNavigate('p3')}>
            <div className="w-20 h-20 rounded-full bg-[#fdf4ff] text-[#c026d3] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-10 h-10" />
            </div>
            <h2 className="text-[22px] font-bold text-[#1e293b] mb-2">项目3</h2>
            <p className="text-[#64748b] text-center text-[14px]">综合体能考察三项指标快速打分</p>
          </div>

          <div className={cardStyles} onClick={() => onNavigate('p4')}>
            <div className="w-20 h-20 rounded-full bg-[#fef2f2] text-[#ef4444] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-10 h-10" />
            </div>
            <h2 className="text-[22px] font-bold text-[#1e293b] mb-2">项目4 (排名动态)</h2>
            <p className="text-[#64748b] text-center text-[14px]">组别按键互动柱状图大屏实时展示</p>
          </div>
        </div>
      </div>
    </div>
  );
}
