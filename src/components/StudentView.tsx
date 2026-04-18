import React, { useEffect, useRef, useState } from 'react';
import { usePoseLandmarker } from '../hooks/usePoseLandmarker';
import { processFrame, initialJumpState, evaluateJump, JumpState } from '../lib/scoring';
import { db, auth } from '../lib/cloudbase';
import { CheckCircle2, XCircle, Play, Square, User, Activity, Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface StudentViewProps {
  onBack: () => void;
}

export default function StudentView({ onBack }: StudentViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { poseLandmarker, isLoaded } = usePoseLandmarker();
  
  const [studentId, setStudentId] = useState('1号');
  const [mode, setMode] = useState<'double' | 'single'>('double');
  const [isRecording, setIsRecording] = useState(false);
  const [jumpState, setJumpState] = useState<JumpState>(initialJumpState);
  const [result, setResult] = useState<{stars: number, suggestions: string[]} | null>(null);
  const [status, setStatus] = useState({ point1: false, point2: false, point3: false });
  
  // Start camera
  useEffect(() => {
    let stream: MediaStream;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Process frames
  useEffect(() => {
    if (!isLoaded || !poseLandmarker || !videoRef.current || !canvasRef.current) return;

    let animationFrameId: number;
    let lastVideoTime = -1;

    const renderLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== 4) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const result = poseLandmarker.detectForVideo(video, performance.now());
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (result.landmarks && result.landmarks.length > 0) {
            // Draw landmarks
            ctx.fillStyle = '#00FF00';
            for (const landmark of result.landmarks[0]) {
              ctx.beginPath();
              ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 4, 0, 2 * Math.PI);
              ctx.fill();
            }

            if (isRecording) {
              setJumpState(prev => {
                const next = processFrame(result.landmarks[0], prev, mode);
                const evalResult = evaluateJump(next, mode);
                setStatus(evalResult.status);
                return next;
              });
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isLoaded, poseLandmarker, isRecording, mode]);

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    
    setJumpState(initialJumpState);
    setResult(null);
    setStatus({ point1: false, point2: false, point3: false });
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    const finalEval = evaluateJump(jumpState, mode);
    setResult({ stars: finalEval.stars, suggestions: finalEval.suggestions });
    
    // Fire and forget to avoid blocking UI
    db.collection('projectRecords').add({
      studentId,
      projectId: 'jump',
      stars: finalEval.stars,
      suggestions: finalEval.suggestions.join(' '),
      teacherId: auth.hasLoginState()?.user?.uid || 'anonymous',
      createdAt: new Date().toISOString()
    }).catch((err) => {
      console.error("Failed to save record:", err);
      alert("数据保存失败: " + err.message + "\n请检查集合是否创建，或权限是否打开！");
    });
  };

  const students: string[] = [];
  for (let s = 1; s <= 40; s++) {
    students.push(`${s}号`);
  }

  return (
    <div className="h-screen bg-[#f8fafc] flex flex-col font-sans text-[#1e293b] overflow-hidden">
      {/* Header */}
      <header className="h-[70px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-6 lg:px-10 shadow-[0_2px_4px_rgba(0,0,0,0.02)] shrink-0">
        <div className="text-[24px] font-[800] text-[#2563eb] flex items-center gap-2.5">
          <Activity className="w-8 h-8" />
          跳跃小裁判
        </div>
        <div className="flex items-center gap-[15px]">
          <span className="font-semibold text-[#64748b] hidden sm:inline">当前学生:</span>
          <select 
            value={studentId} 
            onChange={(e) => setStudentId(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white text-[16px] outline-none min-w-[150px] sm:min-w-[200px] text-[#1e293b]"
            disabled={isRecording}
          >
            {students.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button 
            onClick={onBack}
            className="bg-transparent border border-[#e2e8f0] px-3 py-2 rounded-lg cursor-pointer text-[#1e293b] hover:bg-gray-50 font-medium text-sm sm:text-base flex items-center gap-2"
          >
            返回主页
          </button>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-6 p-6 lg:px-10 lg:py-6 w-full max-w-none overflow-hidden h-[calc(100vh-70px)]">
        {/* Left/Main Column: Camera */}
        <div className="flex flex-col h-full relative">
          <div className="bg-black rounded-[20px] relative overflow-hidden w-full h-full shadow-[0_10px_25px_rgba(0,0,0,0.1)] flex items-center justify-center min-h-[400px]">
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover" 
              autoPlay 
              playsInline 
              muted 
            />
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full object-cover"
              width={1280}
              height={720}
            />
            
            {!isLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                正在加载 AI 模型...
              </div>
            )}
            
            {isRecording && (
              <div className="absolute top-5 left-5 bg-[#ef4444] text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5 z-10">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span>实时检测中</span>
              </div>
            )}

            {/* Result Overlay */}
            {result && (
              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-50 rounded-[20px] text-center p-10">
                <h2 className="text-[32px] font-bold text-[#1e293b]">练习完成!</h2>
                <div className="flex justify-center gap-4 my-6">
                  {[1, 2, 3].map((star) => (
                    <Star 
                      key={star}
                      className={`w-16 h-16 ${star <= result.stars ? 'fill-[#eab308] text-[#eab308]' : 'fill-[#e2e8f0] text-[#e2e8f0]'}`}
                    />
                  ))}
                </div>
                <p className="text-[#64748b] font-medium tracking-wide text-lg">获得 {result.stars} 颗星</p>
                <button 
                  className="mt-[30px] bg-[#2563eb] text-white px-10 py-3.5 rounded-xl text-lg font-bold transition-transform hover:scale-105"
                  onClick={() => setResult(null)}
                >
                  准备下一次记录
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status & Results */}
        <div className="flex flex-col gap-5 overflow-y-auto">
          {/* Real-time Status */}
          <div className="bg-white rounded-[16px] p-5 border border-[#e2e8f0] shadow-[0_4px_6px_rgba(0,0,0,0.02)]">
            <h3 className="text-[16px] font-bold text-[#1e293b] mb-[15px]">关键动作监测</h3>
            <div className="flex flex-col gap-3">
              <StatusItem 
                label={mode === 'double' ? "屈膝幅度 (90°-140°)" : "悬空脚保持悬空"} 
                active={status.point1} 
              />
              <StatusItem 
                label={mode === 'double' ? "双手平衡打开" : "落地屈膝缓冲"} 
                active={status.point2} 
              />
              <StatusItem 
                label={mode === 'double' ? "双脚同时起落" : "单脚稳定落地"} 
                active={status.point3} 
              />
            </div>
          </div>

          <div className="bg-white rounded-[16px] p-5 border border-[#e2e8f0] shadow-[0_4px_6px_rgba(0,0,0,0.02)] flex-1">
            <h3 className="text-[16px] font-bold text-[#1e293b] mb-[10px]">模式说明</h3>
            <p className="text-[13px] text-[#64748b] leading-[1.6]">
                <strong>双脚跳跃：</strong>着重检测膝盖角度与落地的同步性。<br/><br/>
                <strong>单脚跳跃：</strong>着重检测非支撑脚的抬起高度与落地缓冲。
            </p>
          </div>
        </div>
      </main>

      {/* Footer Controls */}
      <div className="h-auto py-4 lg:h-[100px] lg:py-0 bg-white border-t border-[#e2e8f0] px-6 lg:px-10 flex flex-col lg:flex-row items-center justify-between shrink-0 gap-4">
        <div className="flex bg-[#f8fafc] p-1 rounded-xl w-full lg:w-auto">
          <button
            onClick={() => setMode('double')}
            disabled={isRecording}
            className={cn(
              "flex-1 lg:flex-none px-6 py-2.5 rounded-[10px] font-semibold transition-all border-none cursor-pointer",
              mode === 'double' 
                ? "bg-white text-[#2563eb] shadow-[0_2px_8px_rgba(0,0,0,0.1)]" 
                : "text-[#64748b] hover:text-[#1e293b] bg-transparent"
            )}
          >
            双脚跳跃模式
          </button>
          <button
            onClick={() => setMode('single')}
            disabled={isRecording}
            className={cn(
              "flex-1 lg:flex-none px-6 py-2.5 rounded-[10px] font-semibold transition-all border-none cursor-pointer",
              mode === 'single' 
                ? "bg-white text-[#2563eb] shadow-[0_2px_8px_rgba(0,0,0,0.1)]" 
                : "text-[#64748b] hover:text-[#1e293b] bg-transparent"
            )}
          >
            单脚跳跃模式
          </button>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!isLoaded}
              className="w-full lg:w-auto px-10 py-3.5 rounded-xl text-[18px] font-bold border-none cursor-pointer transition-transform hover:scale-105 bg-[#2563eb] text-white disabled:opacity-50 disabled:hover:scale-100"
            >
              开始跳跃
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-full lg:w-auto px-10 py-3.5 rounded-xl text-[18px] font-bold border-none cursor-pointer transition-transform hover:scale-105 bg-[#f1f5f9] text-[#1e293b]"
            >
              结束跳跃
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-[#f8fafc] rounded-[10px]">
      <span className="font-medium text-[#1e293b] text-sm">{label}</span>
      {active ? (
        <span className="text-[#10b981] font-bold">✓</span>
      ) : (
        <span className="text-[#ef4444] font-bold">✕</span>
      )}
    </div>
  );
}
