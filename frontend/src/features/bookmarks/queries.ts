import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookmarksApi } from '@/api/endpoints/bookmarks'
import type { BookmarkResourceType } from '@/types'

export const bookmarkKeys = {
  all: () => ['bookmarks'] as const,
  list: (resourceType?: BookmarkResourceType) => ['bookmarks', resourceType ?? 'all'] as const,
}

export function useBookmarks(resourceType?: BookmarkResourceType) {
  return useQuery({
    queryKey: bookmarkKeys.list(resourceType),
    queryFn: () => bookmarksApi.list(resourceType),
  })
}

export function useAddBookmark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: bookmarksApi.add,
    onSuccess: () => qc.invalidateQueries({ queryKey: bookmarkKeys.all() }),
  })
}

export function useDeleteBookmark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bookmarksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: bookmarkKeys.all() }),
  })
}
