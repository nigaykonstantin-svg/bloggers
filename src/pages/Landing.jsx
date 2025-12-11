import { Link } from 'react-router-dom';
import { ArrowRight, Star, Gift, TrendingUp, Users, Shield, Sparkles } from 'lucide-react';
import { levels, levelOrder } from '../data/levels';

export default function Landing() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-mixit rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">M</span>
                            </div>
                            <span className="font-bold text-xl text-dark">MIXIT</span>
                            <span className="text-mixit-pink font-medium">Creators</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <Link to="/login" className="btn-secondary text-sm">
                                Войти
                            </Link>
                            <Link to="/register" className="btn-primary text-sm">
                                Стать блогером
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-mixit-pink/5 to-transparent"></div>
                <div className="absolute top-20 left-10 w-72 h-72 bg-mixit-pink/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-card mb-8 animate-fade-in">
                            <Sparkles className="w-5 h-5 text-gold" />
                            <span className="text-sm font-medium">Программа для beauty-блогеров</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-dark mb-6 animate-slide-up">
                            Создавай контент,{' '}
                            <span className="text-gradient">получай косметику</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto animate-slide-up">
                            Присоединяйся к MIXIT Creators — получай бесплатную косметику в обмен на качественный контент.
                            Чем активнее ты участвуешь, тем больше возможностей открывается!
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
                            <Link to="/register" className="btn-primary text-lg px-8 py-4">
                                Начать сейчас
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <a href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
                                Как это работает
                            </a>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-20">
                        {[
                            { value: '500+', label: 'Активных блогеров' },
                            { value: '2000+', label: 'Отправлено продуктов' },
                            { value: '50M+', label: 'Охват контента' },
                            { value: '4.8/5', label: 'Рейтинг программы' },
                        ].map((stat, i) => (
                            <div key={i} className="card text-center">
                                <div className="text-3xl font-bold text-gradient mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section id="how-it-works" className="py-20 px-4 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
                            Как это работает
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Простой путь от регистрации до первой коллаборации
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            {
                                icon: Users,
                                title: 'Регистрация',
                                desc: 'Заполни анкету и привяжи свой Instagram или TikTok аккаунт'
                            },
                            {
                                icon: Shield,
                                title: 'Верификация',
                                desc: 'Мы проверим твой аккаунт и определим твой уровень'
                            },
                            {
                                icon: Gift,
                                title: 'Выбор продуктов',
                                desc: 'Выбери продукты из каталога в рамках твоего лимита'
                            },
                            {
                                icon: Star,
                                title: 'Создай контент',
                                desc: 'Получи продукты и создай креативный контент'
                            },
                        ].map((step, i) => (
                            <div key={i} className="text-center">
                                <div className="w-16 h-16 bg-gradient-mixit rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                                    <step.icon className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-2xl font-bold text-mixit-pink mb-2">{i + 1}</div>
                                <h3 className="font-semibold text-dark mb-2">{step.title}</h3>
                                <p className="text-sm text-gray-600">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Levels */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-4">
                            Система уровней
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Расти вместе с нами и получай больше привилегий на каждом уровне
                        </p>
                    </div>

                    <div className="grid md:grid-cols-5 gap-4">
                        {levelOrder.map((levelId, i) => {
                            const level = levels[levelId];
                            return (
                                <div key={levelId} className="card-static text-center">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br mx-auto mb-4 flex items-center justify-center
                    ${levelId === 'beginner' ? 'from-amber-600 to-amber-500' : ''}
                    ${levelId === 'promising' ? 'from-gray-400 to-gray-300' : ''}
                    ${levelId === 'experienced' ? 'from-yellow-500 to-amber-400' : ''}
                    ${levelId === 'advanced' ? 'from-gray-200 to-gray-100 border border-gray-300' : ''}
                    ${levelId === 'star' ? 'from-cyan-200 to-blue-200' : ''}
                  `}>
                                        <span className="text-lg">{['🥉', '🥈', '🥇', '💎', '⭐'][i]}</span>
                                    </div>
                                    <h3 className="font-semibold text-dark mb-1">{level.name}</h3>
                                    <p className="text-xs text-gray-500 mb-3">
                                        {level.minFollowers >= 1000000
                                            ? `${level.minFollowers / 1000000}M+`
                                            : level.minFollowers >= 1000
                                                ? `${level.minFollowers / 1000}K+`
                                                : level.minFollowers}
                                        {' подписчиков'}
                                    </p>
                                    <div className="text-sm text-mixit-pink font-medium">
                                        до {level.productLimit.max === Infinity ? '∞' : level.productLimit.max} продуктов
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-mixit rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                                Готов стать частью команды?
                            </h2>
                            <p className="text-white/80 mb-8 max-w-xl mx-auto">
                                Присоединяйся к сотням блогеров, которые уже получают продукцию MIXIT и создают потрясающий контент
                            </p>
                            <Link
                                to="/register"
                                className="inline-flex items-center gap-2 bg-white text-mixit-pink font-semibold px-8 py-4 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                Зарегистрироваться
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 bg-dark text-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-mixit rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold text-xl">M</span>
                            </div>
                            <span className="font-bold text-xl">MIXIT</span>
                            <span className="text-mixit-pink font-medium">Creators</span>
                        </div>

                        <div className="flex gap-8 text-sm text-gray-400">
                            <a href="#" className="hover:text-white transition-colors">О программе</a>
                            <a href="#" className="hover:text-white transition-colors">FAQ</a>
                            <a href="#" className="hover:text-white transition-colors">Контакты</a>
                            <a href="#" className="hover:text-white transition-colors">Условия</a>
                        </div>

                        <div className="text-sm text-gray-500">
                            © 2024 MIXIT. Все права защищены.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
