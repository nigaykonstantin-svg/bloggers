import { levels } from '../../data/levels';

export default function LevelBadge({ level, size = 'md' }) {
    const levelData = levels[level];

    if (!levelData) return null;

    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
    };

    const badgeClass = `badge-${levelData.color}`;

    return (
        <span className={`badge ${badgeClass} ${sizeClasses[size]}`}>
            {levelData.name}
        </span>
    );
}
