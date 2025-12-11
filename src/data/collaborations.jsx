import { createContext, useContext, useState, useEffect } from 'react';

// Default collaborations data
const defaultCollaborations = [
    {
        id: 1,
        bloggerId: 1,
        status: 'waiting_content',
        products: [1, 6, 11],
        createdAt: '2024-12-01T10:00:00',
        deadline: '2024-12-22T23:59:59',
        shippedAt: '2024-12-03T14:30:00',
        deliveredAt: '2024-12-06T11:20:00',
        deliveryAddress: {
            fullName: 'Анна Иванова',
            phone: '+7 999 123-45-67',
            address: 'ул. Пушкина, д. 10, кв. 25',
            city: 'Москва',
            postalCode: '123456',
            comment: 'Домофон 25',
        },
        contentUrl: null,
        rating: null,
        pointsEarned: null,
    },
    {
        id: 5,
        bloggerId: 4,
        status: 'pending',
        products: [2, 5, 8, 13, 17, 20],
        createdAt: '2024-12-11T12:00:00',
        deadline: '2025-01-25T23:59:59',
        shippedAt: null,
        deliveredAt: null,
        deliveryAddress: {
            fullName: 'София Козлова',
            phone: '+7 999 555-44-33',
            address: 'ул. Ленина, д. 50',
            city: 'Новосибирск',
            postalCode: '630000',
        },
        contentUrl: null,
        rating: null,
        pointsEarned: null,
    },
];

export const statusLabels = {
    pending: 'Ожидает отправки',
    shipped: 'В пути',
    delivered: 'Доставлено',
    waiting_content: 'Ожидает контент',
    completed: 'Завершено',
};

export const statusColors = {
    pending: 'status-pending',
    shipped: 'status-shipped',
    delivered: 'status-delivered',
    waiting_content: 'status-waiting',
    completed: 'status-completed',
};

const CollaborationsContext = createContext(null);

// Get stored collaborations or use defaults
const getStoredCollaborations = () => {
    const stored = localStorage.getItem('mixit_collaborations');
    if (stored) {
        return JSON.parse(stored);
    }
    return defaultCollaborations;
};

export function CollaborationsProvider({ children }) {
    const [collaborations, setCollaborations] = useState(getStoredCollaborations);

    // Save to localStorage whenever collaborations change
    useEffect(() => {
        localStorage.setItem('mixit_collaborations', JSON.stringify(collaborations));
    }, [collaborations]);

    // Create new collaboration
    const createCollaboration = (bloggerId, products, deliveryAddress, deadline) => {
        const newCollab = {
            id: Date.now(),
            bloggerId,
            status: 'pending',
            products,
            createdAt: new Date().toISOString(),
            deadline: deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            shippedAt: null,
            deliveredAt: null,
            deliveryAddress,
            contentUrl: null,
            rating: null,
            pointsEarned: null,
        };
        setCollaborations(prev => [newCollab, ...prev]);
        return newCollab;
    };

    // Update collaboration status
    const updateCollaborationStatus = (id, status, additionalData = {}) => {
        setCollaborations(prev => prev.map(c =>
            c.id === id ? { ...c, status, ...additionalData } : c
        ));
    };

    // Mark as shipped
    const markAsShipped = (id) => {
        updateCollaborationStatus(id, 'shipped', { shippedAt: new Date().toISOString() });
    };

    // Mark as delivered
    const markAsDelivered = (id) => {
        updateCollaborationStatus(id, 'delivered', { deliveredAt: new Date().toISOString() });
    };

    // Submit content
    const submitContent = (id, contentUrl) => {
        updateCollaborationStatus(id, 'waiting_content', {
            contentUrl,
            contentSubmittedAt: new Date().toISOString()
        });
    };

    // Complete and rate
    const completeCollaboration = (id, rating) => {
        const points = rating * 50 + 100;
        updateCollaborationStatus(id, 'completed', { rating, pointsEarned: points });
    };

    // Get collaborations for a blogger
    const getCollaborationsByBloggerId = (bloggerId) => {
        return collaborations.filter(c => c.bloggerId === bloggerId);
    };

    // Get single collaboration
    const getCollaborationById = (id) => {
        return collaborations.find(c => c.id === parseInt(id));
    };

    // Get active collaborations
    const getActiveCollaborations = () => {
        return collaborations.filter(c => c.status !== 'completed');
    };

    // Get pending collaborations (for admin)
    const getPendingCollaborations = () => {
        return collaborations.filter(c => c.status === 'pending');
    };

    return (
        <CollaborationsContext.Provider value={{
            collaborations,
            createCollaboration,
            updateCollaborationStatus,
            markAsShipped,
            markAsDelivered,
            submitContent,
            completeCollaboration,
            getCollaborationsByBloggerId,
            getCollaborationById,
            getActiveCollaborations,
            getPendingCollaborations,
        }}>
            {children}
        </CollaborationsContext.Provider>
    );
}

export function useCollaborations() {
    const context = useContext(CollaborationsContext);
    if (!context) {
        throw new Error('useCollaborations must be used within CollaborationsProvider');
    }
    return context;
}

// Legacy exports for backward compatibility
export const collaborations = getStoredCollaborations();
export const getCollaborationsByBloggerId = (bloggerId) => collaborations.filter(c => c.bloggerId === bloggerId);
export const getCollaborationById = (id) => collaborations.find(c => c.id === id);
export const getActiveCollaborations = () => collaborations.filter(c => c.status !== 'completed');
