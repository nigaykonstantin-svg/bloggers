import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, Camera, ExternalLink, Calendar } from 'lucide-react';
import { useCollaborations, statusLabels, statusColors } from '../data/collaborations';
import { getProductById } from '../data/products';
import CountdownTimer from '../components/ui/CountdownTimer';

const statusSteps = [
    { id: 'pending', icon: Clock, label: 'Создана' },
    { id: 'shipped', icon: Truck, label: 'Отправлена' },
    { id: 'waiting_content', icon: Camera, label: 'Ожидает контент' }, // delivered transitions here
    { id: 'completed', icon: CheckCircle, label: 'Завершено' },
];

export default function CollaborationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { collaborations, updateCollaborationStatus, markAsDelivered } = useCollaborations();

    // Find collab from context instead of direct import
    const collab = collaborations.find(c => c.id === parseInt(id));

    const [contentUrl, setContentUrl] = useState(collab?.contentUrl || '');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!collab) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Коллаборация не найдена</p>
                <button onClick={() => navigate('/dashboard')} className="mt-4 btn-primary">
                    На главную
                </button>
            </div>
        );
    }

    const products = collab.products.map(id => getProductById(id)).filter(Boolean);

    // Map status to step index
    const getStepIndex = (status) => {
        if (status === 'pending') return 0;
        if (status === 'shipped') return 1;
        if (status === 'delivered') return 2; // Delivered means waiting for content mostly
        if (status === 'waiting_content') return 2;
        if (status === 'completed') return 3;
        return 0;
    };

    const currentStepIndex = getStepIndex(collab.status);

    const handleSubmitContent = async (e) => {
        e.preventDefault();
        if (!contentUrl) return;

        setSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update via context
        updateCollaborationStatus(collab.id, 'waiting_content', { contentUrl });

        setSubmitted(true);
        setSubmitting(false);
    };

    const handleConfirmDelivery = () => {
        if (confirm('Подтверждаете получение посылки? Начнётся отсчёт дедлайна.')) {
            markAsDelivered(collab.id);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-mixit-pink"
            >
                <ArrowLeft className="w-4 h-4" />
                Назад
            </button>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark">Коллаборация #{collab.id}</h1>
                    <p className="text-gray-500 mt-1">
                        Создана {new Date(collab.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                </div>
                <span className={statusColors[collab.status]}>
                    {statusLabels[collab.status]}
                </span>
            </div>

            {/* Progress Tracker */}
            <div className="card-static overflow-hidden">
                <div className="relative flex justify-between px-2">
                    {/* Connecting Line */}
                    <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 -z-10" />
                    <div
                        className="absolute top-5 left-0 h-1 bg-mixit-pink -z-10 transition-all duration-500"
                        style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                    />

                    {statusSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const StepIcon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted
                                        ? 'bg-mixit-pink border-mixit-pink text-white shadow-lg shadow-mixit-pink/20'
                                        : 'bg-white border-gray-200 text-gray-400'
                                    }`}>
                                    <StepIcon className="w-5 h-5" />
                                </div>
                                <div className="text-center">
                                    <p className={`text-xs font-semibold ${isCompleted ? 'text-dark' : 'text-gray-400'}`}>
                                        {step.label}
                                    </p>
                                    {/* Dates */}
                                    {index === 0 && <p className="text-[10px] text-gray-500">{new Date(collab.createdAt).toLocaleDateString('ru-RU')}</p>}
                                    {index === 1 && collab.shippedAt && <p className="text-[10px] text-gray-500">{new Date(collab.shippedAt).toLocaleDateString('ru-RU')}</p>}
                                    {index === 2 && collab.deliveredAt && <p className="text-[10px] text-gray-500">{new Date(collab.deliveredAt).toLocaleDateString('ru-RU')}</p>}
                                    {index === 3 && collab.status === 'completed' && <p className="text-[10px] text-gray-500">Завершено</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Current Action Banner */}
                <div className="mt-8 bg-gray-50 rounded-xl p-4 flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        {collab.status === 'pending' && <Clock className="w-5 h-5 text-gray-500" />}
                        {collab.status === 'shipped' && <Truck className="w-5 h-5 text-blue-500" />}
                        {collab.status === 'waiting_content' && <Camera className="w-5 h-5 text-mixit-pink" />}
                        {collab.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-dark">
                            {collab.status === 'pending' && 'Заявка на рассмотрении'}
                            {collab.status === 'shipped' && 'Посылка в пути'}
                            {collab.status === 'waiting_content' && 'Ожидаем ваш контент'}
                            {collab.status === 'completed' && 'Коллаборация завершена'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {collab.status === 'pending' && 'Администратор скоро проверит вашу заявку и отправит товары.'}
                            {collab.status === 'shipped' && 'Товары отправлены. Когда получите посылку, подтвердите доставку нажатием кнопки ниже.'}
                            {collab.status === 'waiting_content' && 'Снимите контент, выложите его в соцсети и прикрепите ссылку здесь.'}
                            {collab.status === 'completed' && `Отличная работа! Вы заработали ${collab.pointsEarned} очков.`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Confirm Delivery Button */}
            {collab.status === 'shipped' && (
                <div className="card-static bg-blue-50 border border-blue-100 text-center">
                    <h3 className="font-semibold text-blue-900 mb-2">Получили посылку?</h3>
                    <p className="text-sm text-blue-700 mb-4">
                        Подтвердите получение, чтобы начать отсчёт времени на создание контента.
                    </p>
                    <button
                        onClick={handleConfirmDelivery}
                        className="btn bg-blue-600 text-white hover:bg-blue-700 w-full sm:w-auto"
                    >
                        <Package className="w-4 h-4 mr-2" />
                        Я получил(а) посылку
                    </button>
                </div>
            )}

            {/* Deadline Timer */}
            {collab.status === 'waiting_content' && (
                <div className="card-static bg-gradient-to-r from-mixit-pink/5 to-transparent">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-dark">Дедлайн контента</h3>
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(collab.deadline).toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </p>
                        </div>
                        <CountdownTimer deadline={collab.deadline} />
                    </div>
                </div>
            )}

            {/* Products */}
            <div className="card-static">
                <h3 className="font-semibold text-dark mb-4">Продукты ({products.length})</h3>
                <div className="space-y-3">
                    {products.map(product => (
                        <div key={product.id} className="flex items-center gap-4">
                            <img
                                src={product.image}
                                alt={product.name}
                                className="w-16 h-16 rounded-xl object-cover"
                            />
                            <div>
                                <p className="font-medium text-dark">{product.name}</p>
                                <p className="text-sm text-gray-500">{product.volume}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Submit Content */}
            {collab.status === 'waiting_content' && !submitted && !collab.contentUrl && (
                <div className="card-static">
                    <h3 className="font-semibold text-dark mb-4">Загрузить контент</h3>
                    <form onSubmit={handleSubmitContent} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ссылка на публикацию
                            </label>
                            <input
                                type="url"
                                value={contentUrl}
                                onChange={(e) => setContentUrl(e.target.value)}
                                className="input"
                                placeholder="https://instagram.com/p/..."
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn-primary w-full disabled:opacity-50"
                        >
                            {submitting ? 'Отправляем...' : 'Отправить на проверку'}
                        </button>
                    </form>
                </div>
            )}

            {(submitted || collab.contentUrl) && collab.status !== 'completed' && (
                <div className="card-static bg-success/5 border border-success/20">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-success" />
                        <div>
                            <p className="font-medium text-dark">Контент отправлен!</p>
                            <p className="text-sm text-gray-500">Ожидайте проверку модератора</p>
                        </div>
                    </div>
                    <div className="mt-4 pl-9">
                        <a
                            href={contentUrl || collab.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-mixit-pink hover:underline"
                        >
                            <ExternalLink className="w-4 h-4" />
                            {contentUrl || collab.contentUrl}
                        </a>
                    </div>
                </div>
            )}

            {/* Completed Rating */}
            {collab.status === 'completed' && collab.rating && (
                <div className="card-static">
                    <h3 className="font-semibold text-dark mb-4">Оценка контента</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`text-2xl ${star <= collab.rating ? 'text-gold' : 'text-gray-200'}`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                        <div>
                            <p className="font-medium text-success">+{collab.pointsEarned} очков</p>
                        </div>
                    </div>
                    {collab.contentUrl && (
                        <a
                            href={collab.contentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-4 text-mixit-pink hover:underline"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Посмотреть публикацию
                        </a>
                    )}
                </div>
            )}

            {/* Delivery Address */}
            <div className="card-static">
                <h3 className="font-semibold text-dark mb-4">Адрес доставки</h3>
                <div className="text-gray-600 space-y-1">
                    <p className="font-medium text-dark">{collab.deliveryAddress?.fullName}</p>
                    <p>{collab.deliveryAddress?.phone}</p>
                    <p>{collab.deliveryAddress?.address}</p>
                    <p>{collab.deliveryAddress?.city}, {collab.deliveryAddress?.postalCode}</p>
                    {collab.deliveryAddress?.comment && (
                        <p className="text-sm text-gray-500 mt-2">
                            💬 {collab.deliveryAddress.comment}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
