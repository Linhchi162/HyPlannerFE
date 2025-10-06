import { Style } from "../store/weddingCostume";

export const getBrideAoDaiStyles = async (): Promise<{ data: Style[] }> => ({
  data: [
    { _id: 'ads1', name: 'Truyền thống', image: 'https://picsum.photos/seed/ads1/400' },
    { _id: 'ads2', name: 'Hiện đại', image: 'https://picsum.photos/seed/ads2/400' },
  ],
});

export const getBrideAoDaiMaterials = async (): Promise<{ data: Style[] }> => ({
  data: [
    { _id: 'adm1', name: 'Lụa', image: 'https://picsum.photos/seed/adm1/400' },
    { _id: 'adm2', name: 'Gấm', image: 'https://picsum.photos/seed/adm2/400' },
  ],
});

export const getBridePatterns = async (): Promise<{ data: Style[] }> => ({
  data: [
    { _id: 'adp1', name: 'Thêu rồng', image: 'https://picsum.photos/seed/adp1/400' },
    { _id: 'adp2', name: 'Thêu hoa', image: 'https://picsum.photos/seed/adp2/400' },
  ],
});

export const getBrideHeadscarves = async (): Promise<{ data: Style[] }> => ({
  data: [
    { _id: 'h1', name: 'Khăn đóng', image: 'https://picsum.photos/seed/h1/400' },
    { _id: 'h2', name: 'Mấn đội đầu', image: 'https://picsum.photos/seed/h2/400' },
  ],
});

export const getGroomOutfits = async (): Promise<{ data: Style[] }> => ({
  data: [
    { _id: 'go1', name: 'Áo dài nam', image: 'https://picsum.photos/seed/go1/400' },
    { _id: 'go2', name: 'Vest truyền thống', image: 'https://picsum.photos/seed/go2/400' },
  ],
});

export const getGroomAccessories = async (): Promise<{ data: Style[] }> => ({
  data: [
    { _id: 'ga1', name: 'Khăn xếp', image: 'https://picsum.photos/seed/ga1/400' },
    { _id: 'ga2', name: 'Giày', image: 'https://picsum.photos/seed/ga2/400' },
  ],
});


