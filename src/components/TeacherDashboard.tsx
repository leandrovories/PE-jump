import React, { useEffect, useState, useMemo } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { LogOut, Trash2, ArrowLeft, Search, Star, Medal, RefreshCw } from 'lucide-react';

interface TeacherDashboardProps {
  onBack: () => void;
}

interface ProjectRecordType {
  id: string;
  studentId: string;
  projectId: string;
  stars: number;
  createdAt: string;
}

interface StudentRank {
  studentId: string;
  totalStars: number;
  jump: number | '-';
  p1: number | '-';
  p2: number | '-';
  p3: number | '-';
}

export default function TeacherDashboard({ onBack }: TeacherDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [errorStr, setErrorStr] = useState('');
  const [records, setRecords] = useState<ProjectRecordType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecords = () => {
    setLoading(true);
    
    // Using a pure query without time filters to ensure ALL devices see the exact same data
    // Local clock discrepancies between iPads/phones will no longer hide records.
    const q = query(
      collection(db, 'projectRecords'),
      orderBy('createdAt', 'desc')
    );

    getDocs(q).then(snapshot => {
      let newRecords = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ProjectRecordType[];
      
      // Client-side filtering for 3 hours to prevent Firebase index/clock dropouts
      const threeHoursAgoMs = Date.now() - 3 * 60 * 60 * 1000;
      newRecords = newRecords.filter(r => new Date(r.createdAt).getTime() >= threeHoursAgoMs);

      setRecords(newRecords);
      setLoading(false);
    }).catch(error => {
      handleFirestoreError(error, OperationType.LIST, 'projectRecords');
      setLoading(false);
    });
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Subscribing to ALL real-time updates to ensure absolute data synchronization across devices
    const q = query(
      collection(db, 'projectRecords'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let newRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProjectRecordType[];
      
      // Filter out records older than 3 hours dynamically on the client
      const threeHoursAgoMs = Date.now() - 3 * 60 * 60 * 1000;
      newRecords = newRecords.filter(r => new Date(r.createdAt).getTime() >= threeHoursAgoMs);
      
      setRecords(newRecords);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projectRecords');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '13579') {
      setIsAuthenticated(true);
      setErrorStr('');
    } else {
      setErrorStr('密码错误，请重试');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm(`确定要清空 ${studentId} 的所有考核记录吗？`)) {
      try {
        const studentRecords = records.filter(r => r.studentId === studentId);
        await Promise.all(studentRecords.map(r => deleteDoc(doc(db, 'projectRecords', r.id))));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `projectRecords`);
      }
    }
  };

  const rankedStudents = useMemo(() => {
    const map: Record<string, StudentRank> = {};
    
    records.forEach(r => {
      if (!map[r.studentId]) {
        map[r.studentId] = { studentId: r.studentId, totalStars: 0, jump: '-', p1: '-', p2: '-', p3: '-' };
      }
      
      const current = map[r.studentId][r.projectId as keyof StudentRank] as number | '-';
      const maxStar = Math.max(current === '-' ? 0 : current, r.stars);
      (map[r.studentId] as any)[r.projectId] = maxStar;
    });

    return (Object.values(map) as StudentRank[]).map(row => {
      const getVal = (val: number | '-') => val === '-' ? 0 : val;
      row.totalStars = getVal(row.jump) + getVal(row.p1) + getVal(row.p2) + getVal(row.p3);
      return row;
    }).sort((a, b) => b.totalStars - a.totalStars);
  }, [records]);

  const filteredRanks = rankedStudents.filter(r => r.studentId.includes(searchTerm));

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-[#f8fafc] flex items-center justify-center p-4 font-sans overflow-hidden">
        <div className="bg-white p-8 rounded-[20px] shadow-[0_10px_25px_rgba(0,0,0,0.1)] max-w-md w-full border border-[#e2e8f0]">
          <h2 className="text-[24px] font-[800] text-[#1e293b] mb-2 text-center">教师管理端</h2>
          <p className="text-[#64748b] mb-8 text-center text-[15px]">请输入访问密码查看所有学生练习记录</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none text-[16px] text-[#1e293b]"
              autoFocus
            />
            {errorStr && <p className="text-[#ef4444] text-[14px] text-center font-medium mt-1">{errorStr}</p>}
            <button
              type="submit"
              className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors text-[16px] shadow-[0_4px_6px_rgba(37,99,235,0.2)] hover:scale-[1.02] transform"
            >
              进入后台
            </button>
          </form>
          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-[#64748b] hover:text-[#1e293b] text-[14px] font-medium"
            >
              返回主页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f8fafc] font-sans flex flex-col overflow-hidden">
      <header className="h-[70px] shrink-0 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] border-b border-[#e2e8f0] px-6 lg:px-10 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-[#f8fafc] rounded-full transition-colors text-[#64748b] hover:text-[#1e293b]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-bold text-[#1e293b]">四项考核成绩汇总表</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={fetchRecords} className="text-[#64748b] hover:text-[#2563eb] transition-colors p-2 rounded-full hover:bg-blue-50" title="手动刷新数据">
            <RefreshCw className="w-5 h-5" />
          </button>
          <span className="text-[14px] font-medium text-[#10b981] bg-[#f0fdf4] px-3 py-1 rounded-full border border-[#bbf7d0]">已通过密码身份验证</span>
          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-[#ef4444] hover:bg-[#fef2f2] px-3 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">退出后台</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full overflow-hidden flex flex-col">
        <div className="bg-white rounded-[16px] shadow-[0_4px_6px_rgba(0,0,0,0.02)] border border-[#e2e8f0] flex flex-col h-full overflow-hidden">
          <div className="p-5 shrink-0 border-b border-[#e2e8f0] flex flex-col sm:flex-row justify-between items-center bg-[#f8fafc] gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-5 h-5 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索学生 (如: 1号)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e2e8f0] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none text-[14px] text-[#1e293b] bg-white"
              />
            </div>
            <div className="text-[14px] font-medium text-[#64748b]">
              共<span className="text-[#2563eb] font-bold mx-1">{filteredRanks.length}</span>位学生数据
            </div>
          </div>

          <div className="overflow-auto flex-1 relative">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-[#f8fafc] shadow-sm">
                <tr className="bg-[#f8fafc] text-[#64748b] text-[13px] uppercase tracking-wider border-b border-[#e2e8f0]">
                  <th className="p-4 font-semibold w-24 text-center">排名</th>
                  <th className="p-4 font-semibold">学生信息</th>
                  <th className="p-4 font-semibold text-center text-[#2563eb]">总获星数 (满12星)</th>
                  <th className="p-4 font-semibold text-center">跳跃小裁判</th>
                  <th className="p-4 font-semibold text-center">项目1</th>
                  <th className="p-4 font-semibold text-center">项目2</th>
                  <th className="p-4 font-semibold text-center">项目3</th>
                  <th className="p-4 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-[#64748b] font-medium">数据加载中...</td>
                  </tr>
                ) : filteredRanks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-[#64748b] font-medium">暂无符合条件的成绩记录</td>
                  </tr>
                ) : (
                  filteredRanks.map((student, index) => (
                    <tr key={student.studentId} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="p-4 font-bold text-center">
                        {index === 0 ? <Medal className="w-6 h-6 mx-auto text-[#f59e0b] fill-[#fde68a]" /> :
                         index === 1 ? <Medal className="w-6 h-6 mx-auto text-[#94a3b8] fill-[#e2e8f0]" /> :
                         index === 2 ? <Medal className="w-6 h-6 mx-auto text-[#b45309] fill-[#fef3c7]" /> :
                         <span className="text-[#94a3b8]">{index + 1}</span>}
                      </td>
                      <td className="p-4 font-bold text-[#1e293b] text-[15px]">{student.studentId}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe] font-bold text-[14px]">
                          <Star className="w-4 h-4 fill-[#2563eb]" />
                          {student.totalStars}
                        </span>
                      </td>
                      <td className="p-4 text-center font-medium text-[#64748b]">{student.jump}{student.jump !== '-' && ' 星'}</td>
                      <td className="p-4 text-center font-medium text-[#64748b]">{student.p1}{student.p1 !== '-' && ' 星'}</td>
                      <td className="p-4 text-center font-medium text-[#64748b]">{student.p2}{student.p2 !== '-' && ' 星'}</td>
                      <td className="p-4 text-center font-medium text-[#64748b]">{student.p3}{student.p3 !== '-' && ' 星'}</td>
                      
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleDeleteStudent(student.studentId)}
                          className="p-2 text-[#ef4444] hover:bg-[#fef2f2] rounded-lg transition-colors inline-flex"
                          title="清空该学生数据"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
