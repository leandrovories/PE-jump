import React, { useState } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ArrowLeft, Star, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { ViewState } from '../App';

interface SimpleProjectViewProps {
  projectId: 'p1' | 'p2' | 'p3';
  projectName: string;
  onBack: () => void;
}

export default function SimpleProjectView({ projectId, projectName, onBack }: SimpleProjectViewProps) {
  const [studentId, setStudentId] = useState('1号');
  const [criteria, setCriteria] = useState([false, false, false]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const students: string[] = [];
  for (let s = 1; s <= 40; s++) {
    students.push(`${s}号`);
  }

  const toggleCriterion = (index: number) => {
    const newCriteria = [...criteria];
    newCriteria[index] = !newCriteria[index];
    setCriteria(newCriteria);
    setIsSubmitted(false);
  };

  const handleSave = () => {
    setIsSubmitted(true);
    const stars = criteria.filter(c => c).length;
    
    // Fire and forget, no await
    addDoc(collection(db, 'projectRecords'), {
      studentId,
      projectId,
      stars,
      teacherId: auth.currentUser?.uid || 'anonymous',
      createdAt: new Date().toISOString()
    }).catch(err => {
      console.error("Failed to save record:", err);
    });
  };

  const handleNext = () => {
    setIsSubmitted(false);
    setCriteria([false, false, false]);

    const currentIndex = students.indexOf(studentId);
    if (currentIndex !== -1 && currentIndex < students.length - 1) {
      setStudentId(students[currentIndex + 1]);
    } else {
      setStudentId(students[0]);
    }
  };

  return (
    <div className="h-screen bg-[#f8fafc] flex flex-col font-sans text-[#1e293b] overflow-hidden">
      <header className="h-[70px] shrink-0 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-[#f8fafc] rounded-full text-[#64748b]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-bold text-[#1e293b]">{projectName} 考核</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 h-[calc(100vh-70px)]">
        <div className="bg-white rounded-[20px] shadow-xl border border-[#e2e8f0] p-8 w-full max-w-4xl grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10 max-h-full overflow-y-auto">
          
          {/* Left Column */}
          <div className="flex flex-col h-full justify-center">
            <div className="mb-2">
              <label className="block text-[#64748b] font-medium mb-3 text-sm">选择快速考核学生</label>
              <select 
                value={studentId} 
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setIsSubmitted(false);
                  setCriteria([false, false, false]);
                }}
                className="w-full px-5 py-4 text-xl rounded-xl border-2 border-[#e2e8f0] bg-[#f8fafc] outline-none focus:border-[#2563eb] transition-colors font-bold text-[#1e293b]"
              >
                {students.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            <div className="hidden md:flex flex-1 mt-6 bg-slate-50 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200">
               <span className="text-[80px] font-black text-slate-300 drop-shadow-sm">{studentId}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col justify-between">
            <div className="space-y-4 mb-8">
              <h3 className="font-bold text-[#1e293b] text-lg mb-4">考核标准</h3>
              {[
                "标准 1：动作准确度",
                "标准 2：动作连贯性",
                "标准 3：整体完成质量"
              ].map((label, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex items-center justify-between p-5 rounded-xl border-2 cursor-pointer transition-all hover:-translate-y-0.5",
                    criteria[i] ? "border-[#eab308] bg-[#fefce8] shadow-sm" : "border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-slate-50"
                  )}
                  onClick={() => toggleCriterion(i)}
                >
                  <div className="flex items-center gap-3">
                    <Star className={cn("w-7 h-7", criteria[i] ? "fill-[#eab308] text-[#eab308]" : "text-[#cbd5e1]")} />
                    <span className={cn("font-medium text-[16px]", criteria[i] ? "text-[#b45309]" : "text-[#64748b]")}>{label}</span>
                  </div>
                  <div className={cn(
                    "w-7 h-7 rounded-md flex justify-center items-center transition-colors",
                    criteria[i] ? "bg-[#eab308]" : "bg-[#e2e8f0]"
                  )}>
                    {criteria[i] && <span className="text-white text-sm font-bold">✓</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-[#e2e8f0]">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-[#64748b]">总获星数:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(star => (
                     <Star 
                       key={star} 
                       className={cn("w-8 h-8", star <= criteria.filter(Boolean).length ? "fill-[#eab308] text-[#eab308]" : "fill-[#e2e8f0] text-[#e2e8f0]")} 
                     />
                  ))}
                </div>
              </div>

              {isSubmitted ? (
                <button 
                  onClick={handleNext}
                  className="w-full py-4 text-[18px] font-bold text-[#10b981] bg-[#f0fdf4] border-2 border-[#10b981] hover:bg-[#d1fae5] rounded-xl flex justify-center items-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-6 h-6" /> 已提交，请下一位
                </button>
              ) : (
                <button 
                  onClick={handleSave}
                  className="w-full py-4 text-[18px] font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl flex justify-center items-center gap-2 transition-transform hover:scale-[1.02]"
                >
                  <Save className="w-6 h-6" /> 提交考核成绩
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
