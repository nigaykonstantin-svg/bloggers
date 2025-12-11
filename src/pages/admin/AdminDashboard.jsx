import { Users, Package, Clock, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { bloggers, pendingBloggers } from '../../data/bloggers';
import { collaborations, getActiveCollaborations } from '../../data/collaborations';
import { levels, levelOrder } from '../../data/levels';

export default function AdminDashboard() {
    const activeCollabs = getActiveCollaborations();

    const statsByLevel = levelOrder.reduce((acc, levelId) => {
        acc[levelId] = bloggers.filter(b => b.level === levelId).length;
        return acc;
    }, {});

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-dark">Dashboard</h1>

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
                            <p className="text-sm text-gray-500">Активные коллаборации</p>
                            <p className="text-3xl font-bold text-dark mt-1">{activeCollabs.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-4 text-sm text-success">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>+5 за неделю</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Ожидают модерации</p>
                            <p className="text-3xl font-bold text-dark mt-1">{pendingBloggers.length}</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">Требуется действие</p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Средний ER</p>
                            <p className="text-3xl font-bold text-dark mt-1">4.2%</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-4 text-sm text-error">
                        <ArrowDownRight className="w-4 h-4" />
                        <span>-0.3% за месяц</span>
                    </div>
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
                    <h2 className="font-semibold text-dark mb-4">Последние заявки</h2>
                    <div className="space-y-3">
                        {pendingBloggers.slice(0, 3).map(blogger => (
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
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="font-semibold text-dark mb-4">Ожидают отправки</h2>
                    <div className="space-y-3">
                        {collaborations.filter(c => c.status === 'pending').slice(0, 3).map(collab => {
                            const blogger = bloggers.find(b => b.id === collab.bloggerId);
                            return (
                                <div key={collab.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Package className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-dark truncate">
                                            {blogger?.firstName} {blogger?.lastName}
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
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
