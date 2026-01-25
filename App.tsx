import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CategoryScreen } from './screens/CategoryScreen';
import { DetailScreen } from './screens/DetailScreen';
import { UploadScreen } from './screens/UploadScreen';
import { AssistantScreen } from './screens/AssistantScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { BottomNav } from './components/BottomNav';

const Layout = ({ children }: { children?: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-100 flex justify-center">
    {/* Mobile simulator container */}
    <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {children}
      </div>
      <BottomNav />
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/categories" element={<CategoryScreen />} />
          <Route path="/detail/:id" element={<DetailScreen />} />
          <Route path="/upload" element={<UploadScreen />} />
          <Route path="/assistant" element={<AssistantScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;