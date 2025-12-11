import { TrendingUp, Users, Package, Star } from 'lucide-react';
import { bloggers } from '../../data/bloggers';
import { collaborations } from '../../data/collaborations';
import { products, categories } from '../../data/products';
import { levels, levelOrder } from '../../data/levels';

export default function Analytics() {
    // Calculate product popularity
    const productRequests = collaborations.flatMap(c => c.products);
    const productCounts = productRequests.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {});

    const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({
            product: products.find(p => p.id === parseInt(id)),
            count
        }));

    // Calculate ER by level
    const erByLevel = levelOrder.map(levelId => {
        const levelBloggers = bloggers.filter(b => b.level === levelId);
        const avgEr = levelBloggers.length > 0
            ? levelBloggers.reduce((sum, b) => sum + (b.socialAccounts[0]?.er || 0), 0) / levelBloggers.length
            : 0;
        return { level: levels[levelId], avgEr };
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-dark">Аналитика</h1>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-dark mb-6">Воронка конверсии</h2>
                <div className="flex items-end justify-between gap-4 h-48">
                    {[
                        { label: 'Заявки', value: 150, color: 'bg-gray-400' },
                        { label: 'Одобрено', value: 120, color: 'bg-blue-400' },
                        { label: 'Активные', value: 85, color: 'bg-mixit-pink' },
                        { label: 'Завершили', value: 60, color: 'bg-success' },
                    ].map((step, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                            <div className="text-lg font-bold text-dark mb-2">{step.value}</div>
                            <div
                                className={`w-full ${step.color} rounded-t-xl transition-all`}
                                style={{ height: `${(step.value / 150) * 100}%` }}
                            />
                            <div className="text-sm text-gray-500 mt-2 text-center">{step.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="font-semibold text-dark mb-4">Топ продуктов по запросам</h2>
                    <div className="space-y-3">
                        {topProducts.map(({ product, count }, i) => (
                            <div key={product?.id} className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-mixit-pink/10 flex items-center justify-center text-mixit-pink font-bold">
                                    {i + 1}
                                </div>
                                <img
                                    src={product?.image}
                                    alt={product?.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-dark truncate">{product?.name}</p>
                                    <p className="text-sm text-gray-500">{product?.volume}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-dark">{count}</p>
                                    <p className="text-xs text-gray-500">запросов</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ER by Level */}
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                    <h2 className="font-semibold text-dark mb-4">Средний ER по уровням</h2>
                    <div className="space-y-4">
                        {erByLevel.map(({ level, avgEr }) => (
                            <div key={level.id}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">{level.name}</span>
                                    <span className="text-sm font-bold text-mixit-pink">{avgEr.toFixed(2)}%</span>
                                </div>
                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-mixit rounded-full"
                                        style={{ width: `${Math.min(100, avgEr * 10)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="font-semibold text-dark mb-4">Распределение по категориям</h2>
                <div className="grid grid-cols-4 gap-4">
                    {categories.map(category => {
                        const categoryProducts = products.filter(p => p.category === category.id);
                        const requests = productRequests.filter(id =>
                            categoryProducts.some(p => p.id === id)
                        ).length;

                        return (
                            <div key={category.id} className="text-center p-4 bg-gray-50 rounded-xl">
                                <div className="text-3xl mb-2">{category.icon}</div>
                                <p className="font-semibold text-dark">{category.name}</p>
                                <p className="text-2xl font-bold text-mixit-pink mt-2">{requests}</p>
                                <p className="text-xs text-gray-500">запросов</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
