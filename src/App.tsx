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

  useEffect(() => {
    signInAnonymous().then(() => {
      setAuthReady(true);
    }).catch(err => {
      console.error(err);
      setAuthError(err.message || '未知登录错误');
    });
  }, []);

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-600 p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">连接腾讯云失败</h1>
        <p className="mb-2">请确认您已经在腾讯云 CloudBase 控制台中开启了<strong>“匿名登录”</strong>！</p>
        <p className="text-sm opacity-80 bg-white p-4 rounded shadow">详细错误: {authError}</p>
      </div>
    );
  }

  if (!authReady) {
    return <div className="flex items-center justify-center h-screen">正在连接腾讯云...</div>;
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
