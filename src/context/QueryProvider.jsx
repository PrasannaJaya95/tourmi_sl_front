import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Don't refetch when user switches browser tabs — avoids hammering Render
            refetchOnWindowFocus: false,
            // Don't refetch when component remounts (navigation back to same page = instant)
            refetchOnMount: false,
            // Retry once with exponential backoff before showing error
            retry: 1,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
            // Data is "fresh" for 10 minutes — no background refetch within this window
            staleTime: 1000 * 60 * 10,
            // Keep data in memory for 30 minutes after last subscriber unmounts
            // → navigating back to Contracts/Vehicles page feels instant
            gcTime: 1000 * 60 * 30,
        },
    },
});

export const QueryProvider = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

