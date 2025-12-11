import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTelegram } from '../../context/TelegramContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { products, categories } from '../../data/products';
import { levels } from '../../data/levels';
import { collaborations } from '../../data/collaborations';
import LevelBadge from '../../components/ui/LevelBadge';
import ProductCard from '../../components/products/ProductCard';
import {
    Home,
    ShoppingBag,
    Trophy,
    User,
    Package,
    ChevronRight,
    Star
} from 'lucide-react';

// Telegram Mini App - Main Entry Point
export default function TelegramApp() {
    const { isTelegram, user: tgUser, isReady, setBackButton, hapticFeedback } = useTelegram();
    const { user, telegramLogin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (isReady && isTelegram && tgUser && !user) {
            // Auto-login with Telegram data
            telegramLogin(tgUser);
        }
    }, [isReady, isTelegram, tgUser, user]);

    useEffect(() => {
        // Show back button on sub-pages
        const isSubPage = location.pathname !== '/tg' && location.pathname !== '/tg/';
        setBackButton(() => navigate(-1), isSubPage);
    }, [location.pathname]);

    if (!isReady) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-mixit-pink border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Routes>
                <Route path="/" element={<TgHome />} />
                <Route path="/products" element={<TgProducts />} />
                <Route path="/leaderboard" element={<TgLeaderboard />} />
                <Route path="/profile" element={<TgProfile />} />
                <Route path="/cart" element={<TgCart />} />
                <Route path="*" element={<Navigate to="/tg" replace />} />
            </Routes>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}

// Bottom Navigation Component
function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { cart } = useCart();
    const { hapticFeedback } = useTelegram();

    const tabs = [
        { path: '/tg', icon: Home, label: 'Главная' },
        { path: '/tg/products', icon: ShoppingBag, label: 'Продукты' },
        { path: '/tg/leaderboard', icon: Trophy, label: 'Рейтинг' },
        { path: '/tg/profile', icon: User, label: 'Профиль' },
    ];

    const handleNav = (path) => {
        hapticFeedback('selection');
        navigate(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-bottom z-50">
            <div className="flex justify-around py-2">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = location.pathname === tab.path;
                    const isProducts = tab.path === '/tg/products';

                    return (
                        <button
                            key={tab.path}
                            onClick={() => handleNav(tab.path)}
                            className={`flex flex-col items-center py-2 px-4 relative ${isActive ? 'text-mixit-pink' : 'text-gray-400'
                                }`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs mt-1">{tab.label}</span>
                            {isProducts && cart.length > 0 && (
                                <span className="absolute top-1 right-2 w-5 h-5 bg-mixit-pink text-white text-xs rounded-full flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

// Home Page
function TgHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { hapticFeedback } = useTelegram();
    const currentLevel = levels[user?.level || 'beginner'];

    const activeCollabs = collaborations.filter(c =>
        c.bloggerId === user?.id && !['completed', 'cancelled'].includes(c.status)
    );

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-mixit rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {user?.firstName?.[0] || 'M'}
                </div>
                <div>
                    <h1 className="text-xl font-bold text-dark">
                        Привет, {user?.firstName || 'Блогер'}! 👋
                    </h1>
                    <LevelBadge level={user?.level || 'beginner'} size="sm" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-gold">{user?.points || 0}</p>
                    <p className="text-xs text-gray-500">Очков</p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-dark">{user?.successfulCollaborations || 0}</p>
                    <p className="text-xs text-gray-500">Коллабов</p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
                    <p className="text-2xl font-bold text-mixit-pink">{currentLevel?.maxProducts || 2}</p>
                    <p className="text-xs text-gray-500">Лимит</p>
                </div>
            </div>

            {/* Level Progress */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-dark">Прогресс уровня</span>
                    <span className="text-sm text-mixit-pink">75%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-mixit rounded-full w-3/4"></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">До следующего уровня: +2500 подписчиков</p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
                <h2 className="font-semibold text-dark">Быстрые действия</h2>

                <button
                    onClick={() => { hapticFeedback('impact'); navigate('/tg/products'); }}
                    className="w-full bg-gradient-mixit text-white rounded-2xl p-4 flex items-center justify-between shadow-lg"
                >
                    <div className="flex items-center gap-3">
                        <ShoppingBag className="w-6 h-6" />
                        <span className="font-medium">Выбрать продукты</span>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                </button>

                <button
                    onClick={() => { hapticFeedback('impact'); navigate('/tg/leaderboard'); }}
                    className="w-full bg-white text-dark rounded-2xl p-4 flex items-center justify-between shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-gold" />
                        <span className="font-medium">Рейтинг блогеров</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Active Collaborations */}
            {activeCollabs.length > 0 && (
                <div className="space-y-3">
                    <h2 className="font-semibold text-dark">Активные коллаборации</h2>
                    {activeCollabs.slice(0, 2).map(collab => (
                        <div key={collab.id} className="bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-dark">#{collab.id}</span>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {collab.status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{collab.products.length} продуктов</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Products Page
function TgProducts() {
    const [category, setCategory] = useState('all');
    const { user } = useAuth();
    const { hapticFeedback } = useTelegram();

    const filtered = category === 'all'
        ? products
        : products.filter(p => p.category === category);

    return (
        <div className="p-4 space-y-4 animate-fade-in">
            <h1 className="text-xl font-bold text-dark">Каталог продуктов</h1>

            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                <button
                    onClick={() => { hapticFeedback('selection'); setCategory('all'); }}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${category === 'all' ? 'bg-mixit-pink text-white' : 'bg-white text-gray-600'
                        }`}
                >
                    Все
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => { hapticFeedback('selection'); setCategory(cat.id); }}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${category === cat.id ? 'bg-mixit-pink text-white' : 'bg-white text-gray-600'
                            }`}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-3">
                {filtered.map(product => (
                    <ProductCard key={product.id} product={product} userLevel={user?.level} compact />
                ))}
            </div>
        </div>
    );
}

// Leaderboard Page
function TgLeaderboard() {
    const { user } = useAuth();
    const { bloggers } = require('../../data/bloggers');

    const sorted = [...bloggers].sort((a, b) => b.points - a.points);

    return (
        <div className="p-4 space-y-4 animate-fade-in">
            <h1 className="text-xl font-bold text-dark">🏆 Рейтинг</h1>

            <div className="space-y-2">
                {sorted.slice(0, 10).map((blogger, index) => (
                    <div
                        key={blogger.id}
                        className={`bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm ${blogger.id === user?.id ? 'ring-2 ring-mixit-pink' : ''
                            }`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-400 text-white' :
                                index === 1 ? 'bg-gray-300 text-gray-700' :
                                    index === 2 ? 'bg-amber-600 text-white' :
                                        'bg-gray-100 text-gray-600'
                            }`}>
                            {index + 1}
                        </div>
                        <img
                            src={blogger.avatar}
                            alt={blogger.firstName}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-dark truncate">
                                {blogger.firstName} {blogger.lastName}
                            </p>
                            <LevelBadge level={blogger.level} size="sm" />
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-dark">{blogger.points.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">очков</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Profile Page
function TgProfile() {
    const { user } = useAuth();
    const { isTelegram, close } = useTelegram();
    const currentLevel = levels[user?.level || 'beginner'];

    return (
        <div className="p-4 space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <div className="w-20 h-20 bg-gradient-mixit rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                    {user?.firstName?.[0] || 'M'}
                </div>
                <h1 className="text-xl font-bold text-dark">
                    {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-gray-500 mb-2">@{user?.username || 'username'}</p>
                <LevelBadge level={user?.level || 'beginner'} />
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="font-semibold text-dark mb-3">Статистика</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-gold">{user?.points || 0}</p>
                        <p className="text-xs text-gray-500">Очков</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                        <p className="text-2xl font-bold text-dark">{user?.successfulCollaborations || 0}</p>
                        <p className="text-xs text-gray-500">Коллабораций</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h2 className="font-semibold text-dark mb-3">Привилегии уровня</h2>
                <ul className="space-y-2 text-sm text-gray-600">
                    {currentLevel?.privileges?.map((p, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <Star className="w-4 h-4 text-mixit-pink flex-shrink-0 mt-0.5" />
                            {p}
                        </li>
                    ))}
                </ul>
            </div>

            {isTelegram && (
                <button
                    onClick={close}
                    className="w-full py-3 text-gray-500 text-sm"
                >
                    Закрыть приложение
                </button>
            )}
        </div>
    );
}

// Cart Page
function TgCart() {
    const { cart, removeFromCart, clearCart } = useCart();
    const { setMainButton, hideMainButton, hapticFeedback, showConfirm } = useTelegram();
    const navigate = useNavigate();

    useEffect(() => {
        if (cart.length > 0) {
            setMainButton('Оформить заявку', () => {
                hapticFeedback('notification');
                showConfirm('Отправить заявку на коллаборацию?', (confirmed) => {
                    if (confirmed) {
                        clearCart();
                        navigate('/tg');
                    }
                });
            });
        } else {
            hideMainButton();
        }

        return () => hideMainButton();
    }, [cart.length]);

    return (
        <div className="p-4 space-y-4 animate-fade-in">
            <h1 className="text-xl font-bold text-dark">Корзина</h1>

            {cart.length === 0 ? (
                <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Корзина пуста</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {cart.map(product => (
                        <div key={product.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-16 h-16 rounded-xl object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-dark truncate">{product.name}</p>
                                <p className="text-sm text-gray-500">{product.volume}</p>
                            </div>
                            <button
                                onClick={() => { hapticFeedback('impact'); removeFromCart(product.id); }}
                                className="text-error p-2"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
