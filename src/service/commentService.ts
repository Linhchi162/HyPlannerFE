import apiClient from "../api/client";

export interface Comment {
  _id: string;
  postId: string;
  userId: {
    _id: string;
    fullName: string;
    picture?: string;
    email: string;
  };
  content: string;
  parentCommentId?: string;
  reactions: {
    like: string[];
    love: string[];
  };
  totalReactions: number;
  totalReplies: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentData {
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface ReactToCommentData {
  type: "like" | "love";
}

// Lấy tất cả comments của một post
export const getCommentsByPost = async (postId: string): Promise<Comment[]> => {
  const response = await apiClient.get(`/comments/post/${postId}`);
  // 🔴 SỬA LỖI MAP: BackEnd trả về { comments: [], pagination: {} }
  // Nên phải lấy response.data.comments
  return response.data.comments;
};

// Lấy tất cả replies của một comment
export const getRepliesByComment = async (
  commentId: string
): Promise<Comment[]> => {
  const response = await apiClient.get(`/comments/${commentId}/replies`);
  // 🔴 SỬA: Tương tự, lấy response.data.replies
  return response.data.replies;
};

// Tạo comment mới
export const createComment = async (
  postId: string,
  data: CreateCommentData
): Promise<Comment> => {
  // 🔴 SỬA LỖI KHÔNG COMMENT ĐƯỢC:
  // 1. BackEnd route là "/create", không phải "/:postId"
  // 2. BackEnd cần postId nằm trong Body, nên phải gộp vào data
  const response = await apiClient.post("/comments/create", {
    ...data,
    postId,
  });
  return response.data.comment;
};

// Cập nhật comment
export const updateComment = async (
  commentId: string,
  data: UpdateCommentData
): Promise<Comment> => {
  const response = await apiClient.put(`/comments/${commentId}`, data);
  return response.data.comment;
};

// Xóa comment
export const deleteComment = async (commentId: string): Promise<void> => {
  await apiClient.delete(`/comments/${commentId}`);
};

// Thả cảm xúc vào comment
export const reactToComment = async (
  commentId: string,
  data: ReactToCommentData
): Promise<Comment> => {
  const response = await apiClient.post(`/comments/${commentId}/react`, data);
  // SỬA: Lấy comment từ response.data.comment
  return response.data.comment || response.data;
};

// Bỏ cảm xúc khỏi comment
export const unreactToComment = async (commentId: string): Promise<Comment> => {
  const response = await apiClient.delete(`/comments/${commentId}/react`);
  // SỬA: Lấy comment từ response.data.comment
  return response.data.comment || response.data;
};
