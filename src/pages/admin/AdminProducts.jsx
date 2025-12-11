import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { products as defaultProducts, categories } from '../../data/products';
import { levelOrder, levels } from '../../data/levels';

// Helper to get products from localStorage or use defaults
const getStoredProducts = () => {
    const stored = localStorage.getItem('mixit_products');
    if (stored) {
        return JSON.parse(stored);
    }
    return defaultProducts;
};

export default function AdminProducts() {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [productList, setProductList] = useState(getStoredProducts);
    const [showModal, setShowModal] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        category: 'face',
        volume: '',
        description: '',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
        popularity: 50,
        minLevel: 'beginner'
    });

    // Save to localStorage whenever productList changes
    useEffect(() => {
        localStorage.setItem('mixit_products', JSON.stringify(productList));
    }, [productList]);

    const filtered = productList.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleAddProduct = (e) => {
        e.preventDefault();
        const product = {
            ...newProduct,
            id: Date.now(),
            popularity: parseInt(newProduct.popularity)
        };
        setProductList([product, ...productList]);
        setShowModal(false);
        setNewProduct({
            name: '',
            category: 'face',
            volume: '',
            description: '',
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
            popularity: 50,
            minLevel: 'beginner'
        });
    };

    const handleDeleteProduct = (id) => {
        if (confirm('Удалить этот продукт?')) {
            setProductList(productList.filter(p => p.id !== id));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-dark">Продукты</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-mixit-pink text-white rounded-xl font-medium hover:opacity-90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Добавить продукт
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                    />
                </div>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                >
                    <option value="all">Все категории</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            <p className="text-sm text-gray-500">
                Всего продуктов: {productList.length} | Показано: {filtered.length}
            </p>

            {/* Products Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(product => {
                    const category = categories.find(c => c.id === product.category);

                    return (
                        <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                            <div className="aspect-square relative">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2">
                                    <span className="bg-white/90 backdrop-blur-sm text-xs font-medium px-2 py-1 rounded-full">
                                        {category?.icon} {category?.name}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-semibold text-dark mb-1 line-clamp-2">{product.name}</h3>
                                <p className="text-sm text-gray-500 mb-3">{product.volume}</p>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-mixit-pink">
                                        ⭐ {product.popularity}% популярности
                                    </span>

                                    <div className="flex gap-1">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4 text-gray-500" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4 text-error" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Product Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold text-dark">Добавить продукт</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddProduct} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Название продукта *
                                </label>
                                <input
                                    type="text"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                                    placeholder="Например: Увлажняющий крем для лица"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Категория *
                                    </label>
                                    <select
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Объём *
                                    </label>
                                    <input
                                        type="text"
                                        value={newProduct.volume}
                                        onChange={(e) => setNewProduct({ ...newProduct, volume: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                                        placeholder="50 мл"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Описание
                                </label>
                                <textarea
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink resize-none"
                                    rows={3}
                                    placeholder="Краткое описание продукта..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL изображения
                                </label>
                                <input
                                    type="url"
                                    value={newProduct.image}
                                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Мин. уровень блогера
                                    </label>
                                    <select
                                        value={newProduct.minLevel}
                                        onChange={(e) => setNewProduct({ ...newProduct, minLevel: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                                    >
                                        {levelOrder.map(levelId => (
                                            <option key={levelId} value={levelId}>
                                                {levels[levelId].name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Популярность (%)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={newProduct.popularity}
                                        onChange={(e) => setNewProduct({ ...newProduct, popularity: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-mixit-pink text-white rounded-xl font-medium hover:opacity-90"
                                >
                                    Добавить
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
