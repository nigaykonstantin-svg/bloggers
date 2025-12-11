import { useState } from 'react';
import { Search, Filter, Star } from 'lucide-react';
import { bloggers } from '../../data/bloggers';
import { levels, levelOrder } from '../../data/levels';
import LevelBadge from '../../components/ui/LevelBadge';

export default function BloggersList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [levelFilter, setLevelFilter] = useState('all');

    const filteredBloggers = bloggers.filter(blogger => {
        const matchesSearch =
            blogger.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blogger.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blogger.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            blogger.socialAccounts[0]?.username.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLevel = levelFilter === 'all' || blogger.level === levelFilter;

        return matchesSearch && matchesLevel;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-dark">Блогеры</h1>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск по имени, email или username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                    />
                </div>

                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-mixit-pink"
                >
                    <option value="all">Все уровни</option>
                    {levelOrder.map(levelId => (
                        <option key={levelId} value={levelId}>
                            {levels[levelId].name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Results count */}
            <p className="text-sm text-gray-500">
                Найдено: {filteredBloggers.length} блогеров
            </p>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">Блогер</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">Уровень</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">Подписчиков</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">ER</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">Очки</th>
                                <th className="text-left py-4 px-6 font-medium text-gray-500 text-sm">Коллабораций</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredBloggers.map(blogger => (
                                <tr key={blogger.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={blogger.avatar}
                                                alt={blogger.firstName}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="font-medium text-dark">
                                                    {blogger.firstName} {blogger.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    @{blogger.socialAccounts[0]?.username}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <LevelBadge level={blogger.level} size="sm" />
                                    </td>
                                    <td className="py-4 px-6 font-medium text-dark">
                                        {blogger.socialAccounts[0]?.followers.toLocaleString()}
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-mixit-pink font-medium">
                                            {blogger.socialAccounts[0]?.er}%
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="text-gold font-medium flex items-center gap-1">
                                            <Star className="w-4 h-4" />
                                            {blogger.points.toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-gray-600">
                                        {blogger.successfulCollaborations}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
