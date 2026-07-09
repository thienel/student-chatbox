import axiosInstance from '@/api/axiosInstance'
import type { ApiResponse, Bookmark, BookmarkResourceType, AddBookmarkRequest } from '@/types'

export const bookmarksApi = {
  list: (resourceType?: BookmarkResourceType) =>
    axiosInstance
      .get<ApiResponse<Bookmark[]>>('/bookmarks', { params: resourceType ? { resourceType } : {} })
      .then(r => r.data.data),

  add: (data: AddBookmarkRequest) =>
    axiosInstance.post<ApiResponse<Bookmark>>('/bookmarks', data).then(r => r.data.data),

  delete: (id: string) =>
    axiosInstance.delete(`/bookmarks/${id}`),
}
