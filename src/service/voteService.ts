import apiClient from "../api/client";

export interface Vote {
  _id: string;
  userId: string;
  targetId: string;
  targetType: "Post" | "Album" | "UserSelection";
  voteType: "upvote" | "downvote";
  createdAt: string;
  updatedAt: string;
}

export interface CreateVoteData {
  targetId: string;
  targetType: "Post" | "Album" | "UserSelection";
  voteType: "upvote" | "downvote";
}

export interface VoteCount {
  upvotes: number;
  downvotes: number;
  total: number;
}

export interface VoteStatus {
  voted: boolean;
  voteType: "upvote" | "downvote" | null;
}

// Tạo hoặc toggle vote
export const createVote = async (data: CreateVoteData): Promise<any> => {
  const response = await apiClient.post("/votes", data);
  return response.data;
};

// Lấy số lượng votes
export const getVoteCount = async (
  targetType: string,
  targetId: string
): Promise<VoteCount> => {
  const response = await apiClient.get(
    `/votes/${targetType}/${targetId}/count`
  );
  return response.data;
};

// Lấy trạng thái vote của user
export const getUserVoteStatus = async (
  targetType: string,
  targetId: string
): Promise<VoteStatus> => {
  const response = await apiClient.get(
    `/votes/${targetType}/${targetId}/status`
  );
  return response.data;
};
