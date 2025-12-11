import { achievements, getAchievementById } from '../data/achievements';
import { useAuth } from '../context/AuthContext';

export default function Achievements() {
    const { user } = useAuth();
    const userAchievements = user?.achievements || [];

    const allAchievements = Object.values(achievements);
    const unlockedCount = userAchievements.length;
    const totalCount = allAchievements.length;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-dark">Достижения</h1>
                <p className="text-gray-600 mt-1">
                    Разблокировано {unlockedCount} из {totalCount}
                </p>
            </div>

            {/* Progress */}
            <div className="card-static">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-dark">Прогресс</span>
                    <span className="text-mixit-pink font-semibold">
                        {Math.round((unlockedCount / totalCount) * 100)}%
                    </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-mixit rounded-full transition-all duration-500"
                        style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
                    />
                </div>
            </div>

            {/* Achievement Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allAchievements.map(achievement => {
                    const isUnlocked = userAchievements.includes(achievement.id);

                    return (
                        <div
                            key={achievement.id}
                            className={`card-static relative overflow-hidden ${isUnlocked ? '' : 'opacity-50 grayscale'
                                }`}
                        >
                            {isUnlocked && (
                                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                                    <div className="absolute top-2 right-[-20px] bg-success text-white text-xs px-8 py-1 rotate-45 shadow">
                                        ✓
                                    </div>
                                </div>
                            )}

                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center mb-4 shadow-lg`}>
                                <span className="text-3xl">{achievement.icon}</span>
                            </div>

                            <h3 className="font-semibold text-dark mb-1">{achievement.name}</h3>
                            <p className="text-sm text-gray-500">{achievement.description}</p>

                            {!isUnlocked && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">🔒 Ещё не разблокировано</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Tips */}
            <div className="card-static bg-gradient-to-r from-gold/5 to-transparent">
                <h3 className="font-semibold text-dark mb-2">💡 Советы</h3>
                <ul className="text-sm text-gray-600 space-y-2">
                    <li>• Сдавайте контент вовремя, чтобы получить значок "Пунктуальный"</li>
                    <li>• Создавайте вирусный контент с высоким ER для значка "Виральный"</li>
                    <li>• Выполните 10 коллабораций, чтобы стать "Лояльным"</li>
                </ul>
            </div>
        </div>
    );
}
