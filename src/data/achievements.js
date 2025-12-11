// Achievement definitions
export const achievements = {
    first_content: {
        id: 'first_content',
        name: 'Первый контент',
        description: 'Первая успешная коллаборация',
        icon: '🎉',
        color: 'from-pink-500 to-rose-500',
    },
    punctual: {
        id: 'punctual',
        name: 'Пунктуальный',
        description: '5 коллабораций вовремя подряд',
        icon: '⏰',
        color: 'from-blue-500 to-cyan-500',
    },
    viral: {
        id: 'viral',
        name: 'Виральный',
        description: 'Контент набрал 2x от среднего ER',
        icon: '🔥',
        color: 'from-orange-500 to-amber-500',
    },
    loyal: {
        id: 'loyal',
        name: 'Лояльный',
        description: '10 коллабораций за всё время',
        icon: '💎',
        color: 'from-purple-500 to-violet-500',
    },
    sprinter: {
        id: 'sprinter',
        name: 'Спринтер',
        description: 'Сдал контент за 3 дня',
        icon: '⚡',
        color: 'from-yellow-500 to-lime-500',
    },
    category_expert: {
        id: 'category_expert',
        name: 'Эксперт категории',
        description: '5 коллабораций в одной категории',
        icon: '👑',
        color: 'from-indigo-500 to-blue-500',
    },
};

export const getAchievementById = (id) => achievements[id];
