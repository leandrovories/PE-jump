import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import HomeView from './components/HomeView';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import SimpleProjectView from './components/SimpleProjectView';
import Project4View from './components/Project4View';
import { signInAnonymous } from './lib/cloudbase';

export type ViewState = 'home' | 'jump' | 'p1' | 'p2' | 'p3' | 'p4' | 'teacher';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymous();
        setAuthSuccess(true);
        // Show success briefly before continuing to UI
        setTimeout(() => {
          setAuthReady(true);
        }, 1000);
      } catch (err: any) {
        console.error(err);
        setAuthError(err.message || '未知登录错误');
      }
    };
    initAuth();
  }, []);

  if (authError) {
    return (
      <div className="flex items-center justify-center h-screen bg-red-50 text-red-600">
        <div className="text-center p-8 bg-white border border-red-200 shadow-xl rounded-2xl max-w-lg">
          <h1 className="text-2xl font-bold mb-4">登录失败</h1>
          <p className="mb-2">如果登录出错，请将具体错误信息显示出来。</p>
          <p className="text-sm opacity-80 mt-4 p-3 bg-red-50 rounded italic text-left break-all">详细错误: {authError}</p>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-700">
        {authSuccess ? (
          <>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-4 text-white text-2xl">✓</div>
            <h2 className="text-xl font-bold text-green-600">登录成功</h2>
            <p className="text-sm opacity-70 mt-2">身份验证通过，可以正常使用。</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-bold">登录中...</h2>
            <p className="text-sm opacity-70 mt-2">正在向腾讯云验证身份。</p>
          </>
        )}
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {view === 'home' && <HomeView onNavigate={setView} />}
      {view === 'jump' && <StudentView onBack={() => setView('home')} />}
      {view === 'p1' && <SimpleProjectView projectId="p1" projectName="项目1" onBack={() => setView('home')} />}
      {view === 'p2' && <SimpleProjectView projectId="p2" projectName="项目2" onBack={() => setView('home')} />}
      {view === 'p3' && <SimpleProjectView projectId="p3" projectName="项目3" onBack={() => setView('home')} />}
      {view === 'p4' && <Project4View onBack={() => setView('home')} />}
      {view === 'teacher' && <TeacherDashboard onBack={() => setView('home')} />}
    </ErrorBoundary>
  );
}
