import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/app/lib/api-client';
import { User } from '@/app/model/entities';

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...userKeys.lists(), filters] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
};

async function fetchUsers(): Promise<User[]> {
    return apiClient('/users');
}

// Protected endpoint
async function fetchUserProfile(): Promise<User> {
    return apiClient('/users/me', { requiresAuth: true });
}

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
    });
}

export function useUserProfile() {
    return useQuery({
        queryKey: ['user', 'profile'],
        queryFn: fetchUserProfile,
        retry: (failureCount, error: any) => {
            // Don't retry on auth errors
            if (error?.status === 401) return false;
            return failureCount < 3;
        },
    });
}