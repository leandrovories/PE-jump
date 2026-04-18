import React, { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import HomeView from './components/HomeView';
import StudentView from './components/StudentView';
import TeacherDashboard from './components/TeacherDashboard';
import SimpleProjectView from './components/SimpleProjectView';
import Project4View from './components/Project4View';

export type ViewState = 'home' | 'jump' | 'p1' | 'p2' | 'p3' | 'p4' | 'teacher';

export default function App() {
  const [view, setView] = useState<ViewState>('home');

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
