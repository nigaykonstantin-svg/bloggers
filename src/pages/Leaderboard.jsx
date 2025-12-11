import { useState } from 'react';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { bloggers } from '../data/bloggers';
import { levels, levelOrder } from '../data/levels';
import { useAuth } from '../context/AuthContext';
import LevelBadge from '../components/ui/LevelBadge';

export default function Leaderboard() {
    const [selectedLevel, setSelectedLevel] = useState('all');
    const { user } = useAuth();

    const filteredBloggers = selectedLevel === 'all'
        ? bloggers
        : bloggers.filter(b => b.level === selectedLevel);

    const sortedBloggers = [...filteredBloggers].sort((a, b) => b.points - a.points);
    const userRank = sortedBloggers.findIndex(b => b.id === user?.id) + 1;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-dark">Рейтинг блогеров</h1>
                <p className="text-gray-600 mt-1">Соревнуйтесь и получайте бонусы</p>
            </div>

            {/* User Position */}
            {userRank > 0 && (
                <div className="card-static bg-gradient-to-r from-mixit-pink/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-mixit rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-glow">
                            #{userRank}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Ваша позиция</p>
                            <p className="font-semibold text-dark text-lg">
                                {userRank <= 10 ? '🏆 Вы в топ-10!' : `${userRank} из ${sortedBloggers.length}`}
                            </p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-2xl font-bold text-gold">{user?.points?.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">очков</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Level Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                    onClick={() => setSelectedLevel('all')}
                    className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${selectedLevel === 'all'
                            ? 'bg-mixit-pink text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    Все уровни
                </button>
                {levelOrder.map(levelId => (
                    <button
                        key={levelId}
                        onClick={() => setSelectedLevel(levelId)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${selectedLevel === levelId
                                ? 'bg-mixit-pink text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {levels[levelId].name}
                    </button>
                ))}
            </div>

            {/* Rewards Info */}
            <div className="grid sm:grid-cols-3 gap-4">
                <div className="card-static flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🥇</span>
                    </div>
                    <div>
                        <p className="font-semibold text-dark">1 место</p>
                        <p className="text-sm text-gray-500">2x лимит продуктов</p>
                    </div>
                </div>
                <div className="card-static flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🥈🥉</span>
                    </div>
                    <div>
                        <p className="font-semibold text-dark">2-3 место</p>
                        <p className="text-sm text-gray-500">+1 продукт к лимиту</p>
                    </div>
                </div>
                <div className="card-static flex items-center gap-4">
                    <div className="w-12 h-12 bg-mixit-pink/10 rounded-xl flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-mixit-pink" />
                    </div>
                    <div>
                        <p className="font-semibold text-dark">Топ-10</p>
                        <p className="text-sm text-gray-500">Приоритет на новинки</p>
                    </div>
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="card-static">
                <div className="space-y-2">
                    {sortedBloggers.map((blogger, index) => {
                        const isCurrentUser = blogger.id === user?.id;
                        const rank = index + 1;

                        return (
                            <div
                                key={blogger.id}
                                className={`leaderboard-row ${isCurrentUser ? 'bg-mixit-pink/5 ring-2 ring-mixit-pink/20' : ''}`}
                            >
                                <div className={`leaderboard-rank ${rank === 1 ? 'leaderboard-rank-1' :
                                        rank === 2 ? 'leaderboard-rank-2' :
                                            rank === 3 ? 'leaderboard-rank-3' :
                                                'bg-gray-100 text-gray-600'
                                    }`}>
                                    {rank}
                                </div>

                                <img
                                    src={blogger.avatar}
                                    alt={blogger.firstName}
                                    className="w-10 h-10 rounded-full object-cover"
                                />

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-dark truncate">
                                        {blogger.firstName} {blogger.lastName}
                                        {isCurrentUser && <span className="text-mixit-pink ml-1">(Вы)</span>}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <LevelBadge level={blogger.level} size="sm" />
                                        <span className="text-xs text-gray-500">
                                            @{blogger.socialAccounts[0]?.username}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <p className="font-bold text-dark">{blogger.points.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">очков</p>
                                </div>

                                <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500">
                                    <TrendingUp className="w-4 h-4" />
                                    {blogger.socialAccounts[0]?.er}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
