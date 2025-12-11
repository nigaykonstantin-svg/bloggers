import { Link } from 'react-router-dom';
import { ArrowRight, Package, Clock, Trophy, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCollaborationsByBloggerId, statusLabels, statusColors } from '../data/collaborations';
import { getProductById } from '../data/products';
import { levels, getNextLevel, getLevelProgress } from '../data/levels';
import LevelBadge from '../components/ui/LevelBadge';
import ProgressBar from '../components/ui/ProgressBar';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import CountdownTimer from '../components/ui/CountdownTimer';

export default function Dashboard() {
    const { user } = useAuth();
    const collaborations = getCollaborationsByBloggerId(user?.id) || [];
    const activeCollabs = collaborations.filter(c => c.status !== 'completed');
    const completedCollabs = collaborations.filter(c => c.status === 'completed');

    const currentLevel = levels[user?.level];
    const nextLevel = getNextLevel(user?.level);
    const progress = getLevelProgress(user?.level, user?.points || 0);

    const mainSocial = user?.socialAccounts?.[0];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark">
                        Привет, {user?.firstName}! 👋
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Добро пожаловать в личный кабинет MIXIT Creators
                    </p>
                </div>

                <Link to="/products" className="btn-primary">
                    Выбрать продукты
                    <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="w-12 h-12 bg-mixit-pink/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Trophy className="w-6 h-6 text-mixit-pink" />
                    </div>
                    <div className="stat-value text-gold">
                        <AnimatedCounter value={user?.points || 0} />
                    </div>
                    <div className="stat-label">MIXIT Points</div>
                </div>

                <div className="stat-card">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="stat-value">
                        <AnimatedCounter value={completedCollabs.length} />
                    </div>
                    <div className="stat-label">Коллабораций</div>
                </div>

                <div className="stat-card">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="stat-value text-mixit-pink">
                        {mainSocial?.er || 0}%
                    </div>
                    <div className="stat-label">Ваш ER</div>
                </div>

                <div className="stat-card">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="stat-value">
                        <AnimatedCounter value={activeCollabs.length} />
                    </div>
                    <div className="stat-label">Активных</div>
                </div>
            </div>

            {/* Level Progress Card */}
            <div className="card-static">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg
              ${user?.level === 'beginner' ? 'from-amber-600 to-amber-500' : ''}
              ${user?.level === 'promising' ? 'from-gray-400 to-gray-300' : ''}
              ${user?.level === 'experienced' ? 'from-yellow-500 to-amber-400' : ''}
              ${user?.level === 'advanced' ? 'from-gray-200 to-gray-100' : ''}
              ${user?.level === 'star' ? 'from-cyan-200 to-blue-200' : ''}
            `}>
                            <span className="text-3xl">
                                {user?.level === 'beginner' && '🥉'}
                                {user?.level === 'promising' && '🥈'}
                                {user?.level === 'experienced' && '🥇'}
                                {user?.level === 'advanced' && '💎'}
                                {user?.level === 'star' && '⭐'}
                            </span>
                        </div>
                        <div>
                            <LevelBadge level={user?.level} size="lg" />
                            <p className="text-sm text-gray-500 mt-1">
                                Лимит: до {currentLevel?.productLimit?.max} продуктов
                            </p>
                        </div>
                    </div>

                    {nextLevel && (
                        <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-gray-600">До уровня "{nextLevel.name}"</span>
                                <span className="font-medium text-mixit-pink">{progress.toFixed(0)}%</span>
                            </div>
                            <ProgressBar
                                value={user?.points || 0}
                                max={currentLevel?.pointsToNext || 1000}
                                showLabel={false}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Нужно ещё {((currentLevel?.pointsToNext || 1000) - (user?.points || 0)).toLocaleString()} очков
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Collaborations */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-dark">Активные коллаборации</h2>
                    <Link to="/collaborations" className="text-mixit-pink font-medium text-sm hover:underline">
                        Смотреть все
                    </Link>
                </div>

                {activeCollabs.length === 0 ? (
                    <div className="card-static text-center py-12">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">У вас пока нет активных коллабораций</p>
                        <Link to="/products" className="btn-primary">
                            Выбрать продукты
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {activeCollabs.slice(0, 2).map(collab => (
                            <Link
                                key={collab.id}
                                to={`/collaboration/${collab.id}`}
                                className="card"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className={statusColors[collab.status]}>
                                        {statusLabels[collab.status]}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        #{collab.id}
                                    </span>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    {collab.products.slice(0, 3).map(productId => {
                                        const product = getProductById(productId);
                                        return product ? (
                                            <img
                                                key={productId}
                                                src={product.image}
                                                alt={product.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : null;
                                    })}
                                    {collab.products.length > 3 && (
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                                            +{collab.products.length - 3}
                                        </div>
                                    )}
                                </div>

                                {collab.status === 'waiting_content' && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">Осталось времени:</p>
                                        <CountdownTimer deadline={collab.deadline} compact />
                                    </div>
                                )}

                                {collab.status === 'shipped' && (
                                    <p className="text-sm text-gray-600">
                                        Отправлено {new Date(collab.shippedAt).toLocaleDateString('ru-RU')}
                                    </p>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Link to="/products" className="card group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-mixit-pink/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Package className="w-6 h-6 text-mixit-pink" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-dark">Каталог</h3>
                            <p className="text-sm text-gray-500">Выбрать продукты</p>
                        </div>
                    </div>
                </Link>

                <Link to="/leaderboard" className="card group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Trophy className="w-6 h-6 text-gold" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-dark">Рейтинг</h3>
                            <p className="text-sm text-gray-500">Ваша позиция</p>
                        </div>
                    </div>
                </Link>

                <Link to="/achievements" className="card group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-2xl">🏆</span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-dark">Достижения</h3>
                            <p className="text-sm text-gray-500">{user?.achievements?.length || 0} из 6</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
