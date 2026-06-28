import { useQuery } from '@tanstack/react-query'
import { badgesApi } from '@/api/endpoints/badges'

export function useMyBadges() {
  return useQuery({ queryKey: ['my-badges'], queryFn: () => badgesApi.getMy() })
}

export function useUserBadges(userId: string) {
  return useQuery({
    queryKey: ['user-badges', userId],
    queryFn: () => badgesApi.getUser(userId),
    enabled: !!userId,
  })
}
