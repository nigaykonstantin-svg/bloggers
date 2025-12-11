import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, X, ArrowRight, Filter } from 'lucide-react';
import { products, categories } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/products/ProductCard';

export default function Products() {
    const [activeCategory, setActiveCategory] = useState('all');
    const { items, maxProducts, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category === activeCategory);

    const handleCheckout = () => {
        if (items.length === 0) return;
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
                                className="btn-primary"
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
