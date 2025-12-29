import apiClient from "../api/client";

export interface Post {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    picture?: string;
    email: string;
  };
  content: string;
  images?: string[];
  reactions: {
    like: string[];
    love: string[];
  };
  totalReactions: number;
  totalComments: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  content: string;
  images?: string[];
}

export interface UpdatePostData {
  content?: string;
  images?: string[];
}

export interface ReactToPostData {
  type: "like" | "love";
}

// ✅ Lấy tất cả posts với pagination
export const getAllPosts = async (
  page: number = 1,
  limit: number = 20
): Promise<{
  posts: Post[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}> => {
  const response = await apiClient.get(`/posts?page=${page}&limit=${limit}`);
  // Backend trả về { posts: [...], pagination: {...} }
  return {
    posts: response.data.posts,
    pagination: {
      page: response.data.pagination?.page || page,
      limit: response.data.pagination?.limit || limit,
      total: response.data.pagination?.total || response.data.posts.length,
      totalPages: response.data.pagination?.totalPages || 1,
      hasMore: response.data.posts.length === limit, // Nếu trả về đủ limit thì còn more
    },
  };
};

// Lấy post theo ID
export const getPostById = async (postId: string): Promise<Post> => {
  const response = await apiClient.get(`/posts/${postId}`);
  // SỬA: Lấy object post từ response.data.post
  return response.data.post;
};

// Lấy posts của user hiện tại
export const getMyPosts = async (): Promise<Post[]> => {
  const response = await apiClient.get("/posts/my-posts");
  // SỬA: Giả định backend trả về { posts: [...] }
  return response.data.posts;
};

// Lấy posts của một user cụ thể
export const getUserPosts = async (userId: string): Promise<Post[]> => {
  const response = await apiClient.get(`/posts/user/${userId}`);
  // SỬA: Giả định backend trả về { posts: [...] }
  return response.data.posts;
};

// Tạo post mới
export const createPost = async (data: CreatePostData): Promise<Post> => {
  // SỬA: Dùng endpoint /posts (nếu bạn đã sửa router.post("/", ...) ở backend)
  // Nếu backend vẫn là router.post("/create", ...), hãy đổi dòng dưới thành "/posts/create"
  const response = await apiClient.post("/posts", data);
  // SỬA: Lấy object post mới từ response.data.post
  return response.data.post;
};

// Cập nhật post
export const updatePost = async (
  postId: string,
  data: UpdatePostData
): Promise<Post> => {
  const response = await apiClient.put(`/posts/${postId}`, data);
  // SỬA: Lấy object post đã update từ response.data.post
  return response.data.post;
};

// Xóa post
export const deletePost = async (postId: string): Promise<void> => {
  await apiClient.delete(`/posts/${postId}`);
};

// Thả cảm xúc vào post
export const reactToPost = async (
  postId: string,
  data: ReactToPostData
): Promise<Post> => {
  const response = await apiClient.post(`/posts/${postId}/react`, data);

  // LƯU Ý QUAN TRỌNG:
  // BackEnd controller reactToPost của bạn cần trả về { post: updatedPost }
  // để Redux có thể cập nhật lại state.
  return response.data.post || response.data;
};

// Bỏ cảm xúc khỏi post
export const unreactToPost = async (postId: string): Promise<Post> => {
  // SỬA: Dùng method DELETE để khớp với routes backend (router.delete("/:id/react"))
  const response = await apiClient.delete(`/posts/${postId}/react`);

  // LƯU Ý: BackEnd cũng cần trả về { post: updatedPost }
  return response.data.post || response.data;
};

// Lấy featured posts (Inspire Board)
export const getFeaturedPosts = async (
  limit: number = 10,
  category?: string
): Promise<Post[]> => {
  let url = `/posts/featured?limit=${limit}`;
  if (category) url += `&category=${category}`;

  const response = await apiClient.get(url);
  return response.data.posts;
};

// Lấy trending posts
export const getTrendingPosts = async (
  limit: number = 10,
  days: number = 7
): Promise<Post[]> => {
  const response = await apiClient.get(
    `/posts/trending?limit=${limit}&days=${days}`
  );
  return response.data.posts;
};
