// Level system configuration
export const levels = {
    beginner: {
        id: 'beginner',
        name: 'Начинающий',
        nameEn: 'Beginner',
        color: 'bronze',
        minFollowers: 1000,
        maxFollowers: 10000,
        minER: 3.0,
        productLimit: { min: 2, max: 4 },
        deadlineDays: 14,
        collaborationsPerMonth: 2,
        maxActiveCollabs: 1,
        cooldownDays: 14,
        privileges: [
            'Выбор 2-4 продуктов из базовой линейки',
            'Срок на создание контента: 14 дней',
            'До 2 коллабораций в месяц',
            'Перерыв между заявками: 14 дней',
        ],
        pointsToNext: 1000,
    },
    promising: {
        id: 'promising',
        name: 'Подающий надежды',
        nameEn: 'Promising',
        color: 'silver',
        minFollowers: 10000,
        maxFollowers: 50000,
        minER: 4.0,
        productLimit: { min: 3, max: 5 },
        deadlineDays: 21,
        collaborationsPerMonth: 3,
        maxActiveCollabs: 2,
        cooldownDays: 10,
        privileges: [
            'Выбор 3-5 продуктов включая новинки',
            'Срок на создание контента: 21 день',
            'До 3 коллабораций в месяц',
            'Ранний доступ к лимитированным продуктам',
        ],
        pointsToNext: 2500,
    },
    experienced: {
        id: 'experienced',
        name: 'Опытный',
        nameEn: 'Experienced',
        color: 'gold',
        minFollowers: 50000,
        maxFollowers: 150000,
        minER: 3.5,
        productLimit: { min: 4, max: 6 },
        deadlineDays: 30,
        collaborationsPerMonth: 4,
        maxActiveCollabs: 2,
        cooldownDays: 7,
        privileges: [
            'Выбор 4-6 продуктов любой линейки',
            'Срок на создание контента: 30 дней',
            'До 4 коллабораций в месяц',
            'Репост в официальном аккаунте MIXIT',
        ],
        pointsToNext: 5000,
    },
    advanced: {
        id: 'advanced',
        name: 'Продвинутый',
        nameEn: 'Advanced',
        color: 'platinum',
        minFollowers: 150000,
        maxFollowers: 500000,
        minER: 3.0,
        productLimit: { min: 6, max: 8 },
        deadlineDays: 45,
        collaborationsPerMonth: 6,
        maxActiveCollabs: 3,
        cooldownDays: 5,
        privileges: [
            'Выбор до 8 продуктов',
            'Гибкий срок (до 45 дней)',
            'До 6 коллабораций в месяц',
            'Персональный менеджер',
        ],
        pointsToNext: 10000,
    },
    star: {
        id: 'star',
        name: 'Звезда',
        nameEn: 'Star',
        color: 'diamond',
        minFollowers: 500000,
        maxFollowers: Infinity,
        minER: 2.5,
        productLimit: { min: 10, max: Infinity },
        deadlineDays: 60,
        collaborationsPerMonth: Infinity,
        maxActiveCollabs: Infinity,
        cooldownDays: 0,
        privileges: [
            'Полный каталог без ограничений',
            'Неограниченные коллаборации',
            'Участие в съёмках бренда',
            'Амбассадорский контракт',
        ],
        pointsToNext: null,
    },
};

export const levelOrder = ['beginner', 'promising', 'experienced', 'advanced', 'star'];

// Calculate level based on followers and ER
export function calculateLevel(followers, er) {
    for (const levelId of [...levelOrder].reverse()) {
        const level = levels[levelId];
        if (followers >= level.minFollowers && er >= level.minER) {
            return levelId;
        }
    }
    return 'beginner';
}

// Calculate ER from engagement metrics
export function calculateER(likes, comments, followers) {
    if (followers === 0) return 0;
    return ((likes + comments) / followers) * 100;
}

// Get progress to next level
export function getLevelProgress(currentLevel, points) {
    const level = levels[currentLevel];
    if (!level.pointsToNext) return 100;
    return Math.min(100, (points / level.pointsToNext) * 100);
}

// Get next level
export function getNextLevel(currentLevel) {
    const currentIndex = levelOrder.indexOf(currentLevel);
    if (currentIndex < levelOrder.length - 1) {
        return levels[levelOrder[currentIndex + 1]];
    }
    return null;
}

// Check if blogger can access product
export function canAccessProduct(bloggerLevel, productMinLevel) {
    const bloggerLevelIndex = levelOrder.indexOf(bloggerLevel);
    const productLevelIndex = levelOrder.indexOf(productMinLevel);
    return bloggerLevelIndex >= productLevelIndex;
}
