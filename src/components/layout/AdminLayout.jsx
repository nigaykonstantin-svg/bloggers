import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    ShieldCheck,
    Handshake,
    Package,
    BarChart3,
    LogOut,
    X,
    Menu
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const adminMenuItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Дашборд' },
    { path: '/admin/moderation', icon: ShieldCheck, label: 'Модерация' },
    { path: '/admin/bloggers', icon: Users, label: 'Блогеры' },
    { path: '/admin/collaborations', icon: Handshake, label: 'Коллаборации' },
    { path: '/admin/products', icon: Package, label: 'Продукты' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Аналитика' },
];

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-mixit-pink border-t-transparent"></div>
            </div>
        );
    }

    if (!isAdmin) {
        navigate('/login');
        return null;
    }

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`
        fixed top-0 left-0 h-full w-64 bg-dark z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 lg:hidden p-2 text-gray-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    <Link to="/admin" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-mixit rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <div>
                            <span className="font-bold text-white">MIXIT</span>
                            <span className="text-mixit-pink text-xs block">Admin Panel</span>
                        </div>
                    </Link>
                </div>

                <nav className="px-4 pb-20">
                    <ul className="space-y-1">
                        {adminMenuItems.map(item => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? 'bg-mixit-pink text-white'
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white w-full transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Выйти
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="sticky top-0 z-30 bg-white shadow-sm">
                    <div className="flex items-center justify-between px-4 lg:px-8 py-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="hidden lg:block">
                            <h1 className="text-lg font-semibold text-dark">Admin Panel</h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">admin@mixit.ru</span>
                            <div className="w-8 h-8 bg-dark text-white rounded-full flex items-center justify-center font-medium">
                                A
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
