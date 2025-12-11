import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, User, MessageSquare, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCollaborations } from '../data/collaborations';
import { levels } from '../data/levels';

export default function NewCollaboration() {
    const { items, clearCart } = useCart();
    const { user } = useAuth();
    const { createCollaboration } = useCollaborations();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        fullName: `${user?.firstName || ''} ${user?.lastName || ''}`,
        phone: '',
        city: user?.city || '',
        address: '',
        postalCode: '',
        comment: '',
    });

    const currentLevel = levels[user?.level];
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (currentLevel?.deadlineDays || 14));

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Create collaboration with shared context
        const productIds = items.map(item => item.id);
        createCollaboration(
            user?.id || Date.now(),
            productIds,
            formData,
            deadline.toISOString()
        );

        // Simulate small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        setSuccess(true);
        setLoading(false);

        // Clear cart after success
        setTimeout(() => {
            clearCart();
            navigate('/collaborations');
        }, 2000);
    };

    if (items.length === 0 && !success) {
        navigate('/products');
        return null;
    }

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center animate-fade-in">
                <div className="text-center">
                    <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <Check className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-dark mb-2">Заявка отправлена!</h1>
                    <p className="text-gray-600 mb-6">
                        Мы скоро отправим ваши продукты
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-mixit-pink"
            >
                <ArrowLeft className="w-4 h-4" />
                Назад к продуктам
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold text-dark">Оформление коллаборации</h1>

            {/* Selected Products */}
            <div className="card-static">
                <h2 className="font-semibold text-dark mb-4">Выбранные продукты ({items.length})</h2>
                <div className="space-y-3">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-4">
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 rounded-xl object-cover"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-dark truncate">{item.name}</p>
                                <p className="text-sm text-gray-500">{item.volume}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Срок на создание контента:</span>
                        <span className="font-semibold text-dark">{currentLevel?.deadlineDays} дней</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600">Дедлайн:</span>
                        <span className="font-semibold text-mixit-pink">
                            {deadline.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Delivery Form */}
            <form onSubmit={handleSubmit} className="card-static space-y-5">
                <h2 className="font-semibold text-dark">Адрес доставки</h2>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        ФИО получателя
                    </label>
                    <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        className="input"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        Телефон
                    </label>
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="input"
                        placeholder="+7 999 123-45-67"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Город
                        </label>
                        <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => updateField('city', e.target.value)}
                            className="input"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Индекс
                        </label>
                        <input
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => updateField('postalCode', e.target.value)}
                            className="input"
                            placeholder="123456"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Адрес
                    </label>
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => updateField('address', e.target.value)}
                        className="input"
                        placeholder="ул. Пушкина, д. 10, кв. 25"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        Комментарий для курьера
                    </label>
                    <textarea
                        value={formData.comment}
                        onChange={(e) => updateField('comment', e.target.value)}
                        className="input resize-none"
                        rows={3}
                        placeholder="Домофон, код подъезда и т.д."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 disabled:opacity-50"
                >
                    {loading ? 'Отправляем заявку...' : 'Подтвердить заявку'}
                </button>
            </form>
        </div>
    );
}
