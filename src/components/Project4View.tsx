import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Database } from 'lucide-react';
import { motion } from 'motion/react';
import { db, signInAnonymous, app } from '../lib/cloudbase';

interface Project4ViewProps {
  onBack: () => void;
}

export default function Project4View({ onBack }: Project4ViewProps) {
  const [counts, setCounts] = useState([0, 0, 0, 0, 0, 0]);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Connection and Status tracking
  const [connState, setConnState] = useState<'init' | 'logging_in' | 'connected' | 'error'>('init');
  const [connError, setConnError] = useState('');
  const [syncMsg, setSyncMsg] = useState('');

  // 1. Ensure initialization sequence
  useEffect(() => {
    let active = true;
    setConnState('logging_in');
    
    // Explicitly sign in before enabling functionality
    signInAnonymous().then(() => {
      if (!active) return;
      setConnState('connected');
      fetchData(); // Run an immediate fetch
    }).catch(err => {
      if (!active) return;
      setConnState('error');
      setConnError(err.message || String(err));
      alert("初始化连接失败: " + String(err));
      console.error(err);
    });

    return () => { active = false; };
  }, []);

  // 2. HTTP Polling
  const fetchData = () => {
    db.collection('p4_global_state').doc('global_doc').get().then((res) => {
      // 成功拉取到数据，强制只认这个特定ID的文档
      if (res.data && res.data.length > 0) {
        const d = res.data[0];
        setCounts([d.c0 || 0, d.c1 || 0, d.c2 || 0, d.c3 || 0, d.c4 || 0, d.c5 || 0]);
      }
    }).catch(err => {
      console.error("Fetch GET Error:", err);
    });
  };

  useEffect(() => {
    if (connState !== 'connected') return;

    // 拉取数据定时器 (每 2 秒一次纯 GET 请求)
    const intervalId = setInterval(fetchData, 2000);
    return () => clearInterval(intervalId);
  }, [connState]);

  // 写入动作包装器 (带弹窗拦截和 UI 更新)
  const doUpdateCloud = (newCounts: number[], actionDesc: string) => {
    if (connState !== 'connected') {
      alert("错误：请等待云端连接成功后再操作！");
      return;
    }
    
    // UI 文字更新：正在发送...
    setSyncMsg(actionDesc);
    console.log(`[Heartbeat] ${actionDesc}`, newCounts);
    
    // 强制直接复写同一个全球唯一文档 (upsert)
    db.collection('p4_global_state').doc('global_doc').set({
      projectId: 'p4_state',
      c0: newCounts[0],
      c1: newCounts[1],
      c2: newCounts[2],
      c3: newCounts[3],
      c4: newCounts[4],
      c5: newCounts[5]
    }).then(() => {
      console.log("[Heartbeat] 云端已成功更新");
      setSyncMsg('云端已更新');
      setTimeout(() => setSyncMsg(''), 2500);
    }).catch((err) => {
      console.error("[Heartbeat] 写入失败", err);
      setSyncMsg(`写入失败: ${err.message}`);
      alert("云端写入失败，强制静默已取消！详情请看控制台。\n错误: " + err.message);
    });
  };

  const incrementGroup = (index: number) => {
    if (connState !== 'connected') {
      alert("写入阻断：云端未连接");
      return;
    }

    const newCounts = [...counts];
    newCounts[index] += 1;
    setCounts(newCounts); // 乐观更新

    doUpdateCloud(newCounts, `正在发送 c${index} 增加请求...`);
  };

  const doClear = () => {
    setShowConfirm(false);
    if (connState !== 'connected') {
      alert("写入阻断：云端未连接");
      return;
    }

    const newCounts = [0, 0, 0, 0, 0, 0];
    setCounts(newCounts); // 乐观更新

    doUpdateCloud(newCounts, `正在发送清零请求...`);
  };

  const maxCount = useMemo(() => Math.max(1, ...counts), [counts]);

  // Top bar visual states
  const getConnBarParams = () => {
    switch(connState) {
      case 'init': return { bg: 'bg-gray-600', text: '未连接 -> 初始化' };
      case 'logging_in': return { bg: 'bg-yellow-500', text: '登录中... -> 正在匿名登录' };
      case 'connected': return { bg: 'bg-emerald-500', text: `已连接云端` };
      case 'error': return { bg: 'bg-red-500', text: `连接失败: ${connError}` };
    }
  };
  const connBar = getConnBarParams();

  return (
    <div className="h-screen bg-[#1e293b] flex flex-col font-sans text-white overflow-hidden relative">
      
      {/* 2. 状态提示条 */}
      <div className={`w-full py-1 text-center font-bold text-xs shadow-md z-50 ${connBar.bg} text-white`}>
        {connBar.text}
      </div>

      {/* 4. 心跳调试输出浮层 */}
      {syncMsg && (
        <div className="absolute top-16 right-4 z-50 bg-black/80 px-4 py-2 rounded-lg border border-white/20 shadow-xl flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 font-mono text-sm">{syncMsg}</span>
        </div>
      )}

      <header className="h-[60px] bg-[#0f172a] border-b border-white/10 flex items-center px-4 shrink-0 relative z-10">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[18px] md:text-[20px] font-bold ml-4">按键互动动态排名 (项目4)</h1>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 relative">
        {/* Left Side (Chart Area) */}
        <div className="flex-[3] lg:flex-[2] p-4 md:p-8 flex flex-col relative overflow-hidden min-h-[40%]">
          <div className="absolute top-4 left-4 md:top-8 md:left-8">
            <h2 className="text-xl md:text-2xl font-bold text-white/50 tracking-wider">实时排名大屏</h2>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 mt-16 pb-4">
            {counts.map((count, index) => {
              const heightPercent = maxCount === 0 ? 0 : (count / maxCount) * 100;
              const colors = [
                "bg-blue-500", "bg-emerald-500", "bg-amber-500", 
                "bg-rose-500", "bg-purple-500", "bg-cyan-500"
              ];
              const colorCls = colors[index];

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <div className="mb-2 md:mb-4 text-[18px] md:text-[24px] font-black text-white/80 group-hover:text-white transition-colors">
                    {count}
                  </div>
                  <div className="w-full relative h-[80%] flex items-end justify-center">
                    <motion.div 
                      className={`w-full max-w-[40px] md:max-w-[80px] rounded-t-xl ${colorCls} shadow-[0_0_20px_rgba(255,255,255,0.1)]`}
                      initial={{ height: "0%" }}
                      animate={{ height: `${Math.max(2, heightPercent)}%` }} 
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    />
                  </div>
                  <div className="mt-2 md:mt-6 text-[14px] md:text-[18px] font-bold text-white/60 tracking-wider w-full text-center py-2 border-t border-white/10 shrink-0">
                    组 {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side (Buttons List) */}
        <div className="flex-[2] lg:flex-[1] w-full lg:w-[400px] xl:w-[500px] bg-[#0f172a]/50 border-t lg:border-t-0 lg:border-l border-white/10 p-4 md:p-8 flex flex-col overflow-y-auto">
          <h3 className="text-lg md:text-xl font-bold text-white/70 mb-4 whitespace-nowrap text-center">按下按钮积分</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 md:gap-4 w-full flex-1">
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
                  disabled={connState !== 'connected'}
                  onClick={() => incrementGroup(index)}
                  className={`w-full min-h-[70px] sm:min-h-[90px] rounded-2xl border-2 font-black text-xl md:text-2xl uppercase tracking-widest transition-all active:scale-95 ${btnCls} hover:text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {connState !== 'connected' ? '连接中...' : `组 ${index + 1}`}
                </button>
              );
            })}
          </div>
          
          {showConfirm ? (
            <div className="mt-8 bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex flex-col items-center gap-3 w-full mx-auto max-w-[300px] shrink-0">
              <span className="text-red-400 font-bold flex items-center gap-2 text-sm md:text-base text-center">
                <AlertTriangle className="w-5 h-5 shrink-0"/>
                瞬间清零所有人屏幕？
              </span>
              <div className="flex gap-4 w-full mt-2">
                <button onClick={doClear} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg text-sm">确认清零</button>
                <button onClick={() => setShowConfirm(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-lg text-sm">取消</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirm(true)}
              disabled={connState !== 'connected'}
              className="mt-8 mb-4 text-white/30 hover:text-red-400 underline underline-offset-4 font-medium transition-colors mx-auto block shrink-0 disabled:opacity-30"
            >
              清空数据 (重置所有分数)
            </button>
          )}

        </div>
      </main>
    </div>
  );
}
