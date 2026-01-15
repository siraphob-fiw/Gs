import {
  UseMutationResult,
  UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { proxyClient } from '@/lib/proxy-client';

// ==================
// ENUMS AND INTERFACES
// ==================
export enum PageStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum PostStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
}

// Unify base timestamped entity
interface Timestamped {
  created_at: Date;
  updated_at: Date;
}

export interface Page extends Timestamped {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: PageStatus;
  featured_image_id?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  author_id: string;
  published_at?: Date;
  options?: { on_menu: boolean; on_footer: boolean };
}

export interface Post extends Timestamped {
  id: string;
  title: string;
  details: string;
  status: PostStatus;
}

export interface Media extends Timestamped {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  file_url: string;
  media_type: MediaType;
  alt_text?: string;
  caption?: string;
  uploaded_by: string;
}

// ========== DTOs ==========

// Pages
export interface CreatePageDto {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status?: PageStatus;
  featured_image_id?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  published_at?: string;
  options?: { on_menu: boolean; on_footer: boolean };
}

export interface UpdatePageDto extends Partial<CreatePageDto> {}

// Query DTO (unified for all: allows search/sort/page/limit)
interface PaginatedQuery {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PageQueryDto extends PaginatedQuery {
  status?: PageStatus;
}

export interface PostQueryDto extends PaginatedQuery {
  status?: PostStatus;
}

export interface MediaQueryDto extends PaginatedQuery {
  media_type?: MediaType;
}

export interface CategoryQueryDto extends PaginatedQuery {
  parent_id?: string;
}

// Posts
export interface CreatePostDto {
  title: string;
  details: string;
  status?: PostStatus;
}
export interface UpdatePostDto extends Partial<CreatePostDto> {}

// Categories
export interface CreateCategoryDto {
  name: string;
  description?: string;
}
export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

// Media
export interface CreateMediaDto {
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  file_path: string;
  file_url: string;
  media_type: MediaType;
  alt_text?: string;
  caption?: string;
}
export interface UpdateMediaDto {
  alt_text?: string;
  caption?: string;
}

// ========== QUERY KEYS ============
export const cmsKeys = {
  all: ['cms'] as const,
  pages: {
    all: ['cms', 'pages'] as const,
    lists: () => [...cmsKeys.pages.all, 'list'] as const,
    list: (filters: PageQueryDto = {}) => [...cmsKeys.pages.lists(), filters] as const,
    item: (id: string) => [...cmsKeys.pages.all, 'item', id] as const,
    bySlug: (slug: string) => [...cmsKeys.pages.all, 'slug', slug] as const,
  },
  posts: {
    all: ['cms', 'posts'] as const,
    lists: () => [...cmsKeys.posts.all, 'list'] as const,
    list: (filters: PostQueryDto = {}) => [...cmsKeys.posts.lists(), filters] as const,
    item: (id: string) => [...cmsKeys.posts.all, 'item', id] as const,
  },
  categories: {
    all: ['cms', 'categories'] as const,
    lists: () => [...cmsKeys.categories.all, 'list'] as const,
    list: (filters: CategoryQueryDto = {}) => [...cmsKeys.categories.lists(), filters] as const,
    item: (id: string) => [...cmsKeys.categories.all, 'item', id] as const,
  },
  media: {
    all: ['cms', 'media'] as const,
    lists: () => [...cmsKeys.media.all, 'list'] as const,
    list: (filters: MediaQueryDto = {}) => [...cmsKeys.media.lists(), filters] as const,
    item: (id: string) => [...cmsKeys.media.all, 'item', id] as const,
    byType: (type: MediaType) => [...cmsKeys.media.all, 'type', type] as const,
  },
};

// ============ HELPERS =============

const buildQueryString = (paramsObj: Record<string, any>) => {
  const params = new URLSearchParams();
  Object.entries(paramsObj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  return params.toString();
};

// ========== PAGE HOOKS ===========
type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number | null;
  limit: number | null;
  totalPages: number;
};

export const usePages = (filters: PageQueryDto = {}): UseQueryResult<PaginatedResult<Page>> => {
  return useQuery({
    queryKey: cmsKeys.pages.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.status) {
        params.append('status', filters.status.toString());
      }
      const url = `/cms-pages?${params.toString()}`;
      const data = await proxyClient.get<PaginatedResult<Page>>(url);
      return data;
    },
    retry: false,
  });
};

export const usePage = (slug: string): UseQueryResult<Page> =>
  useQuery({
    queryKey: cmsKeys.pages.bySlug(slug),
    queryFn: async () => await proxyClient.get<Page>(`/cms-pages/slug/${slug}`),
    retry: false,
  });

export const useCreatePage = (): UseMutationResult<Page, Error, CreatePageDto> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePageDto) => {
      return await proxyClient.post<Page>('/cms-pages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.pages.lists() });
    },
    retry: false,
  });
};

export const useUpdatePage = (): UseMutationResult<
  Page,
  Error,
  { data: UpdatePageDto }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ data }) => {
      return await proxyClient.put<Page>(`/cms-pages`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.pages.lists() });
    },
    retry: false,
  });
};

export const useDeletePage = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => {
      return proxyClient.delete<void>(`/cms-pages/${slug}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.pages.lists() });
    },
    retry: false,
  });
};

// ========== POST HOOKS ===========
export const usePosts = (filters: PostQueryDto = {}): UseQueryResult<PaginatedResult<Post>> => {
  return useQuery({
    queryKey: cmsKeys.posts.list(filters),
    queryFn: async () => {
      let url = '/cms-posts';
      const params = new URLSearchParams();

      if (filters && Object.keys(filters).length > 0) {
        if (filters.search) params.set('search', filters.search);
        if (filters.sortBy) params.set('sortBy', filters.sortBy);
        if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
        if (filters.page !== undefined) params.set('page', filters.page.toString());
        if (filters.limit !== undefined) params.set('limit', filters.limit.toString());
        if (filters.status) params.set('status', filters.status);
      }

      const queryString = params.toString();
      if (queryString) {
        url += `${queryString ? `?${queryString}` : ''}`;
      }

      return await proxyClient.get<PaginatedResult<Post>>(url);
    },
    retry: false,
  });
};

export const usePost = (id: string): UseQueryResult<Post> =>
  useQuery({
    queryKey: cmsKeys.posts.item(id),
    queryFn: async () => await proxyClient.get<Post>(`/cms-posts/${id}`),
    retry: false,
  });

export const useCreatePost = (): UseMutationResult<Post, Error, CreatePostDto> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePostDto) => {
      return await proxyClient.post<Post>(`/cms-posts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.posts.lists() });
    },
    retry: false,
  });
};

export const useUpdatePost = (): UseMutationResult<
  Post,
  Error,
  { id: string; data: UpdatePostDto }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await proxyClient.put<Post>(`/cms-posts/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.posts.lists() });
      queryClient.invalidateQueries({ queryKey: cmsKeys.posts.item(id) });
    },
    retry: false,
  });
};

export const useDeletePost = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return proxyClient.delete<void>(`/cms-posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.posts.lists() });
    },
    retry: false,
  });
};

// ========== MEDIA HOOKS ===========
type PaginatedMediaResult = {
  data: Media[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const useMedia = (filters: MediaQueryDto = {}): UseQueryResult<PaginatedMediaResult> => {
  return useQuery({
    queryKey: cmsKeys.media.list(filters),
    queryFn: async () => {
      const qs = buildQueryString(filters);
      const url = `/cms-media${qs ? `?${qs}` : ''}`;
      const data = await proxyClient.get<PaginatedMediaResult>(url);
      return data;
    },
    retry: false,
    staleTime: 300_000,
  });
};

export const useMediaByType = (type: MediaType): UseQueryResult<Media[]> =>
  useQuery({
    queryKey: cmsKeys.media.byType(type),
    queryFn: async () => await proxyClient.get<Media[]>(`/cms-media/type/${type}`),
    retry: false,
    staleTime: 300_000,
  });

export const useMediaItem = (id: string): UseQueryResult<Media> =>
  useQuery({
    queryKey: cmsKeys.media.item(id),
    queryFn: async () => await proxyClient.get<Media>(`/cms-media/${id}`),
    retry: false,
  });

export const useCreateMedia = (): UseMutationResult<Media, Error, CreateMediaDto> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMediaDto) => {
      return await proxyClient.post<Media>('/cms-media', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.media.lists() });
    },
    retry: false,
  });
};

export const useUpdateMedia = (): UseMutationResult<
  Media,
  Error,
  { id: string; data: UpdateMediaDto }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      return await proxyClient.put<Media>(`/cms-media/${id}`, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.media.lists() });
      queryClient.invalidateQueries({ queryKey: cmsKeys.media.item(id) });
    },
    retry: false,
  });
};

export const useDeleteMedia = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      return proxyClient.delete<void>(`/cms-media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cmsKeys.media.lists() });
    },
    retry: false,
  });
};
