import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`skeleton ${className}`} />
);

export const CardSkeleton: React.FC = () => (
    <div className="card p-5 flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-2xl" />
        <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    </div>
);
