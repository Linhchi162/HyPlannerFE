import apiClient from '../api/client';

export interface UserSelection {
  _id: string;
  styles: string[];
  materials: string[];
  necklines: string[];
  details: string[];
  accessories: {
    veils: string[];
    jewelries: string[];
    hairpins: string[];
    crowns: string[];
  };
  flowers: string[];
  isPinned: boolean;
}

export interface Album {
  _id: string;
  name: string;
  selections: UserSelection[];
  note?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Create new selection when user pins items (by type)
export const createSelection = async (
  selectionData: {
  styleIds?: string[];
  materialIds?: string[];
  necklineIds?: string[];
  detailIds?: string[];
  veilIds?: string[];
  jewelryIds?: string[];
  hairpinIds?: string[];
  crownIds?: string[];
  flowerIds?: string[];
  // Groom-specific vest selections
  vestStyleIds?: string[];
  vestMaterialIds?: string[];
  vestColorIds?: string[];
  vestLapelIds?: string[];
  vestPocketIds?: string[];
  vestDecorationIds?: string[];
  // Bride-engage specific selections
  brideEngageStyleIds?: string[];
  brideEngageMaterialIds?: string[];
  brideEngagePatternIds?: string[];
  brideEngageHeadwearIds?: string[];
  // Groom-engage specific selections
  groomEngageOutfitIds?: string[];
  groomEngageAccessoryIds?: string[];
  // Tone colors (shared type)
  weddingToneColorIds?: string[];
  engageToneColorIds?: string[];
  // Venues & Themes
  weddingVenueIds?: string[];
  weddingThemeIds?: string[];
  },
  type: 'wedding-dress' | 'vest' | 'bride-engage' | 'groom-engage' | 'tone-color' | 'wedding-venue' | 'wedding-theme'
): Promise<ApiResponse<UserSelection>> => {
  try {
    const body: any = { ...selectionData, type };
    if (type === 'tone-color' || type === 'wedding-venue' || type === 'wedding-theme') {
      body.isPinned = true;
    }
    const response = await apiClient.post<ApiResponse<UserSelection>>('/user-selections', body);
    return response.data;
  } catch (error: any) {
    console.error('Error in createSelection:', error);
    throw error;
  }
};

// Delete current pinned selection by type
export const deleteSelection = async (type: 'wedding-dress' | 'vest' | 'bride-engage' | 'groom-engage' | 'tone-color'): Promise<ApiResponse<any>> => {
  try {
    const response = await apiClient.delete<ApiResponse<any>>(`/user-selections`, {
      params: { type },
    });
    return response.data;
  } catch (error: any) {
    // Swallow not-found messages from new backend
    const message: string = error?.message || '';
    const isNotFound = message.includes('No pinned') || error?.response?.status === 404;
    if (!isNotFound) {
      console.error('Error in deleteSelection:', error);
      throw error;
    }
    return { success: false, data: { message } } as unknown as ApiResponse<any>;
  }
};

// Get user selections (optionally filter by type)
export const getUserSelections = async (type?: 'wedding-dress' | 'vest' | 'bride-engage' | 'groom-engage' | 'tone-color'): Promise<ApiResponse<UserSelection[]>> => {
  try {
    const response = await apiClient.get<ApiResponse<UserSelection[]>>('/user-selections', {
      params: type ? { type } : undefined,
    });
    return response.data;
  } catch (error: any) {
    console.error('Error in getUserSelections:', error);
    // Return empty array as fallback for auth errors or other issues
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to get user selections'
    };
  }
};

// Create album
export const createAlbum = async (albumData: {
  name: string;
  note?: string;
  type: 'wedding-dress' | 'vest' | 'bride-engage' | 'groom-engage' | 'tone-color';
}): Promise<ApiResponse<Album>> => {
  try {
    const response = await apiClient.post<ApiResponse<Album>>('/user-selections/albums', albumData);
    return response.data;
  } catch (error: any) {
    console.error('Error in createAlbum:', error);
    throw error;
  }
};

// Get user albums
export const getUserAlbums = async (): Promise<ApiResponse<Album[]>> => {
  try {
    const response = await apiClient.get<ApiResponse<Album[]>>('/user-selections/albums');
    return response.data;
  } catch (error: any) {
    console.error('Error in getUserAlbums:', error);
    // Return empty array as fallback
    return {
      success: true,
      data: []
    };
  }
};
