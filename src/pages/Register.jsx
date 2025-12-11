import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Instagram, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { calculateLevel, levels } from '../data/levels';
import LevelBadge from '../components/ui/LevelBadge';

const niches = [
    { id: 'beauty', label: 'Beauty', icon: '💄' },
    { id: 'skincare', label: 'Skincare', icon: '🧴' },
    { id: 'lifestyle', label: 'Lifestyle', icon: '✨' },
    { id: 'fashion', label: 'Fashion', icon: '👗' },
];

export default function Register() {
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [mockStats, setMockStats] = useState(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        country: 'Россия',
        city: '',
        instagram: '',
        tiktok: '',
        niche: '',
    });

    const { register } = useAuth();
    const navigate = useNavigate();

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const verifyInstagram = async () => {
        if (!formData.instagram) return;

        setVerifying(true);
        setError('');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock stats
        const followers = Math.floor(Math.random() * 40000) + 2000;
        const avgLikes = Math.floor(followers * (Math.random() * 0.05 + 0.02));
        const avgComments = Math.floor(avgLikes * 0.1);
        const er = ((avgLikes + avgComments) / followers * 100).toFixed(2);
        const level = calculateLevel(followers, parseFloat(er));

        setMockStats({
            followers,
            avgLikes,
            avgComments,
            er,
            level,
        });

        setVerified(true);
        setVerifying(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (step === 1) {
            setStep(2);
            return;
        }

        if (step === 2) {
            if (!formData.instagram && !formData.tiktok) {
                setError('Укажите хотя бы одну социальную сеть');
                return;
            }
            setStep(3);
            return;
        }

        setLoading(true);

        const result = await register({
            ...formData,
            level: mockStats?.level || 'beginner',
        });

        if (result.success) {
            navigate('/dashboard');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Left side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 py-12">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-mixit-pink mb-8">
                    <ArrowLeft className="w-4 h-4" />
                    На главную
                </Link>

                <div className="max-w-md">
                    {/* Progress */}
                    <div className="flex items-center gap-2 mb-8">
                        {[1, 2, 3].map(s => (
                            <div
                                key={s}
                                className={`flex-1 h-2 rounded-full transition-all duration-300 ${s <= step ? 'bg-mixit-pink' : 'bg-gray-200'
                                    }`}
                            />
                        ))}
                    </div>

                    <h1 className="text-3xl font-bold text-dark mb-2">
                        {step === 1 && 'Создайте аккаунт'}
                        {step === 2 && 'Привяжите соцсети'}
                        {step === 3 && 'Ваш уровень определён!'}
                    </h1>
                    <p className="text-gray-600 mb-8">
                        {step === 1 && 'Заполните основную информацию'}
                        {step === 2 && 'Укажите ссылки на ваши аккаунты'}
                        {step === 3 && 'Добро пожаловать в программу MIXIT Creators'}
                    </p>

                    {error && (
                        <div className="bg-error/10 text-error px-4 py-3 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {step === 1 && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => updateField('firstName', e.target.value)}
                                            className="input"
                                            placeholder="Анна"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Фамилия</label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => updateField('lastName', e.target.value)}
                                            className="input"
                                            placeholder="Иванова"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        className="input"
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Пароль</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => updateField('password', e.target.value)}
                                            className="input pr-12"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Страна</label>
                                        <select
                                            value={formData.country}
                                            onChange={(e) => updateField('country', e.target.value)}
                                            className="input"
                                        >
                                            <option>Россия</option>
                                            <option>Казахстан</option>
                                            <option>Беларусь</option>
                                            <option>Украина</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => updateField('city', e.target.value)}
                                            className="input"
                                            placeholder="Москва"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Ниша контента</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {niches.map(niche => (
                                            <button
                                                key={niche.id}
                                                type="button"
                                                onClick={() => updateField('niche', niche.id)}
                                                className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${formData.niche === niche.id
                                                        ? 'border-mixit-pink bg-mixit-pink/5'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <span className="text-2xl mb-1 block">{niche.icon}</span>
                                                <span className="font-medium text-dark">{niche.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <Instagram className="w-4 h-4 inline mr-1" />
                                        Instagram
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.instagram}
                                            onChange={(e) => {
                                                updateField('instagram', e.target.value);
                                                setVerified(false);
                                                setMockStats(null);
                                            }}
                                            className="input flex-1"
                                            placeholder="@username или ссылка"
                                        />
                                        {!verified && (
                                            <button
                                                type="button"
                                                onClick={verifyInstagram}
                                                disabled={!formData.instagram || verifying}
                                                className="btn-primary px-4 disabled:opacity-50"
                                            >
                                                {verifying ? 'Проверка...' : 'Проверить'}
                                            </button>
                                        )}
                                        {verified && (
                                            <div className="flex items-center text-success">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {mockStats && (
                                    <div className="card-static animate-slide-up">
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-gray-600">Ваши метрики</span>
                                            <LevelBadge level={mockStats.level} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <div className="text-xl font-bold text-dark">
                                                    {mockStats.followers.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500">Подписчиков</div>
                                            </div>
                                            <div>
                                                <div className="text-xl font-bold text-dark">
                                                    {mockStats.avgLikes.toLocaleString()}
                                                </div>
                                                <div className="text-xs text-gray-500">Ср. лайков</div>
                                            </div>
                                            <div>
                                                <div className="text-xl font-bold text-mixit-pink">
                                                    {mockStats.er}%
                                                </div>
                                                <div className="text-xs text-gray-500">ER</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        TikTok (опционально)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.tiktok}
                                        onChange={(e) => updateField('tiktok', e.target.value)}
                                        className="input"
                                        placeholder="@username или ссылка"
                                    />
                                </div>
                            </>
                        )}

                        {step === 3 && mockStats && (
                            <div className="text-center animate-fade-in">
                                <div className={`w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center bg-gradient-to-br
                  ${mockStats.level === 'beginner' ? 'from-amber-600 to-amber-500' : ''}
                  ${mockStats.level === 'promising' ? 'from-gray-400 to-gray-300' : ''}
                  ${mockStats.level === 'experienced' ? 'from-yellow-500 to-amber-400' : ''}
                  ${mockStats.level === 'advanced' ? 'from-gray-200 to-gray-100' : ''}
                  ${mockStats.level === 'star' ? 'from-cyan-200 to-blue-200' : ''}
                `}>
                                    <span className="text-4xl">
                                        {mockStats.level === 'beginner' && '🥉'}
                                        {mockStats.level === 'promising' && '🥈'}
                                        {mockStats.level === 'experienced' && '🥇'}
                                        {mockStats.level === 'advanced' && '💎'}
                                        {mockStats.level === 'star' && '⭐'}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-bold text-dark mb-2">
                                    {levels[mockStats.level].name}
                                </h2>

                                <p className="text-gray-600 mb-6">
                                    Поздравляем! Вам доступны следующие привилегии:
                                </p>

                                <div className="card-static text-left mb-6">
                                    <ul className="space-y-3">
                                        {levels[mockStats.level].privileges.map((p, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700">{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={() => setStep(step - 1)}
                                    className="btn-secondary flex-1"
                                >
                                    Назад
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={loading || (step === 2 && !verified)}
                                className="btn-primary flex-1 py-4 disabled:opacity-50"
                            >
                                {loading ? 'Создаём...' : step === 3 ? 'Начать работу' : 'Продолжить'}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-gray-600 mt-6">
                        Уже есть аккаунт?{' '}
                        <Link to="/login" className="text-mixit-pink font-medium hover:underline">
                            Войти
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right side - Branding */}
            <div className="hidden lg:flex w-1/2 bg-gradient-mixit items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

                <div className="relative text-center text-white">
                    <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur">
                        <span className="text-5xl font-bold">M</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-4">Присоединяйтесь!</h2>
                    <p className="text-white/80 max-w-sm">
                        Станьте частью большого сообщества beauty-блогеров
                    </p>
                </div>
            </div>
        </div>
    );
}
