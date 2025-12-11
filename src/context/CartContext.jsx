import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { levels } from '../data/levels';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const { user } = useAuth();

    const getMaxProducts = () => {
        if (!user) return 0;
        const level = levels[user.level];
        return level?.productLimit?.max || 4;
    };

    const addItem = (product) => {
        if (items.length >= getMaxProducts()) {
            return { success: false, error: `Максимум ${getMaxProducts()} продуктов для вашего уровня` };
        }

        if (items.find(item => item.id === product.id)) {
            return { success: false, error: 'Продукт уже в корзине' };
        }

        setItems(prev => [...prev, product]);
        return { success: true };
    };

    const removeItem = (productId) => {
        setItems(prev => prev.filter(item => item.id !== productId));
    };

    const clearCart = () => {
        setItems([]);
    };

    const isInCart = (productId) => {
        return items.some(item => item.id === productId);
    };

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            clearCart,
            isInCart,
            maxProducts: getMaxProducts(),
            canAddMore: items.length < getMaxProducts(),
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
}
