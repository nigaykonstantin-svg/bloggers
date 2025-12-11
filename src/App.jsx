import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { TelegramProvider } from './context/TelegramContext';
import { CollaborationsProvider } from './data/collaborations';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

// Blogger pages
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import NewCollaboration from './pages/NewCollaboration';
import Collaborations from './pages/Collaborations';
import CollaborationDetail from './pages/CollaborationDetail';
import Leaderboard from './pages/Leaderboard';
import Achievements from './pages/Achievements';
import Profile from './pages/Profile';

// Admin pages
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Moderation from './pages/admin/Moderation';
import BloggersList from './pages/admin/BloggersList';
import AdminCollaborations from './pages/admin/AdminCollaborations';
import AdminProducts from './pages/admin/AdminProducts';
import Analytics from './pages/admin/Analytics';

// Telegram Mini App
import TelegramApp from './pages/telegram/TelegramApp';

function App() {
  return (
    <BrowserRouter>
      <TelegramProvider>
        <AuthProvider>
          <CartProvider>
            <CollaborationsProvider>
              <Routes>
                {/* Telegram Mini App Route */}
                <Route path="/tg/*" element={<TelegramApp />} />

                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Blogger Dashboard Routes */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:category" element={<Products />} />
                  <Route path="/collaborations" element={<Collaborations />} />
                  <Route path="/collaborations/new" element={<NewCollaboration />} />
                  <Route path="/collaboration/:id" element={<CollaborationDetail />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/moderation" element={<Moderation />} />
                  <Route path="/admin/bloggers" element={<BloggersList />} />
                  <Route path="/admin/collaborations" element={<AdminCollaborations />} />
                  <Route path="/admin/products" element={<AdminProducts />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CollaborationsProvider>
          </CartProvider>
        </AuthProvider>
      </TelegramProvider>
    </BrowserRouter>
  );
}

export default App;
