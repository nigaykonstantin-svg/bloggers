// Mock collaboration data
export const collaborations = [
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
        id: 2,
        bloggerId: 1,
        status: 'completed',
        products: [2, 17],
        createdAt: '2024-11-01T09:00:00',
        deadline: '2024-11-22T23:59:59',
        shippedAt: '2024-11-03T12:00:00',
        deliveredAt: '2024-11-05T15:30:00',
        deliveryAddress: {
            fullName: 'Анна Иванова',
            phone: '+7 999 123-45-67',
            address: 'ул. Пушкина, д. 10, кв. 25',
            city: 'Москва',
            postalCode: '123456',
        },
        contentUrl: 'https://instagram.com/p/abc123',
        contentSubmittedAt: '2024-11-18T20:00:00',
        rating: 5,
        pointsEarned: 450,
    },
    {
        id: 3,
        bloggerId: 2,
        status: 'shipped',
        products: [3, 5, 10, 18],
        createdAt: '2024-12-08T11:00:00',
        deadline: '2025-01-07T23:59:59',
        shippedAt: '2024-12-10T09:00:00',
        deliveredAt: null,
        deliveryAddress: {
            fullName: 'Мария Петрова',
            phone: '+7 999 987-65-43',
            address: 'Невский пр., д. 100, кв. 50',
            city: 'Санкт-Петербург',
            postalCode: '190000',
        },
        contentUrl: null,
        rating: null,
        pointsEarned: null,
    },
    {
        id: 4,
        bloggerId: 2,
        status: 'completed',
        products: [1, 4, 16, 19],
        createdAt: '2024-10-15T08:00:00',
        deadline: '2024-11-14T23:59:59',
        shippedAt: '2024-10-17T10:00:00',
        deliveredAt: '2024-10-19T14:00:00',
        deliveryAddress: {
            fullName: 'Мария Петрова',
            phone: '+7 999 987-65-43',
            address: 'Невский пр., д. 100, кв. 50',
            city: 'Санкт-Петербург',
            postalCode: '190000',
        },
        contentUrl: 'https://instagram.com/p/xyz789',
        contentSubmittedAt: '2024-11-10T18:00:00',
        rating: 4,
        pointsEarned: 350,
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

export const getCollaborationsByBloggerId = (bloggerId) => {
    return collaborations.filter(c => c.bloggerId === bloggerId);
};

export const getCollaborationById = (id) => {
    return collaborations.find(c => c.id === id);
};

export const getActiveCollaborations = () => {
    return collaborations.filter(c => c.status !== 'completed');
};
