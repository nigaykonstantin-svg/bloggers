import { Link } from 'react-router-dom';
import { Package, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCollaborationsByBloggerId, statusLabels, statusColors } from '../data/collaborations';
import { getProductById } from '../data/products';
import CountdownTimer from '../components/ui/CountdownTimer';

export default function Collaborations() {
    const { user } = useAuth();
    const collaborations = getCollaborationsByBloggerId(user?.id) || [];

    const activeCollabs = collaborations.filter(c => c.status !== 'completed');
    const completedCollabs = collaborations.filter(c => c.status === 'completed');

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark">Мои коллаборации</h1>
                    <p className="text-gray-600 mt-1">История и активные заказы</p>
                </div>

                <Link to="/products" className="btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Новая коллаборация
                </Link>
            </div>

            {/* Active */}
            <section>
                <h2 className="text-lg font-semibold text-dark mb-4">
                    Активные ({activeCollabs.length})
                </h2>

                {activeCollabs.length === 0 ? (
                    <div className="card-static text-center py-12">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Нет активных коллабораций</p>
                        <Link to="/products" className="btn-primary">
                            Выбрать продукты
                        </Link>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {activeCollabs.map(collab => (
                            <Link
                                key={collab.id}
                                to={`/collaboration/${collab.id}`}
                                className="card"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <span className={statusColors[collab.status]}>
                                        {statusLabels[collab.status]}
                                    </span>
                                    <span className="text-sm text-gray-500">#{collab.id}</span>
                                </div>

                                <div className="flex gap-2 mb-4">
                                    {collab.products.slice(0, 4).map(productId => {
                                        const product = getProductById(productId);
                                        return product ? (
                                            <img
                                                key={productId}
                                                src={product.image}
                                                alt={product.name}
                                                className="w-14 h-14 rounded-xl object-cover"
                                            />
                                        ) : null;
                                    })}
                                    {collab.products.length > 4 && (
                                        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-sm text-gray-500">
                                            +{collab.products.length - 4}
                                        </div>
                                    )}
                                </div>

                                {(collab.status === 'waiting_content' || collab.status === 'delivered') && (
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500 mb-1">Дедлайн контента:</p>
                                        <CountdownTimer deadline={collab.deadline} compact />
                                    </div>
                                )}

                                {collab.status === 'pending' && (
                                    <p className="text-sm text-gray-500">Ожидает отправки модератором</p>
                                )}

                                {collab.status === 'shipped' && (
                                    <p className="text-sm text-gray-500">
                                        Отправлено {new Date(collab.shippedAt).toLocaleDateString('ru-RU')}
                                    </p>
                                )}

                                <div className="flex items-center justify-end mt-4 text-mixit-pink text-sm font-medium">
                                    Подробнее <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {/* Completed */}
            {completedCollabs.length > 0 && (
                <section>
                    <h2 className="text-lg font-semibold text-dark mb-4">
                        Завершённые ({completedCollabs.length})
                    </h2>

                    <div className="space-y-3">
                        {completedCollabs.map(collab => (
                            <Link
                                key={collab.id}
                                to={`/collaboration/${collab.id}`}
                                className="card flex items-center gap-4"
                            >
                                <div className="flex -space-x-2">
                                    {collab.products.slice(0, 3).map(productId => {
                                        const product = getProductById(productId);
                                        return product ? (
                                            <img
                                                key={productId}
                                                src={product.image}
                                                alt={product.name}
                                                className="w-10 h-10 rounded-lg border-2 border-white object-cover"
                                            />
                                        ) : null;
                                    })}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-dark">
                                        {collab.products.length} продуктов
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {new Date(collab.createdAt).toLocaleDateString('ru-RU')}
                                    </p>
                                </div>

                                {collab.rating && (
                                    <div className="text-right">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <span
                                                    key={star}
                                                    className={star <= collab.rating ? 'text-gold' : 'text-gray-200'}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-sm text-success">+{collab.pointsEarned} очков</p>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
