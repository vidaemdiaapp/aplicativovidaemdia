import React, { useState, useEffect } from 'react';

interface CountUpProps {
    value: number;
    duration?: number;
    formatter?: (val: number) => string;
    className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
    value,
    duration = 1000,
    formatter = (val) => val.toString(),
    className = ""
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        const totalFrames = Math.round(duration / 16); // 60fps
        let frame = 0;

        const timer = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const easeOutQuad = progress * (2 - progress);
            const current = start + (end - start) * easeOutQuad;

            setDisplayValue(current);

            if (frame === totalFrames) {
                setDisplayValue(end);
                clearInterval(timer);
            }
        }, 16);

        return () => clearInterval(timer);
    }, [value, duration]);

    return <span className={className}>{formatter(displayValue)}</span>;
};
