import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookmarksApi } from '@/api/endpoints/bookmarks'
import { queryKeys } from '@/api/queryKeys'
import type { BookmarkResourceType } from '@/types'

export const useBookmarks = (resourceType?: BookmarkResourceType) => {
  return useQuery({
    queryKey: queryKeys.bookmarks.list(resourceType),
    queryFn: () => bookmarksApi.list(resourceType),
  })
}

export const useAddBookmark = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bookmarksApi.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.list() })
    },
  })
}

export const useDeleteBookmark = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bookmarksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks.list() })
    },
  })
}
