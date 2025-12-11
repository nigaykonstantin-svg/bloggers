import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, adminLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Try admin login first if it looks like admin credentials
        if (email === 'admin@mixit.ru') {
            const adminResult = await adminLogin(email, password);
            if (adminResult.success) {
                navigate('/admin');
                setLoading(false);
                return;
            }
        }

        // Otherwise try blogger login
        const result = await login(email, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
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
                    <h1 className="text-3xl font-bold text-dark mb-2">
                        Добро пожаловать! 👋
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Войдите в свой аккаунт MIXIT Creators
                    </p>

                    {error && (
                        <div className="bg-error/10 text-error px-4 py-3 rounded-xl mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Пароль
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input pr-12"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-4 disabled:opacity-50"
                        >
                            {loading ? 'Входим...' : 'Войти'}
                        </button>
                    </form>

                    <p className="text-center text-gray-600 mt-6">
                        Нет аккаунта?{' '}
                        <Link to="/register" className="text-mixit-pink font-medium hover:underline">
                            Зарегистрироваться
                        </Link>
                    </p>

                    {/* Demo credentials */}
                    <div className="mt-8 p-4 bg-gray-100 rounded-xl">
                        <p className="text-sm text-gray-600 font-medium mb-2">Демо-доступ:</p>
                        <div className="text-sm text-gray-500 space-y-1">
                            <p>Блогер: <code className="bg-white px-2 py-0.5 rounded">anna@example.com</code> / <code className="bg-white px-2 py-0.5 rounded">password123</code></p>
                            <p>Админ: <code className="bg-white px-2 py-0.5 rounded">admin@mixit.ru</code> / <code className="bg-white px-2 py-0.5 rounded">admin123</code></p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.clear();
                                window.location.reload();
                            }}
                            className="mt-3 w-full text-sm text-gray-500 hover:text-mixit-pink underline"
                        >
                            🔄 Сбросить демо-данные
                        </button>
                    </div>
                </div>
            </div>

            {/* Right side - Image/Branding */}
            <div className="hidden lg:flex w-1/2 bg-gradient-mixit items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

                <div className="relative text-center text-white">
                    <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur">
                        <span className="text-5xl font-bold">M</span>
                    </div>
                    <h2 className="text-4xl font-bold mb-4">MIXIT Creators</h2>
                    <p className="text-white/80 max-w-sm">
                        Платформа для творческих блогеров, которые любят красоту
                    </p>
                </div>
            </div>
        </div>
    );
}
