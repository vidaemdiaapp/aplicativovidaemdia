import React from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SplashScreen } from './screens/SplashScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeScreen } from './screens/HomeScreen';
import { CategoryScreen } from './screens/CategoryScreen';
import { DetailScreen } from './screens/DetailScreen';
import { UploadScreen } from './screens/UploadScreen';
import { AssistantScreen } from './screens/AssistantScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { InviteAcceptScreen } from './screens/InviteAcceptScreen';
import { CreateTaskScreen } from './screens/CreateTaskScreen';
import { FinancialDashboardScreen } from './screens/FinancialDashboardScreen';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NotificationCenterScreen } from './screens/NotificationCenterScreen';
import { notificationsService } from './services/notifications';

const Layout = ({ children }: { children?: React.ReactNode }) => (
  <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
    {/* Sidebar for Desktop */}
    <Sidebar />

    <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
      {/* Content wrapper with fluid grid behavior */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-0">
        <div className="w-full max-w-5xl mx-auto lg:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav for Mobile/Tablet */}
      <BottomNav />
    </div>
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const NotificationManager: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      notificationsService.registerDevice();

      const cleanup = notificationsService.listenForNotifications((data) => {
        if (data?.screen === 'NotificationCenter') {
          navigate('/notifications');
        } else if (data?.taskId) {
          navigate(`/detail/${data.taskId}`);
        }
      });

      return cleanup;
    }
  }, [user, navigate]);

  return null;
};

const AppRoutes: React.FC = () => {
  return (
    <Layout>
      <NotificationManager />
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/home" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationCenterScreen /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><CategoryScreen /></ProtectedRoute>} />
        <Route path="/detail/:id" element={<ProtectedRoute><DetailScreen /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><UploadScreen /></ProtectedRoute>} />
        <Route path="/assistant" element={<ProtectedRoute><AssistantScreen /></ProtectedRoute>} />
        <Route path="/financial-dashboard" element={<ProtectedRoute><FinancialDashboardScreen /></ProtectedRoute>} />
        <Route path="/finance" element={<Navigate to="/financial-dashboard" replace />} />
        <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
        <Route path="/invite/:token" element={<InviteAcceptScreen />} />
        <Route path="/new-task" element={<ProtectedRoute><CreateTaskScreen /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;