import { useQuery } from '@tanstack/react-query'
import { badgesApi } from '@/api/endpoints/badges'
import { queryKeys } from '@/api/queryKeys'

export const useMyBadges = () => {
  return useQuery({
    queryKey: queryKeys.badges.my,
    queryFn: () => badgesApi.getMy(),
  })
}

export const useUserBadges = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.badges.user(userId),
    queryFn: () => badgesApi.getUser(userId),
    enabled: !!userId,
  })
}
