import React from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
import { FiscalFolderScreen } from './screens/FiscalFolderScreen';
import { TaxDeclarationScreen } from './screens/TaxDeclarationScreen';
import { AssetsScreen } from './screens/AssetsScreen';
import { FinancialDashboardScreen } from './screens/FinancialDashboardScreen';
import { CreditCardsScreen } from './screens/CreditCardsScreen';
import { SavingsGoalsScreen } from './screens/SavingsGoalsScreen';
import { InvestmentsScreen } from './screens/InvestmentsScreen';
import { CreditSimulatorScreen } from './screens/CreditSimulatorScreen';
import { VehicleCentralScreen } from './screens/VehicleCentralScreen';
import { VehicleDebtSimulationScreen } from './screens/VehicleDebtSimulationScreen';
import { VehicleReceiptScreen } from './screens/VehicleReceiptScreen';
import { VehicleEditScreen } from './screens/VehicleEditScreen';
import { AgendaScreen } from './screens/AgendaScreen';
import { AgendaEditScreen } from './screens/AgendaEditScreen';
import { IncomesScreen } from './screens/IncomesScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { BottomNav } from './components/BottomNav';
import { Sidebar } from './components/Sidebar';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NotificationCenterScreen } from './screens/NotificationCenterScreen';
import { notificationsService } from './services/notifications';
import { Layout } from './components/Layout';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-surface-highlight border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No user found, redirecting to login');
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
        <Route path="/edit-task/:id" element={<ProtectedRoute><CreateTaskScreen /></ProtectedRoute>} />
        <Route path="/fiscal-folder" element={<ProtectedRoute><FiscalFolderScreen /></ProtectedRoute>} />
        <Route path="/tax-declaration" element={<ProtectedRoute><TaxDeclarationScreen /></ProtectedRoute>} />
        <Route path="/assets" element={<ProtectedRoute><AssetsScreen /></ProtectedRoute>} />
        <Route path="/credit-cards" element={<ProtectedRoute><CreditCardsScreen /></ProtectedRoute>} />
        <Route path="/savings" element={<ProtectedRoute><SavingsGoalsScreen /></ProtectedRoute>} />
        <Route path="/financial" element={<Navigate to="/financial-dashboard" replace />} />
        <Route path="/investments" element={<ProtectedRoute><InvestmentsScreen /></ProtectedRoute>} />
        <Route path="/credit-simulator" element={<ProtectedRoute><CreditSimulatorScreen /></ProtectedRoute>} />
        <Route path="/vehicle-central" element={<ProtectedRoute><VehicleCentralScreen /></ProtectedRoute>} />
        <Route path="/vehicle-simulation" element={<ProtectedRoute><VehicleDebtSimulationScreen /></ProtectedRoute>} />
        <Route path="/vehicle-receipt" element={<ProtectedRoute><VehicleReceiptScreen /></ProtectedRoute>} />
        <Route path="/vehicle-edit" element={<ProtectedRoute><VehicleEditScreen /></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><AgendaScreen /></ProtectedRoute>} />
        <Route path="/agenda/:id" element={<ProtectedRoute><AgendaEditScreen /></ProtectedRoute>} />
        <Route path="/tax" element={<Navigate to="/tax-declaration" replace />} />
        <Route path="/incomes" element={<ProtectedRoute><IncomesScreen /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><ExpensesScreen /></ProtectedRoute>} />
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
        <Toaster position="top-center" />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;