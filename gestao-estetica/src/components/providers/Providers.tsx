'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { Toaster } from 'sonner'
import AuthProvider from '@/components/providers/AuthProvider'

interface ProvidersProps {
    children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes
                gcTime: 10 * 60 * 1000, // 10 minutes
                retry: (failureCount, error: any) => {
                    if (error?.status === 401 || error?.status === 403) {
                        return false
                    }
                    return failureCount < 3
                },
                refetchOnWindowFocus: false,
            },
            mutations: {
                retry: false,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}

                <Toaster
                    position="top-right"
                    richColors
                    expand={true}
                    duration={4000}
                    closeButton
                />
            </AuthProvider>
        </QueryClientProvider>
    )
}