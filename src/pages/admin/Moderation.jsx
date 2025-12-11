import { useState } from 'react';
import { Check, X, Eye, Instagram, ExternalLink } from 'lucide-react';
import { pendingBloggers } from '../../data/bloggers';
import { levels } from '../../data/levels';
import LevelBadge from '../../components/ui/LevelBadge';

export default function Moderation() {
    const [bloggers, setBloggers] = useState(pendingBloggers);
    const [selectedBlogger, setSelectedBlogger] = useState(null);

    const handleApprove = (id) => {
        setBloggers(prev => prev.filter(b => b.id !== id));
        setSelectedBlogger(null);
        // In real app, would call API
    };

    const handleReject = (id) => {
        setBloggers(prev => prev.filter(b => b.id !== id));
        setSelectedBlogger(null);
        // In real app, would call API
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-dark">Модерация заявок</h1>
                <p className="text-gray-500 mt-1">{bloggers.length} заявок ожидают проверки</p>
            </div>

            {bloggers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-gray-500">Нет заявок для модерации</p>
                </div>
            ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* List */}
                    <div className="space-y-4">
                        {bloggers.map(blogger => (
                            <div
                                key={blogger.id}
                                className={`bg-white rounded-2xl p-6 shadow-sm cursor-pointer transition-all hover:shadow-md ${selectedBlogger?.id === blogger.id ? 'ring-2 ring-mixit-pink' : ''
                                    }`}
                                onClick={() => setSelectedBlogger(blogger)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-mixit-pink/10 rounded-xl flex items-center justify-center text-mixit-pink font-bold text-lg">
                                        {blogger.firstName[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-dark">
                                            {blogger.firstName} {blogger.lastName}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <Instagram className="w-4 h-4" />
                                            @{blogger.socialAccounts[0]?.username}
                                        </p>
                                    </div>
                                    <LevelBadge level={blogger.recommendedLevel} size="sm" />
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-4">
                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                        <p className="text-lg font-bold text-dark">
                                            {blogger.socialAccounts[0]?.followers.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-500">Подписчиков</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                        <p className="text-lg font-bold text-mixit-pink">
                                            {blogger.socialAccounts[0]?.er}%
                                        </p>
                                        <p className="text-xs text-gray-500">ER</p>
                                    </div>
                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                        <p className="text-lg font-bold text-dark capitalize">
                                            {blogger.niche}
                                        </p>
                                        <p className="text-xs text-gray-500">Ниша</p>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleApprove(blogger.id);
                                        }}
                                        className="flex-1 py-2 bg-success text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-success/90"
                                    >
                                        <Check className="w-4 h-4" />
                                        Одобрить
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReject(blogger.id);
                                        }}
                                        className="flex-1 py-2 bg-error text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-error/90"
                                    >
                                        <X className="w-4 h-4" />
                                        Отклонить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Detail Panel */}
                    {selectedBlogger ? (
                        <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-6">
                            <h2 className="font-semibold text-dark mb-4">Детали заявки</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500">ФИО</label>
                                    <p className="font-medium text-dark">
                                        {selectedBlogger.firstName} {selectedBlogger.lastName}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500">Email</label>
                                    <p className="font-medium text-dark">{selectedBlogger.email}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500">Страна</label>
                                        <p className="font-medium text-dark">{selectedBlogger.country}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Город</label>
                                        <p className="font-medium text-dark">{selectedBlogger.city}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500">Instagram</label>
                                    <a
                                        href={selectedBlogger.socialAccounts[0]?.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-mixit-pink hover:underline"
                                    >
                                        @{selectedBlogger.socialAccounts[0]?.username}
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500">Рекомендуемый уровень</label>
                                    <div className="mt-1">
                                        <LevelBadge level={selectedBlogger.recommendedLevel} />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Привилегии: {levels[selectedBlogger.recommendedLevel]?.privileges?.[0]}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-500">Дата заявки</label>
                                    <p className="font-medium text-dark">
                                        {new Date(selectedBlogger.appliedAt).toLocaleString('ru-RU')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                            <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Выберите заявку для просмотра деталей</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
