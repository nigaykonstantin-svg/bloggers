import { useState } from 'react';
import { Instagram, RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { levels } from '../data/levels';
import LevelBadge from '../components/ui/LevelBadge';

export default function Profile() {
    const { user, updateUser } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    const currentLevel = levels[user?.level];
    const mainSocial = user?.socialAccounts?.[0];

    const handleRefreshStats = async () => {
        setRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setRefreshing(false);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold text-dark">Профиль</h1>

            {/* User Info */}
            <div className="card-static">
                <div className="flex items-center gap-4 mb-6">
                    <img
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstName}&background=FF6B9D&color=fff`}
                        alt={user?.firstName}
                        className="w-20 h-20 rounded-2xl object-cover"
                    />
                    <div>
                        <h2 className="text-xl font-bold text-dark">
                            {user?.firstName} {user?.lastName}
                        </h2>
                        <LevelBadge level={user?.level} />
                        <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-gold">{user?.points?.toLocaleString() || 0}</p>
                        <p className="text-sm text-gray-500">MIXIT Points</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                        <p className="text-2xl font-bold text-dark">{user?.successfulCollaborations || 0}</p>
                        <p className="text-sm text-gray-500">Коллабораций</p>
                    </div>
                </div>
            </div>

            {/* Level Info */}
            <div className="card-static">
                <h3 className="font-semibold text-dark mb-4">Ваш уровень: {currentLevel?.name}</h3>
                <ul className="space-y-2">
                    {currentLevel?.privileges?.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-600">
                            <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                            {p}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Social Accounts */}
            <div className="card-static">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-dark">Подключённые соцсети</h3>
                    <button
                        onClick={handleRefreshStats}
                        disabled={refreshing}
                        className="text-mixit-pink text-sm font-medium flex items-center gap-1"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Обновляем...' : 'Обновить статистику'}
                    </button>
                </div>

                {user?.socialAccounts?.map((account, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Instagram className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-dark">@{account.username}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{account.followers?.toLocaleString()} подписчиков</span>
                                <span>ER: {account.er}%</span>
                            </div>
                        </div>
                        {account.verified && (
                            <CheckCircle className="w-5 h-5 text-success" />
                        )}
                    </div>
                ))}
            </div>

            {/* Personal Info */}
            <div className="card-static">
                <h3 className="font-semibold text-dark mb-4">Личная информация</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Страна</label>
                            <p className="font-medium text-dark">{user?.country}</p>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-500 mb-1">Город</label>
                            <p className="font-medium text-dark">{user?.city}</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Ниша контента</label>
                        <p className="font-medium text-dark capitalize">{user?.niche}</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Дата регистрации</label>
                        <p className="font-medium text-dark">
                            {user?.registeredAt ? new Date(user.registeredAt).toLocaleDateString('ru-RU') : '—'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
