import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, X, ArrowRight, Filter, Lightbulb, AlertCircle, TrendingUp } from 'lucide-react';
import { products, categories } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCollaborations } from '../data/collaborations';
import { levels } from '../data/levels';
import ProductCard from '../components/products/ProductCard';

export default function Products() {
    const [activeCategory, setActiveCategory] = useState('all');
    const { items, maxProducts, clearCart } = useCart();
    const { user } = useAuth();
    const { collaborations, getCollaborationsByBloggerId } = useCollaborations();
    const navigate = useNavigate();

    const currentLevel = levels[user?.level || 'beginner'];

    // Check collaboration limits
    const userCollabs = useMemo(() => {
        return getCollaborationsByBloggerId(user?.id) || [];
    }, [user?.id, collaborations]);

    const activeCollabs = userCollabs.filter(c =>
        !['completed', 'cancelled'].includes(c.status)
    );

    const lastCompletedCollab = userCollabs
        .filter(c => c.status === 'completed')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

    const daysSinceLastCollab = lastCompletedCollab
        ? Math.floor((Date.now() - new Date(lastCompletedCollab.createdAt)) / (1000 * 60 * 60 * 24))
        : Infinity;

    const canCreateNewCollab = activeCollabs.length < (currentLevel?.maxActiveCollabs || 1);
    const cooldownRemaining = Math.max(0, (currentLevel?.cooldownDays || 14) - daysSinceLastCollab);
    const isInCooldown = cooldownRemaining > 0 && lastCompletedCollab;

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category === activeCategory);

    // Generate contextual tips
    const tips = useMemo(() => {
        const tipsList = [];

        if (items.length === 0) {
            tipsList.push({
                icon: Lightbulb,
                color: 'blue',
                text: 'Совет: начните с 2-3 популярных продуктов для качественного контента'
            });
        }

        if (items.length > 0 && items.length < maxProducts) {
            const selectedCategories = [...new Set(items.map(i => i.category))];
            if (selectedCategories.length === 1) {
                tipsList.push({
                    icon: TrendingUp,
                    color: 'purple',
                    text: 'Добавьте продукты из разных категорий для разнообразного контента'
                });
            }
        }

        if (items.length === maxProducts) {
            tipsList.push({
                icon: AlertCircle,
                color: 'amber',
                text: `Вы достигли лимита продуктов для уровня "${currentLevel?.name}"`
            });
        }

        if (!canCreateNewCollab) {
            tipsList.push({
                icon: AlertCircle,
                color: 'red',
                text: `У вас уже ${activeCollabs.length} активных коллабораций (макс. ${currentLevel?.maxActiveCollabs}). Завершите текущие.`
            });
        }

        if (isInCooldown) {
            tipsList.push({
                icon: AlertCircle,
                color: 'yellow',
                text: `Перерыв между заявками: ещё ${cooldownRemaining} дн.`
            });
        }

        return tipsList;
    }, [items, maxProducts, canCreateNewCollab, isInCooldown, cooldownRemaining, activeCollabs.length]);

    const handleCheckout = () => {
        if (items.length === 0) return;
        if (!canCreateNewCollab) {
            alert('Вы достигли лимита активных коллабораций. Завершите текущие заявки.');
            return;
        }
        navigate('/collaborations/new');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-dark">Каталог продуктов</h1>
                    <p className="text-gray-600 mt-1">
                        Выберите до {maxProducts} продуктов для коллаборации
                    </p>
                </div>
            </div>

            {/* Tips */}
            {tips.length > 0 && (
                <div className="space-y-2">
                    {tips.map((tip, i) => {
                        const Icon = tip.icon;
                        const colors = {
                            blue: 'bg-blue-50 text-blue-700 border-blue-200',
                            purple: 'bg-purple-50 text-purple-700 border-purple-200',
                            amber: 'bg-amber-50 text-amber-700 border-amber-200',
                            red: 'bg-red-50 text-red-700 border-red-200',
                            yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
                        };
                        return (
                            <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors[tip.color]}`}>
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm">{tip.text}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                <button
                    onClick={() => setActiveCategory('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${activeCategory === 'all'
                        ? 'bg-mixit-pink text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Filter className="w-4 h-4" />
                    Все
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${activeCategory === cat.id
                            ? 'bg-mixit-pink text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        <span>{cat.icon}</span>
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Products Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {/* Cart Drawer */}
            {items.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 lg:left-72 bg-white border-t border-gray-200 p-4 shadow-lg z-20 animate-slide-up">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-3">
                                {items.slice(0, 3).map(item => (
                                    <img
                                        key={item.id}
                                        src={item.image}
                                        alt={item.name}
                                        className="w-12 h-12 rounded-xl border-2 border-white object-cover"
                                    />
                                ))}
                                {items.length > 3 && (
                                    <div className="w-12 h-12 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center text-sm font-medium">
                                        +{items.length - 3}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-dark">
                                    {items.length} из {maxProducts} продуктов
                                </p>
                                <p className="text-sm text-gray-500">
                                    Выбрано для коллаборации
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearCart}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleCheckout}
                                disabled={!canCreateNewCollab}
                                className={`btn-primary ${!canCreateNewCollab ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                Оформить
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
