export default function ProgressBar({ value, max = 100, showLabel = true, className = '' }) {
    const percentage = Math.min(100, (value / max) * 100);

    return (
        <div className={className}>
            <div className="progress-bar">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{value.toLocaleString()}</span>
                    <span>{max.toLocaleString()}</span>
                </div>
            )}
        </div>
    );
}
