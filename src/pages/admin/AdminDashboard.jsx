import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import {
    Users, Package, Clock, TrendingUp, ArrowUpRight, ArrowDownRight,
    AlertTriangle, Bell, Eye, Star, ChevronRight, Send
} from 'lucide-react';
import { bloggers, pendingBloggers } from '../../data/bloggers';
import { useCollaborations, statusLabels } from '../../data/collaborations';
import { levels, levelOrder } from '../../data/levels';
import { getProductById } from '../../data/products';

export default function AdminDashboard() {
    const { collaborations } = useCollaborations();

    // Calculate stats
    const stats = useMemo(() => {
        const pending = collaborations.filter(c => c.status === 'pending');
        const waitingContent = collaborations.filter(c => c.status === 'waiting_content');
        const needsReview = collaborations.filter(c => c.status === 'waiting_content' && c.contentUrl);
        const completed = collaborations.filter(c => c.status === 'completed');

        // Overdue (deadline passed, no content)
        const overdue = waitingContent.filter(c => {
            if (!c.deadline) return false;
            return new Date(c.deadline) < new Date() && !c.contentUrl;
        });

        // Urgent (deadline within 3 days)
        const urgent = waitingContent.filter(c => {
            if (!c.deadline) return false;
            const daysLeft = Math.ceil((new Date(c.deadline) - new Date()) / (1000 * 60 * 60 * 24));
            return daysLeft > 0 && daysLeft <= 3 && !c.contentUrl;
        });

        // Average rating
        const avgRating = completed.length > 0
            ? (completed.reduce((sum, c) => sum + (c.rating || 0), 0) / completed.length).toFixed(1)
            : 0;

        // Total views (mock)
        const totalViews = completed.reduce((sum, c) => sum + (c.views || 0), 0);

        return { pending, waitingContent, needsReview, completed, overdue, urgent, avgRating, totalViews };
    }, [collaborations]);

    const statsByLevel = levelOrder.reduce((acc, levelId) => {
        acc[levelId] = bloggers.filter(b => b.level === levelId).length;
        return acc;
    }, {});

    // Action items
    const actionItems = useMemo(() => {
        const items = [];

        if (pendingBloggers.length > 0) {
            items.push({
                icon: Users,
                color: 'purple',
                count: pendingBloggers.length,
                text: 'новых заявок на модерацию',
                link: '/admin/moderation',
                priority: 2
            });
        }

        if (stats.pending.length > 0) {
            items.push({
                icon: Package,
                color: 'blue',
                count: stats.pending.length,
                text: 'коллабораций ожидают отправки',
                link: '/admin/collaborations',
                priority: 1
            });
        }

        if (stats.needsReview.length > 0) {
            items.push({
                icon: Eye,
                color: 'green',
                count: stats.needsReview.length,
                text: 'контента ждут оценки',
                link: '/admin/collaborations',
                priority: 1
            });
        }

        if (stats.overdue.length > 0) {
            items.push({
                icon: AlertTriangle,
                color: 'red',
                count: stats.overdue.length,
                text: 'блогеров пропустили дедлайн',
                link: '/admin/collaborations',
                priority: 0
            });
        }

        if (stats.urgent.length > 0) {
            items.push({
                icon: Clock,
                color: 'amber',
                count: stats.urgent.length,
                text: 'дедлайнов в ближайшие 3 дня',
                link: '/admin/collaborations',
                priority: 1
            });
        }

        return items.sort((a, b) => a.priority - b.priority);
    }, [stats, pendingBloggers]);

    const colorClasses = {
        red: 'bg-red-50 text-red-700 border-red-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
    };

    const iconBgClasses = {
        red: 'bg-red-100',
        amber: 'bg-amber-100',
        blue: 'bg-blue-100',
        green: 'bg-green-100',
        purple: 'bg-purple-100',
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-dark">Dashboard</h1>

            {/* Action Center */}
            {actionItems.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-mixit-pink">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="w-5 h-5 text-mixit-pink" />
                        <h2 className="font-semibold text-dark">Требуют внимания</h2>
                    </div>
                    <div className="space-y-2">
                        {actionItems.map((item, i) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={i}
                                    to={item.link}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.01] ${colorClasses[item.color]}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClasses[item.color]}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span>
                                            <strong>{item.count}</strong> {item.text}
                                        </span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 opacity-50" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Всего блогеров</p>
                            <p className="text-3xl font-bold text-dark mt-1">{bloggers.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-mixit-pink/10 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-mixit-pink" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-4 text-sm text-success">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>+12% за месяц</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Всего коллабораций</p>
                            <p className="text-3xl font-bold text-dark mt-1">{collaborations.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                        <span className="text-green-600 font-medium">{stats.completed.length}</span> завершено
                        <span className="text-blue-600 font-medium">{stats.waitingContent.length}</span> активно
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Средняя оценка</p>
                            <p className="text-3xl font-bold text-dark mt-1 flex items-center gap-2">
                                {stats.avgRating}
                                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <Star className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-4 text-sm text-success">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Качество растёт</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500">% вовремя</p>
                            <p className="text-3xl font-bold text-dark mt-1">87%</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                </div>
            </div>

            {/* Collaboration Funnel */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-dark mb-4">Воронка коллабораций</h2>
                <div className="flex items-center justify-between gap-2">
                    {[
                        { label: 'Новые', count: stats.pending.length, color: 'bg-purple-500' },
                        { label: 'Отправлено', count: collaborations.filter(c => c.status === 'shipped').length, color: 'bg-blue-500' },
                        { label: 'Ожидает контент', count: stats.waitingContent.length, color: 'bg-amber-500' },
                        { label: 'На проверке', count: stats.needsReview.length, color: 'bg-green-500' },
                        { label: 'Завершено', count: stats.completed.length, color: 'bg-gray-400' },
                    ].map((step, i, arr) => (
                        <div key={step.label} className="flex-1 flex items-center">
                            <div className="flex-1 text-center">
                                <div className={`w-12 h-12 ${step.color} rounded-xl mx-auto mb-2 flex items-center justify-center text-white font-bold`}>
                                    {step.count}
                                </div>
                                <p className="text-xs text-gray-500">{step.label}</p>
                            </div>
                            {i < arr.length - 1 && (
                                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bloggers by Level */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-dark mb-4">Блогеры по уровням</h2>
                <div className="grid grid-cols-5 gap-4">
                    {levelOrder.map(levelId => {
                        const level = levels[levelId];
                        return (
                            <div key={levelId} className="text-center">
                                <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center bg-gradient-to-br
                  ${levelId === 'beginner' ? 'from-amber-600 to-amber-500' : ''}
                  ${levelId === 'promising' ? 'from-gray-400 to-gray-300' : ''}
                  ${levelId === 'experienced' ? 'from-yellow-500 to-amber-400' : ''}
                  ${levelId === 'advanced' ? 'from-gray-200 to-gray-100' : ''}
                  ${levelId === 'star' ? 'from-cyan-200 to-blue-200' : ''}
                `}>
                                    <span className="text-lg">
                                        {['🥉', '🥈', '🥇', '💎', '⭐'][levelOrder.indexOf(levelId)]}
                                    </span>
                                </div>
                                <p className="text-2xl font-bold text-dark">{statsByLevel[levelId]}</p>
                                <p className="text-xs text-gray-500">{level.name}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-dark">Последние заявки</h2>
                        <Link to="/admin/moderation" className="text-sm text-mixit-pink hover:underline">
                            Все заявки →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {pendingBloggers.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Нет новых заявок</p>
                        ) : (
                            pendingBloggers.slice(0, 3).map(blogger => (
                                <div key={blogger.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-mixit-pink/10 rounded-full flex items-center justify-center text-mixit-pink font-medium">
                                        {blogger.firstName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-dark truncate">
                                            {blogger.firstName} {blogger.lastName}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            @{blogger.socialAccounts[0]?.username}
                                        </p>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {blogger.socialAccounts[0]?.followers.toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-dark">Ожидают отправки</h2>
                        <Link to="/admin/collaborations" className="text-sm text-mixit-pink hover:underline">
                            Все коллаборации →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {stats.pending.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Нет ожидающих отправки</p>
                        ) : (
                            stats.pending.slice(0, 3).map(collab => {
                                const blogger = bloggers.find(b => b.id === collab.bloggerId);
                                return (
                                    <div key={collab.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <Package className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-dark truncate">
                                                {collab.deliveryAddress?.fullName || `${blogger?.firstName} ${blogger?.lastName}`}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {collab.products.length} продуктов
                                            </p>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {collab.deliveryAddress?.city}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Link to="/admin/collaborations" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Send className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-dark">Отметить отправку</h3>
                        <p className="text-sm text-gray-500">{stats.pending.length} ожидают</p>
                    </div>
                </Link>

                <Link to="/admin/moderation" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-dark">Модерация</h3>
                        <p className="text-sm text-gray-500">{pendingBloggers.length} заявок</p>
                    </div>
                </Link>

                <Link to="/admin/analytics" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-dark">Аналитика</h3>
                        <p className="text-sm text-gray-500">Отчёты и метрики</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
