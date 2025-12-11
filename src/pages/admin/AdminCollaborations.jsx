import { useState } from 'react';
import { Search, Truck, Check, Star } from 'lucide-react';
import { useCollaborations, statusLabels, statusColors } from '../../data/collaborations';
import { bloggers } from '../../data/bloggers';
import { getProductById } from '../../data/products';

export default function AdminCollaborations() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { collaborations, markAsShipped, completeCollaboration } = useCollaborations();

    const filtered = collaborations.filter(collab => {
        const blogger = bloggers.find(b => b.id === collab.bloggerId);
        const matchesSearch =
            blogger?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blogger?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            collab.deliveryAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || collab.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleMarkShipped = (collabId) => {
        markAsShipped(collabId);
    };

    const handleRate = (collabId, rating) => {
        completeCollaboration(collabId, rating);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-dark">Коллаборации</h1>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск по имени блогера..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                >
                    <option value="all">Все статусы</option>
                    {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                    ))}
                </select>
            </div>

            <p className="text-sm text-gray-500">Всего: {filtered.length} коллабораций</p>

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

                        return (
                            <div key={collab.id} className="bg-white rounded-2xl p-6 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="w-12 h-12 bg-mixit-pink/10 rounded-full flex items-center justify-center text-mixit-pink font-bold">
                                            {collab.deliveryAddress?.fullName?.[0] || blogger?.firstName?.[0] || '?'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-dark">
                                                {collab.deliveryAddress?.fullName || `${blogger?.firstName} ${blogger?.lastName}`}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Коллаборация #{collab.id}
                                            </p>
                                        </div>
                                    </div>

                                    <span className={statusColors[collab.status]}>
                                        {statusLabels[collab.status]}
                                    </span>
                                </div>

                                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                    {products.map(product => (
                                        <img
                                            key={product.id}
                                            src={product.image}
                                            alt={product.name}
                                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                                            title={product.name}
                                        />
                                    ))}
                                    {collab.products.length > products.length && (
                                        <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm flex-shrink-0">
                                            +{collab.products.length - products.length}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        {collab.deliveryAddress?.city} • {new Date(collab.createdAt).toLocaleDateString('ru-RU')}
                                    </div>

                                    {collab.status === 'pending' && (
                                        <button
                                            onClick={() => handleMarkShipped(collab.id)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                                        >
                                            <Truck className="w-4 h-4" />
                                            Отметить как отправлено
                                        </button>
                                    )}

                                    {collab.status === 'waiting_content' && collab.contentUrl && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-500">Оценить контент:</span>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(rating => (
                                                    <button
                                                        key={rating}
                                                        onClick={() => handleRate(collab.id, rating)}
                                                        className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                                                    >
                                                        <Star className="w-5 h-5 text-yellow-400" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {collab.status === 'completed' && (
                                        <div className="flex items-center gap-2">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        className={`w-4 h-4 ${star <= (collab.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-sm text-green-600">+{collab.pointsEarned} очков</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
