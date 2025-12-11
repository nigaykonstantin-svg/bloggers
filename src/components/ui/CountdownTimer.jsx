import { useState, useEffect } from 'react';

export default function CountdownTimer({ deadline, compact = false }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = new Date(deadline) - new Date();

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
            expired: false,
        };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [deadline]);

    if (timeLeft.expired) {
        return (
            <div className="text-error font-medium">
                Срок истёк
            </div>
        );
    }

    if (compact) {
        return (
            <div className="text-sm font-medium text-gray-700">
                {timeLeft.days}д {timeLeft.hours}ч {timeLeft.minutes}м
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <div className="timer-box">
                <span className="timer-value">{timeLeft.days}</span>
                <span className="timer-label">дней</span>
            </div>
            <div className="timer-box">
                <span className="timer-value">{timeLeft.hours}</span>
                <span className="timer-label">часов</span>
            </div>
            <div className="timer-box">
                <span className="timer-value">{timeLeft.minutes}</span>
                <span className="timer-label">минут</span>
            </div>
            <div className="timer-box">
                <span className="timer-value">{timeLeft.seconds}</span>
                <span className="timer-label">секунд</span>
            </div>
        </div>
    );
}
