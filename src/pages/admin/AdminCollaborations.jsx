import { useState } from 'react';
import {
    Search, Truck, Star, ExternalLink, Eye, Heart, MessageCircle,
    Share2, Bookmark, Clock, MapPin, X, BarChart2, Send
} from 'lucide-react';
import { useCollaborations, statusLabels, statusColors } from '../../data/collaborations';
import { bloggers } from '../../data/bloggers';
import { getProductById } from '../../data/products';
import { levels } from '../../data/levels';
import LevelBadge from '../../components/ui/LevelBadge';

export default function AdminCollaborations() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCollab, setSelectedCollab] = useState(null);
    const [metricsModal, setMetricsModal] = useState(null);
    const [metrics, setMetrics] = useState({
        views: '',
        likes: '',
        comments: '',
        shares: '',
        saves: '',
    });

    const { collaborations, markAsShipped, completeCollaboration, updateCollaborationStatus } = useCollaborations();

    const filtered = collaborations.filter(collab => {
        const blogger = bloggers.find(b => b.id === collab.bloggerId);
        const matchesSearch =
            blogger?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blogger?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            collab.deliveryAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(collab.id).includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || collab.status === statusFilter;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const handleMarkShipped = (collabId) => {
        markAsShipped(collabId);
    };

    const handleRateWithMetrics = (collabId) => {
        setMetricsModal(collabId);
        setMetrics({ views: '', likes: '', comments: '', shares: '', saves: '' });
    };

    const submitMetrics = (rating) => {
        const collab = collaborations.find(c => c.id === metricsModal);
        if (collab) {
            // Calculate ER
            const views = parseInt(metrics.views) || 0;
            const likes = parseInt(metrics.likes) || 0;
            const comments = parseInt(metrics.comments) || 0;
            const er = views > 0 ? ((likes + comments) / views * 100).toFixed(2) : 0;

            // Calculate points based on rating and metrics
            const basePoints = rating * 50 + 100;
            const viewBonus = views > 10000 ? 100 : views > 5000 ? 50 : 0;
            const totalPoints = basePoints + viewBonus;

            updateCollaborationStatus(metricsModal, 'completed', {
                rating,
                pointsEarned: totalPoints,
                views,
                likes: parseInt(metrics.likes) || 0,
                comments: parseInt(metrics.comments) || 0,
                shares: parseInt(metrics.shares) || 0,
                saves: parseInt(metrics.saves) || 0,
                contentER: parseFloat(er),
            });
        }
        setMetricsModal(null);
    };

    const getDaysUntilDeadline = (deadline) => {
        if (!deadline) return null;
        const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark">Коллаборации</h1>
                <div className="text-sm text-gray-500">
                    {filtered.length} из {collaborations.length}
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { value: 'all', label: 'Все', count: collaborations.length },
                    { value: 'pending', label: '📦 Новые', count: collaborations.filter(c => c.status === 'pending').length },
                    { value: 'shipped', label: '🚚 В пути', count: collaborations.filter(c => c.status === 'shipped').length },
                    { value: 'waiting_content', label: '⏳ Ждут контент', count: collaborations.filter(c => c.status === 'waiting_content').length },
                    { value: 'completed', label: '✅ Готово', count: collaborations.filter(c => c.status === 'completed').length },
                ].map(tab => (
                    <button
                        key={tab.value}
                        onClick={() => setStatusFilter(tab.value)}
                        className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${statusFilter === tab.value
                                ? 'bg-mixit-pink text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Поиск по имени или ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                />
            </div>

            {/* Collaborations */}
            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                        <p className="text-gray-500">Нет коллабораций</p>
                    </div>
                ) : (
                    filtered.map(collab => {
                        const blogger = bloggers.find(b => b.id === collab.bloggerId);
                        const products = collab.products.map(id => getProductById(id)).filter(Boolean);
                        const daysLeft = getDaysUntilDeadline(collab.deadline);

                        return (
                            <div key={collab.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-mixit rounded-full flex items-center justify-center text-white font-bold">
                                                {collab.deliveryAddress?.fullName?.[0] || blogger?.firstName?.[0] || '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-dark">
                                                        {collab.deliveryAddress?.fullName || `${blogger?.firstName} ${blogger?.lastName}`}
                                                    </span>
                                                    {blogger && <LevelBadge level={blogger.level} size="sm" />}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>#{collab.id}</span>
                                                    <span>•</span>
                                                    <span>{new Date(collab.createdAt).toLocaleDateString('ru-RU')}</span>
                                                    {collab.deliveryAddress?.city && (
                                                        <>
                                                            <span>•</span>
                                                            <MapPin className="w-3 h-3" />
                                                            <span>{collab.deliveryAddress.city}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={statusColors[collab.status]}>
                                            {statusLabels[collab.status]}
                                        </span>
                                    </div>
                                </div>

                                {/* Products */}
                                <div className="p-4 bg-gray-50">
                                    <div className="flex gap-2 overflow-x-auto">
                                        {products.map(product => (
                                            <div key={product.id} className="flex-shrink-0">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-16 h-16 rounded-xl object-cover"
                                                    title={product.name}
                                                />
                                            </div>
                                        ))}
                                        {collab.products.length > products.length && (
                                            <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 text-sm flex-shrink-0">
                                                +{collab.products.length - products.length}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Deadline Warning */}
                                {collab.status === 'waiting_content' && daysLeft !== null && daysLeft <= 7 && (
                                    <div className={`px-4 py-2 flex items-center gap-2 ${daysLeft <= 0 ? 'bg-red-50 text-red-700' :
                                            daysLeft <= 3 ? 'bg-amber-50 text-amber-700' :
                                                'bg-blue-50 text-blue-700'
                                        }`}>
                                        <Clock className="w-4 h-4" />
                                        {daysLeft <= 0
                                            ? '🚨 Дедлайн пропущен!'
                                            : `⏰ До дедлайна: ${daysLeft} дн.`
                                        }
                                    </div>
                                )}

                                {/* Content Metrics (for completed) */}
                                {collab.status === 'completed' && collab.views && (
                                    <div className="px-4 py-3 bg-green-50 border-t border-green-100">
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-4 h-4 text-gray-500" />
                                                <span className="font-medium">{collab.views?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-4 h-4 text-red-400" />
                                                <span>{collab.likes?.toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageCircle className="w-4 h-4 text-blue-400" />
                                                <span>{collab.comments}</span>
                                            </div>
                                            {collab.contentER && (
                                                <div className="flex items-center gap-1 ml-auto">
                                                    <BarChart2 className="w-4 h-4 text-green-600" />
                                                    <span className="font-medium text-green-600">ER: {collab.contentER}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="p-4 flex items-center justify-between border-t border-gray-100">
                                    {collab.status === 'pending' && (
                                        <button
                                            onClick={() => handleMarkShipped(collab.id)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                                        >
                                            <Truck className="w-4 h-4" />
                                            Отметить отправку
                                        </button>
                                    )}

                                    {collab.status === 'waiting_content' && (
                                        <div className="flex items-center gap-2">
                                            {collab.contentUrl ? (
                                                <>
                                                    <a
                                                        href={collab.contentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Открыть контент
                                                    </a>
                                                    <button
                                                        onClick={() => handleRateWithMetrics(collab.id)}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                                                    >
                                                        <Star className="w-4 h-4" />
                                                        Оценить с метриками
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-500">Ожидаем отправку контента от блогера</span>
                                            )}
                                        </div>
                                    )}

                                    {collab.status === 'completed' && (
                                        <div className="flex items-center gap-3">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        className={`w-5 h-5 ${star <= (collab.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm font-medium text-green-600">+{collab.pointsEarned} очков</span>
                                        </div>
                                    )}

                                    {collab.status === 'shipped' && (
                                        <span className="text-sm text-gray-500">
                                            📦 Отправлено {new Date(collab.shippedAt).toLocaleDateString('ru-RU')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Metrics Modal */}
            {metricsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-dark">Метрики контента</h2>
                            <button onClick={() => setMetricsModal(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Eye className="w-4 h-4 inline mr-1" />
                                        Просмотры
                                    </label>
                                    <input
                                        type="number"
                                        value={metrics.views}
                                        onChange={e => setMetrics({ ...metrics, views: e.target.value })}
                                        className="input"
                                        placeholder="10000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Heart className="w-4 h-4 inline mr-1" />
                                        Лайки
                                    </label>
                                    <input
                                        type="number"
                                        value={metrics.likes}
                                        onChange={e => setMetrics({ ...metrics, likes: e.target.value })}
                                        className="input"
                                        placeholder="500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <MessageCircle className="w-4 h-4 inline mr-1" />
                                        Комментарии
                                    </label>
                                    <input
                                        type="number"
                                        value={metrics.comments}
                                        onChange={e => setMetrics({ ...metrics, comments: e.target.value })}
                                        className="input"
                                        placeholder="50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <Share2 className="w-4 h-4 inline mr-1" />
                                        Репосты
                                    </label>
                                    <input
                                        type="number"
                                        value={metrics.shares}
                                        onChange={e => setMetrics({ ...metrics, shares: e.target.value })}
                                        className="input"
                                        placeholder="20"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Bookmark className="w-4 h-4 inline mr-1" />
                                    Сохранения
                                </label>
                                <input
                                    type="number"
                                    value={metrics.saves}
                                    onChange={e => setMetrics({ ...metrics, saves: e.target.value })}
                                    className="input"
                                    placeholder="100"
                                />
                            </div>

                            {metrics.views && metrics.likes && (
                                <div className="p-3 bg-gray-50 rounded-xl text-sm">
                                    <strong>ER контента:</strong>{' '}
                                    {((parseInt(metrics.likes) + parseInt(metrics.comments || 0)) / parseInt(metrics.views) * 100).toFixed(2)}%
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Оценка контента</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(rating => (
                                        <button
                                            key={rating}
                                            onClick={() => submitMetrics(rating)}
                                            className="flex-1 py-3 bg-gray-100 hover:bg-yellow-100 rounded-xl transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Star className="w-5 h-5 text-yellow-400" />
                                            {rating}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
