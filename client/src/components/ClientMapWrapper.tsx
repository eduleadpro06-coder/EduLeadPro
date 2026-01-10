import React, { useState, useEffect, Suspense } from 'react';

// Use React.lazy to import the actual map component
const AdminMap = React.lazy(() => import('./SimpleMap'));

interface ClientMapWrapperProps {
    activeBuses: any[];
}

export default function ClientMapWrapper({ activeBuses }: ClientMapWrapperProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-100">
                <p className="text-gray-500">Loading map...</p>
            </div>
        );
    }

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full bg-gray-100">
                <p className="text-gray-500">Loading map resources...</p>
            </div>
        }>
            <AdminMap activeBuses={activeBuses} />
        </Suspense>
    );
}
