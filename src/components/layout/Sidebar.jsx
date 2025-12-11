import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Handshake,
    Trophy,
    User,
    Award,
    LogOut,
    X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LevelBadge from '../ui/LevelBadge';

const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Главная' },
    { path: '/products', icon: Package, label: 'Продукты' },
    { path: '/collaborations', icon: Handshake, label: 'Коллаборации' },
    { path: '/leaderboard', icon: Trophy, label: 'Рейтинг' },
    { path: '/achievements', icon: Award, label: 'Достижения' },
    { path: '/profile', icon: User, label: 'Профиль' },
];

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:shadow-none lg:border-r lg:border-gray-100
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Close button for mobile */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Logo */}
                <div className="p-6 border-b border-gray-100">
                    <Link to="/dashboard" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-mixit rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <span className="font-bold text-xl text-dark">MIXIT</span>
                        <span className="text-mixit-pink font-medium">Creators</span>
                    </Link>
                </div>

                {/* User info */}
                {user && (
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}&background=FF6B9D&color=fff`}
                                alt={user.firstName}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-dark truncate">
                                    {user.firstName} {user.lastName}
                                </p>
                                <LevelBadge level={user.level} size="sm" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-gray-500">Очки:</span>
                            <span className="font-bold text-gold">{user.points?.toLocaleString() || 0}</span>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="p-4 flex-1">
                    <ul className="space-y-1">
                        {menuItems.map(item => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path ||
                                (item.path === '/products' && location.pathname.startsWith('/products'));

                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        onClick={onClose}
                                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-left text-error hover:bg-error/10"
                    >
                        <LogOut className="w-5 h-5" />
                        Выйти
                    </button>
                </div>
            </aside>
        </>
    );
}
