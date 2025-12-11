import { Check, Plus, Lock } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { canAccessProduct, levelOrder } from '../../data/levels';

export default function ProductCard({ product, showAddButton = true }) {
    const { addItem, removeItem, isInCart, canAddMore } = useCart();
    const { user } = useAuth();

    const inCart = isInCart(product.id);
    const canAccess = user ? canAccessProduct(user.level, product.minLevel) : false;

    const handleClick = () => {
        if (!canAccess) return;

        if (inCart) {
            removeItem(product.id);
        } else {
            addItem(product);
        }
    };

    return (
        <div className={`product-card ${!canAccess ? 'opacity-60' : ''}`}>
            <div className="relative aspect-square overflow-hidden">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                />
                {!canAccess && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-center text-white p-4">
                            <Lock className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Доступно с уровня</p>
                            <p className="font-semibold capitalize">{product.minLevel}</p>
                        </div>
                    </div>
                )}
                {canAccess && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-mixit-pink">
                        ⭐ {product.popularity}%
                    </div>
                )}
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-dark mb-1 line-clamp-2">
                    {product.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                    {product.volume}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {product.description}
                </p>

                {showAddButton && canAccess && (
                    <button
                        onClick={handleClick}
                        disabled={!canAddMore && !inCart}
                        className={`w-full py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2
              ${inCart
                                ? 'bg-success text-white'
                                : canAddMore
                                    ? 'bg-mixit-pink text-white hover:bg-mixit-pink-dark'
                                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {inCart ? (
                            <>
                                <Check className="w-4 h-4" />
                                В корзине
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Добавить
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
