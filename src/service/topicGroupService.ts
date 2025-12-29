import apiClient from "../api/client";

export interface TopicGroup {
  _id: string;
  name: string;
  description?: string;
  category: string;
  coverImage?: string;
  createdBy: {
    _id: string;
    fullName: string;
    picture?: string;
    email?: string;
  };
  members: string[];
  totalMembers: number;
  totalPosts: number;
  isActive: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTopicGroupData {
  name: string;
  description?: string;
  category?: string;
  coverImage?: string;
  isPublic?: boolean;
}

export interface UpdateTopicGroupData {
  name?: string;
  description?: string;
  category?: string;
  coverImage?: string;
  isPublic?: boolean;
}

// Lấy tất cả topic groups
export const getAllTopicGroups = async (
  page: number = 1,
  limit: number = 20,
  category?: string,
  search?: string
): Promise<any> => {
  let url = `/topic-groups?page=${page}&limit=${limit}`;
  if (category) url += `&category=${category}`;
  if (search) url += `&search=${search}`;

  const response = await apiClient.get(url);
  return response.data;
};

// Lấy topic group theo ID
export const getTopicGroupById = async (
  groupId: string
): Promise<TopicGroup> => {
  const response = await apiClient.get(`/topic-groups/${groupId}`);
  return response.data.group;
};

// Tạo topic group mới
export const createTopicGroup = async (
  data: CreateTopicGroupData
): Promise<TopicGroup> => {
  const response = await apiClient.post("/topic-groups", data);
  return response.data.group;
};

// Cập nhật topic group
export const updateTopicGroup = async (
  groupId: string,
  data: UpdateTopicGroupData
): Promise<TopicGroup> => {
  const response = await apiClient.put(`/topic-groups/${groupId}`, data);
  return response.data.group;
};

// Xóa topic group
export const deleteTopicGroup = async (groupId: string): Promise<void> => {
  await apiClient.delete(`/topic-groups/${groupId}`);
};

// Tham gia topic group
export const joinTopicGroup = async (groupId: string): Promise<TopicGroup> => {
  const response = await apiClient.post(`/topic-groups/${groupId}/join`);
  return response.data.group;
};

// Rời topic group
export const leaveTopicGroup = async (groupId: string): Promise<void> => {
  await apiClient.post(`/topic-groups/${groupId}/leave`);
};

// Lấy các nhóm mà user đã tham gia
export const getMyTopicGroups = async (): Promise<TopicGroup[]> => {
  const response = await apiClient.get("/topic-groups/my-groups");
  return response.data.groups;
};

// Lấy posts trong topic group
export const getTopicGroupPosts = async (
  groupId: string,
  page: number = 1,
  limit: number = 10
): Promise<any> => {
  const response = await apiClient.get(
    `/topic-groups/${groupId}/posts?page=${page}&limit=${limit}`
  );
  return response.data;
};
