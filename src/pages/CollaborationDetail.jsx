import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, Camera, ExternalLink } from 'lucide-react';
import { getCollaborationById, statusLabels, statusColors } from '../data/collaborations';
import { getProductById } from '../data/products';
import CountdownTimer from '../components/ui/CountdownTimer';

const statusSteps = [
    { id: 'pending', icon: Clock, label: 'Ожидает отправки' },
    { id: 'shipped', icon: Truck, label: 'В пути' },
    { id: 'delivered', icon: Package, label: 'Доставлено' },
    { id: 'waiting_content', icon: Camera, label: 'Ожидает контент' },
    { id: 'completed', icon: CheckCircle, label: 'Завершено' },
];

export default function CollaborationDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const collab = getCollaborationById(parseInt(id));

    const [contentUrl, setContentUrl] = useState(collab?.contentUrl || '');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!collab) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Коллаборация не найдена</p>
            </div>
        );
    }

    const products = collab.products.map(id => getProductById(id)).filter(Boolean);

    const currentStepIndex = statusSteps.findIndex(s => s.id === collab.status);

    const handleSubmitContent = async (e) => {
        e.preventDefault();
        if (!contentUrl) return;

        setSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSubmitted(true);
        setSubmitting(false);
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

            {/* Status Timeline */}
            <div className="card-static">
                <div className="flex items-center justify-between mb-4">
                    {statusSteps.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const StepIcon = step.icon;

                        return (
                            <div key={step.id} className="flex flex-col items-center flex-1 relative">
                                {index > 0 && (
                                    <div className={`absolute top-5 right-1/2 w-full h-0.5 -z-10 ${isCompleted ? 'bg-mixit-pink' : 'bg-gray-200'
                                        }`} />
                                )}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${isCompleted || isCurrent
                                        ? 'bg-mixit-pink text-white'
                                        : 'bg-gray-200 text-gray-400'
                                    }`}>
                                    <StepIcon className="w-5 h-5" />
                                </div>
                                <span className={`text-xs mt-2 text-center ${isCurrent ? 'text-mixit-pink font-medium' : 'text-gray-500'
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Deadline Timer */}
            {(collab.status === 'waiting_content' || collab.status === 'delivered') && (
                <div className="card-static bg-gradient-to-r from-mixit-pink/5 to-transparent">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-dark">Дедлайн контента</h3>
                            <p className="text-sm text-gray-500">
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
            {(collab.status === 'waiting_content' || collab.status === 'delivered') && !submitted && (
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

            {(submitted || collab.contentUrl) && (
                <div className="card-static bg-success/5 border border-success/20">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-success" />
                        <div>
                            <p className="font-medium text-dark">Контент отправлен!</p>
                            <p className="text-sm text-gray-500">Ожидайте проверку модератора</p>
                        </div>
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
                    <p className="font-medium text-dark">{collab.deliveryAddress.fullName}</p>
                    <p>{collab.deliveryAddress.phone}</p>
                    <p>{collab.deliveryAddress.address}</p>
                    <p>{collab.deliveryAddress.city}, {collab.deliveryAddress.postalCode}</p>
                    {collab.deliveryAddress.comment && (
                        <p className="text-sm text-gray-500 mt-2">
                            💬 {collab.deliveryAddress.comment}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
