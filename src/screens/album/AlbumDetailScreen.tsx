import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronLeft,
  Edit2,
  Trash2,
  Plus,
  Camera,
  Heart,
  Bookmark,
  X,
  Filter,
  Share,
} from "lucide-react-native";
import { useState, useEffect, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import WeddingItemCard from "../../components/WeddingItemCard";
import { fonts } from "../../theme/fonts";
import { Album } from "../../service/userSelectionService";
import {
  getItemHeight,
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
  spacing,
  borderRadius,
} from "../../../assets/styles/utils/responsive";
import * as userSelectionService from "../../service/userSelectionService";
import * as albumService from "../../service/albumService";
import * as ImagePicker from "expo-image-picker";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";
import {
  canAddImageToAlbum,
  getMaxImagesPerAlbum,
  getUpgradeMessage,
} from "../../utils/accountLimits";

const { width } = Dimensions.get("window");

interface RouteParams {
  album?: Album;
  albumId?: string;
  source?: "my" | "community";
}

const AlbumDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const insets = useSafeAreaInsets();
  const initialAlbum = params?.album;
  const albumId = params?.albumId;
  const source = params?.source || "my"; // default to 'my' if not specified

  const [album, setAlbum] = useState<Album | null>(initialAlbum || null);
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(
    !initialAlbum && !!albumId
  );
  const [allItems, setAllItems] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(6); // lazy load: 3 cols x 2 rows
  const [prefetched, setPrefetched] = useState<Record<string, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]); // Empty array means "Tất cả"
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempSelectedCategories, setTempSelectedCategories] = useState<
    string[]
  >([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(album?.name || "");
  const [isUploading, setIsUploading] = useState(false);
  const [customImages, setCustomImages] = useState<string[]>(
    album?.customImages || []
  );
  const [pendingImages, setPendingImages] = useState<
    { uri: string; type: string; name: string }[]
  >([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCode, setShareCode] = useState<string>("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const handleOpenFilterModal = () => {
    setTempSelectedCategories([...categoryFilter]);
    setShowFilterModal(true);
  };

  const handleToggleCategory = (category: string) => {
    setTempSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleApplyFilter = () => {
    setCategoryFilter(tempSelectedCategories);
    setShowFilterModal(false);
  };

  const handleClearFilter = () => {
    setCategoryFilter([]);
    setShowFilterModal(false);
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageViewer(true);
  };

  const handleCloseImageViewer = () => {
    setShowImageViewer(false);
    setSelectedImage(null);
  };

  const handleGenerateShareCode = async () => {
    if (!album) return;

    try {
      setIsGeneratingCode(true);
      const response = await albumService.generateShareCode(album._id);
      setShareCode(response.shareCode);
      setShowShareModal(true);
    } catch (error: any) {
      console.error("Error generating share code:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể tạo mã share";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyShareCode = async () => {
    await Clipboard.setString(shareCode);
    Alert.alert("Thành công", "Đã sao chép mã share code");
  };

  // Load album if only albumId is provided
  useEffect(() => {
    const loadAlbum = async () => {
      if (albumId && !initialAlbum) {
        try {
          setIsLoadingAlbum(true);
          const loadedAlbum = await albumService.getAlbumById(albumId);
          setAlbum(loadedAlbum);
          setEditedName(loadedAlbum.name);
          setCustomImages((loadedAlbum as any).customImages || []);
          setLikeCount(loadedAlbum.totalVotes || 0);
        } catch (error) {
          console.error("Error loading album:", error);
          Alert.alert("Lỗi", "Không thể tải album");
          navigation.goBack();
        } finally {
          setIsLoadingAlbum(false);
        }
      }
    };
    loadAlbum();
  }, [albumId, initialAlbum]);

  // Load interaction status if viewing community album
  useEffect(() => {
    const loadInteractionStatus = async () => {
      if (album && source === "community") {
        try {
          const status = await albumService.checkAlbumInteraction(album._id);
          setIsLiked(status.isLiked);
          setIsSaved(status.isSaved);
        } catch (error) {
          console.error("Error loading interaction status:", error);
        }
      }
    };
    loadInteractionStatus();
  }, [album, source]);

  const handleLikeToggle = async () => {
    if (!album) return;
    try {
      if (isLiked) {
        await albumService.unlikeAlbum(album._id);
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await albumService.likeAlbum(album._id);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái like");
    }
  };

  const handleSaveToggle = async () => {
    if (!album) return;
    try {
      if (isSaved) {
        await albumService.unsaveAlbum(album._id);
        setIsSaved(false);
        Alert.alert("Thành công", "Đã bỏ lưu album");
      } else {
        await albumService.saveAlbum(album._id);
        setIsSaved(true);
        Alert.alert("Thành công", "Đã lưu album");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái lưu");
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((it) => set.add(it.category));
    const ordered: string[] = [
      "Tất cả",
      "Ảnh tải lên",
      "Địa điểm",
      "Phong cách",
      "Tone màu - Đám cưới",
      "Tone màu - Lễ ăn hỏi",
      "Áo dài - Kiểu dáng",
      "Áo dài - Chất liệu",
      "Áo dài - Hoa văn",
      "Áo dài - Khăn đội đầu",
      "Lễ ăn hỏi - Trang phục chú rể",
      "Lễ ăn hỏi - Phụ kiện chú rể",
      "Váy cưới - Kiểu dáng",
      "Váy cưới - Chất liệu",
      "Váy cưới - Cổ áo",
      "Váy cưới - Chi tiết",
      "Voan cưới",
      "Trang sức",
      "Kẹp tóc",
      "Vương miện",
      "Hoa cưới",
      "Vest - Kiểu dáng",
      "Vest - Chất liệu",
      "Vest - Màu sắc",
      "Vest - Ve áo",
      "Vest - Túi áo",
      "Vest - Trang trí",
    ];
    // Only keep categories that exist in items, but preserve order
    return ordered.filter((c) => c === "Tất cả" || set.has(c));
  }, [allItems]);

  const handleSaveName = async () => {
    if (!album || !editedName.trim()) {
      Alert.alert("Lỗi", "Tên album không được để trống");
      return;
    }

    try {
      const response = await userSelectionService.updateAlbum(album._id, {
        name: editedName,
      });
      if (response.success) {
        setAlbum(response.data);
        setIsEditingName(false);
        Alert.alert("Thành công", "Đã cập nhật tên album");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể cập nhật tên album");
    }
  };

  const handlePickImages = async () => {
    // Lấy thông tin user và kiểm tra giới hạn
    const state = require("../../store").store.getState();
    const user = selectCurrentUser(state);
    const accountType = user?.accountType || "FREE";
    const currentImageCount = customImages.length + pendingImages.length;
    const maxImages = getMaxImagesPerAlbum(accountType);

    // Kiểm tra giới hạn trước khi cho phép chọn ảnh
    if (!canAddImageToAlbum(currentImageCount, accountType)) {
      Alert.alert("Nâng cấp tài khoản", getUpgradeMessage("albumImage"), [
        { text: "Hủy", style: "cancel" },
        {
          text: "Nâng cấp",
          onPress: () => (navigation as any).navigate("UpgradeAccountScreen"),
        },
      ]);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh");
      return;
    }

    try {
      // Tính số ảnh còn có thể chọn
      const remainingSlots =
        maxImages !== null ? maxImages - currentImageCount : 10;
      const selectionLimit = Math.min(
        remainingSlots > 0 ? remainingSlots : 1,
        10
      );

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: selectionLimit,
      });

      if (!result.canceled && result.assets.length > 0) {
        const images = result.assets.map((asset, index) => ({
          uri: asset.uri,
          type: "image/jpeg",
          name: `album-${Date.now()}-${index}.jpg`,
        }));

        setPendingImages((prev) => [...prev, ...images]);
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể chọn ảnh");
    }
  };

  const handleConfirmUpload = async () => {
    if (!album || pendingImages.length === 0) return;

    // Kiểm tra giới hạn trước khi upload
    const state = require("../../store").store.getState();
    const user = selectCurrentUser(state);
    const accountType = user?.accountType || "FREE";
    const totalAfterUpload = customImages.length + pendingImages.length;
    const maxImages = getMaxImagesPerAlbum(accountType);

    if (maxImages !== null && totalAfterUpload > maxImages) {
      Alert.alert(
        "Vượt quá giới hạn",
        `Bạn chỉ có thể upload tối đa ${maxImages} ảnh. Hiện tại có ${customImages.length} ảnh, bạn đang thêm ${pendingImages.length} ảnh.`,
        [
          { text: "OK", style: "cancel" },
          {
            text: "Nâng cấp",
            onPress: () => (navigation as any).navigate("UpgradeAccountScreen"),
          },
        ]
      );
      return;
    }

    try {
      setIsUploading(true);

      const uploadResponse = await userSelectionService.uploadAlbumImages(
        pendingImages
      );

      const newImages = [...customImages, ...uploadResponse.imageUrls];
      setCustomImages(newImages);

      const updateResponse = await userSelectionService.updateAlbum(album._id, {
        customImages: newImages,
      });

      if (updateResponse.success) {
        setAlbum(updateResponse.data);
        setPendingImages([]);
        Alert.alert("Thành công", "Đã upload ảnh thành công");
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể upload ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePendingImage = (index: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!album) return;

    Alert.alert("Xác nhận", "Bạn có chắc muốn xóa ảnh này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const newImages = customImages.filter((img) => img !== imageUrl);
            setCustomImages(newImages);

            const response = await userSelectionService.updateAlbum(album._id, {
              customImages: newImages,
            });

            if (response.success) {
              setAlbum(response.data);
              Alert.alert("Thành công", "Đã xóa ảnh");
            }
          } catch (error: any) {
            Alert.alert("Lỗi", error.message || "Không thể xóa ảnh");
          }
        },
      },
    ]);
  };

  const handleDeleteAlbum = () => {
    if (!album) return;

    Alert.alert(
      "Xác nhận xóa album",
      "Bạn có chắc chắn muốn xóa album này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await userSelectionService.deleteAlbum(album._id);
              Alert.alert("Thành công", "Đã xóa album", [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert("Lỗi", error.message || "Không thể xóa album");
            }
          },
        },
      ]
    );
  };

  const handleUnpublishAlbum = () => {
    if (!album) return;

    Alert.alert(
      "Gỡ album khỏi cộng đồng",
      "Bạn có chắc muốn gỡ album này khỏi cộng đồng? Album sẽ chuyển về riêng tư.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gỡ",
          style: "destructive",
          onPress: async () => {
            try {
              await albumService.publishAlbum(album._id, false);
              Alert.alert("Thành công", "Đã gỡ album khỏi cộng đồng", [
                {
                  text: "OK",
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              Alert.alert(
                "Lỗi",
                error.message || "Không thể gỡ album khỏi cộng đồng"
              );
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    // Flatten all selections into a single array for display
    const items: any[] = [];

    if (!album) {
      setAllItems([]);
      return;
    }

    // Add custom uploaded images first
    if (customImages && customImages.length > 0) {
      customImages.forEach((imageUrl, index) => {
        items.push({
          _id: `custom-${index}`,
          name: `Ảnh ${index + 1}`,
          image: imageUrl,
          category: "Ảnh tải lên",
          categoryColor: "#E0F2FE",
          isCustom: true,
        });
      });
    }

    if (album.selections && album.selections.length > 0) {
      album.selections.forEach((selection) => {
        const anySel: any = selection as any;
        // Add styles
        if (selection.styles && selection.styles.length > 0) {
          selection.styles.forEach((style) => {
            items.push({
              ...(style as any),
              category: "Váy cưới - Kiểu dáng",
              categoryColor: "#FEF0F3",
            });
          });
        }

        // Add materials
        if (selection.materials && selection.materials.length > 0) {
          selection.materials.forEach((material) => {
            items.push({
              ...(material as any),
              category: "Váy cưới - Chất liệu",
              categoryColor: "#F0F9FF",
            });
          });
        }

        // Add necklines
        if (selection.necklines && selection.necklines.length > 0) {
          selection.necklines.forEach((neckline) => {
            items.push({
              ...(neckline as any),
              category: "Váy cưới - Cổ áo",
              categoryColor: "#F0FDF4",
            });
          });
        }

        // Add details
        if (selection.details && selection.details.length > 0) {
          selection.details.forEach((detail) => {
            items.push({
              ...(detail as any),
              category: "Váy cưới - Chi tiết",
              categoryColor: "#FFFBEB",
            });
          });
        }

        // Vest selections
        // Tone color selections
        if (anySel.weddingToneColors && anySel.weddingToneColors.length > 0) {
          anySel.weddingToneColors.forEach((v: any) => {
            items.push({
              ...v,
              category: "Tone màu - Đám cưới",
              categoryColor: "#FDF2F8",
            });
          });
        }
        if (anySel.engageToneColors && anySel.engageToneColors.length > 0) {
          anySel.engageToneColors.forEach((v: any) => {
            items.push({
              ...v,
              category: "Tone màu - Lễ ăn hỏi",
              categoryColor: "#FFF7ED",
            });
          });
        }
        if (anySel.vestStyles && anySel.vestStyles.length > 0) {
          anySel.vestStyles.forEach((v: any) => {
            items.push({
              ...v,
              category: "Vest - Kiểu dáng",
              categoryColor: "#F3E8FF",
            });
          });
        }
        if (anySel.vestMaterials && anySel.vestMaterials.length > 0) {
          anySel.vestMaterials.forEach((v: any) => {
            items.push({
              ...v,
              category: "Vest - Chất liệu",
              categoryColor: "#E0F2FE",
            });
          });
        }
        if (anySel.vestColors && anySel.vestColors.length > 0) {
          anySel.vestColors.forEach((v: any) => {
            items.push({
              ...v,
              category: "Vest - Màu sắc",
              categoryColor: "#FEE2E2",
            });
          });
        }
        if (anySel.vestLapels && anySel.vestLapels.length > 0) {
          anySel.vestLapels.forEach((v: any) => {
            items.push({
              ...v,
              category: "Vest - Ve áo",
              categoryColor: "#DCFCE7",
            });
          });
        }
        if (anySel.vestPockets && anySel.vestPockets.length > 0) {
          anySel.vestPockets.forEach((v: any) => {
            items.push({
              ...v,
              category: "Vest - Túi áo",
              categoryColor: "#FAE8FF",
            });
          });
        }
        if (anySel.vestDecorations && anySel.vestDecorations.length > 0) {
          anySel.vestDecorations.forEach((v: any) => {
            items.push({
              ...v,
              category: "Vest - Trang trí",
              categoryColor: "#FFFBEB",
            });
          });
        }

        // Bride engagement selections
        if (anySel.brideEngageStyles && anySel.brideEngageStyles.length > 0) {
          anySel.brideEngageStyles.forEach((v: any) => {
            items.push({
              ...v,
              category: "Áo dài - Kiểu dáng",
              categoryColor: "#FEF0F3",
            });
          });
        }
        if (
          anySel.brideEngageMaterials &&
          anySel.brideEngageMaterials.length > 0
        ) {
          anySel.brideEngageMaterials.forEach((v: any) => {
            items.push({
              ...v,
              category: "Áo dài - Chất liệu",
              categoryColor: "#F0F9FF",
            });
          });
        }
        if (
          anySel.brideEngagePatterns &&
          anySel.brideEngagePatterns.length > 0
        ) {
          anySel.brideEngagePatterns.forEach((v: any) => {
            items.push({
              ...v,
              category: "Áo dài - Hoa văn",
              categoryColor: "#F0FDF4",
            });
          });
        }
        if (
          anySel.brideEngageHeadwears &&
          anySel.brideEngageHeadwears.length > 0
        ) {
          anySel.brideEngageHeadwears.forEach((v: any) => {
            items.push({
              ...v,
              category: "Áo dài - Khăn đội đầu",
              categoryColor: "#FFFBEB",
            });
          });
        }

        // Wedding Venues & Themes
        if (anySel.weddingVenues && anySel.weddingVenues.length > 0) {
          anySel.weddingVenues.forEach((v: any) => {
            items.push({
              ...v,
              category: "Địa điểm",
              categoryColor: "#FEF0F3",
            });
          });
        }
        if (anySel.weddingThemes && anySel.weddingThemes.length > 0) {
          anySel.weddingThemes.forEach((v: any) => {
            items.push({
              ...v,
              category: "Phong cách",
              categoryColor: "#F0F9FF",
            });
          });
        }

        // Groom engagement selections
        if (anySel.groomEngageOutfits && anySel.groomEngageOutfits.length > 0) {
          anySel.groomEngageOutfits.forEach((v: any) => {
            items.push({
              ...v,
              category: "Lễ ăn hỏi - Trang phục chú rể",
              categoryColor: "#FEF0F3",
            });
          });
        }
        if (
          anySel.groomEngageAccessories &&
          anySel.groomEngageAccessories.length > 0
        ) {
          anySel.groomEngageAccessories.forEach((v: any) => {
            items.push({
              ...v,
              category: "Lễ ăn hỏi - Phụ kiện chú rể",
              categoryColor: "#F0F9FF",
            });
          });
        }

        // Add accessories
        if (selection.accessories) {
          // Veils
          if (
            selection.accessories.veils &&
            selection.accessories.veils.length > 0
          ) {
            selection.accessories.veils.forEach((veil) => {
              items.push({
                ...(veil as any),
                category: "Voan cưới",
                categoryColor: "#FDF2F8",
              });
            });
          }

          // Jewelry
          if (
            selection.accessories.jewelries &&
            selection.accessories.jewelries.length > 0
          ) {
            selection.accessories.jewelries.forEach((jewelry) => {
              items.push({
                ...(jewelry as any),
                category: "Trang sức",
                categoryColor: "#FEF3C7",
              });
            });
          }

          // Hairpins
          if (
            selection.accessories.hairpins &&
            selection.accessories.hairpins.length > 0
          ) {
            selection.accessories.hairpins.forEach((hairpin) => {
              items.push({
                ...(hairpin as any),
                category: "Kẹp tóc",
                categoryColor: "#E0E7FF",
              });
            });
          }

          // Crowns
          if (
            selection.accessories.crowns &&
            selection.accessories.crowns.length > 0
          ) {
            selection.accessories.crowns.forEach((crown) => {
              items.push({
                ...(crown as any),
                category: "Vương miện",
                categoryColor: "#F3E8FF",
              });
            });
          }
        }

        // Add flowers
        if (selection.flowers && selection.flowers.length > 0) {
          selection.flowers.forEach((flower) => {
            items.push({
              ...(flower as any),
              category: "Hoa cưới",
              categoryColor: "#ECFDF5",
            });
          });
        }
      });
    }

    setAllItems(items);
  }, [album, customImages]);

  const renderAlbumItem = (item: any, index: number) => {
    // Shorten category text for badge display
    const displayCategory = (() => {
      if (typeof item.category !== "string") return item.category;

      // Mapping for shortened labels on badges
      const categoryMap: Record<string, string> = {
        "Váy cưới - Kiểu dáng": "Kiểu dáng VC",
        "Váy cưới - Chất liệu": "Chất liệu VC",
        "Váy cưới - Cổ áo": "Cổ áo VC",
        "Váy cưới - Chi tiết": "Chi tiết VC",
        "Áo dài - Kiểu dáng": "Kiểu dáng AD",
        "Áo dài - Chất liệu": "Chất liệu AD",
        "Áo dài - Hoa văn": "Hoa văn AD",
        "Áo dài - Khăn đội đầu": "Khăn AD",
        "Tone màu - Đám cưới": "Tone ĐC",
        "Tone màu - Lễ ăn hỏi": "Tone LĂH",
        "Lễ ăn hỏi - Trang phục chú rể": "Trang phục",
        "Lễ ăn hỏi - Phụ kiện chú rể": "Phụ kiện",
        "Vest - Kiểu dáng": "Kiểu dáng Vest",
        "Vest - Chất liệu": "Chất liệu Vest",
        "Vest - Màu sắc": "Màu sắc Vest",
        "Vest - Ve áo": "Ve áo Vest",
        "Vest - Túi áo": "Túi áo Vest",
        "Vest - Trang trí": "Trang trí Vest",
      };

      return categoryMap[item.category] || item.category;
    })();

    // Custom images can be deleted with long press
    const handleLongPress = item.isCustom
      ? () => handleDeleteImage(item.image)
      : undefined;

    return (
      <View style={styles.itemWrapper}>
        <TouchableOpacity
          onPress={() => handleImagePress(item.image)}
          onLongPress={handleLongPress}
          delayLongPress={500}
          activeOpacity={0.7}
        >
          <WeddingItemCard
            id={item._id}
            name={item.name}
            image={item.image}
            isSelected={true}
            onSelect={() => {}}
            showPinButton={false}
          />
        </TouchableOpacity>
        <LinearGradient
          colors={["rgba(255, 255, 255, 0.95)", "rgba(255, 255, 255, 0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.categoryBadge}
        >
          <Text style={styles.categoryText} numberOfLines={1}>
            {displayCategory}
          </Text>
        </LinearGradient>
      </View>
    );
  };

  const topPad =
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 0;

  const filteredItems = useMemo(() => {
    // Empty array means show all
    if (categoryFilter.length === 0) {
      return allItems;
    }
    // Filter by selected categories
    return allItems.filter((it) => categoryFilter.includes(it.category));
  }, [allItems, categoryFilter]);

  const pagedItems = useMemo(() => {
    return filteredItems.slice(0, Math.min(visibleCount, filteredItems.length));
  }, [filteredItems, visibleCount]);

  // Prefetch images for current page to avoid flash/missing
  useEffect(() => {
    const toPrefetch = pagedItems.filter(
      (it) => it.image && !prefetched[it._id]
    );
    if (toPrefetch.length === 0) return;
    toPrefetch.forEach(async (it) => {
      try {
        await Image.prefetch(encodeURI(it.image));
      } catch {
      } finally {
        setPrefetched((p) => ({ ...p, [it._id]: true }));
      }
    });
  }, [pagedItems]);

  if (isLoadingAlbum) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F9CBD6" />
          <Text style={styles.loadingText}>Đang tải album...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!album) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Album không tồn tại</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          {source === "my" && isEditingName ? (
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.nameInput}
                value={editedName}
                onChangeText={setEditedName}
                autoFocus
                onBlur={handleSaveName}
                onSubmitEditing={handleSaveName}
              />
            </View>
          ) : source === "my" ? (
            <TouchableOpacity onPress={() => setIsEditingName(true)}>
              <View style={styles.nameDisplayContainer}>
                <Text style={styles.headerTitle}>{album.name}</Text>
                <Edit2 size={16} color="#6b7280" style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.nameDisplayContainer}>
              <Text style={styles.headerTitle}>{album.name}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {source === "my" ? (
            // My album: show export, upload and delete buttons
            <>
              <TouchableOpacity
                onPress={handleGenerateShareCode}
                disabled={isGeneratingCode}
                style={styles.headerIconButton}
              >
                {isGeneratingCode ? (
                  <ActivityIndicator size="small" color="#1f2937" />
                ) : (
                  <Share size={24} color="#1f2937" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePickImages}
                disabled={isUploading}
                style={styles.headerIconButton}
              >
                <Camera size={24} color="#1f2937" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteAlbum}>
                <Trash2 size={24} color="#ef4444" />
              </TouchableOpacity>
            </>
          ) : (
            // Community album: show like, save, and unpublish buttons
            <>
              <TouchableOpacity
                onPress={handleLikeToggle}
                style={styles.headerIconButton}
              >
                <Heart
                  size={24}
                  color={isLiked ? "#ff6b9d" : "#6b7280"}
                  fill={isLiked ? "#ff6b9d" : "none"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveToggle}
                style={styles.headerIconButton}
              >
                <Bookmark
                  size={24}
                  color={isSaved ? "#ffc107" : "#6b7280"}
                  fill={isSaved ? "#ffc107" : "none"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUnpublishAlbum}>
                <Trash2 size={24} color="#ef4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      {/* Pending Images Preview */}
      {pendingImages.length > 0 && (
        <View style={styles.pendingImagesSection}>
          <Text style={styles.sectionTitle}>Ảnh chờ xác nhận</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pendingImagesScroll}
          >
            {pendingImages.map((image, index) => (
              <View key={index} style={styles.pendingImageWrapper}>
                <Image
                  source={{ uri: image.uri }}
                  style={styles.customImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.deleteImageButton}
                  onPress={() => handleRemovePendingImage(index)}
                >
                  <Trash2 size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>
                Xác nhận ({pendingImages.length} ảnh)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Bar - 2 buttons */}
      <View style={styles.filterWrapper}>
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              categoryFilter.length === 0 && styles.filterButtonActive,
            ]}
            onPress={() => setCategoryFilter([])}
          >
            <Text
              style={[
                styles.filterButtonText,
                categoryFilter.length === 0 && styles.filterButtonTextActive,
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              categoryFilter.length > 0 && styles.filterButtonActive,
            ]}
            onPress={handleOpenFilterModal}
          >
            <Text
              style={[
                styles.filterButtonText,
                categoryFilter.length > 0 && styles.filterButtonTextActive,
              ]}
            >
              Lọc{" "}
              {categoryFilter.length > 0 ? `(${categoryFilter.length})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn danh mục</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={styles.categoryItem}
                  onPress={() => handleToggleCategory(category)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      tempSelectedCategories.includes(category) &&
                        styles.checkboxChecked,
                    ]}
                  >
                    {tempSelectedCategories.includes(category) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.categoryItemText}>{category}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearFilter}
              >
                <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyFilter}
              >
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageViewer}
        transparent
        animationType="fade"
        onRequestClose={handleCloseImageViewer}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseArea}
            activeOpacity={1}
            onPress={handleCloseImageViewer}
          >
            <View style={styles.imageViewerHeader}>
              <TouchableOpacity
                style={styles.imageViewerCloseButton}
                onPress={handleCloseImageViewer}
              >
                <Text style={styles.imageViewerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          {selectedImage && (
            <View style={styles.imageViewerContent}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </View>
          )}
        </View>
      </Modal>

      {/* Share Code Modal */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chia sẻ Album</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.shareCodeContainer}>
              <Text style={styles.shareCodeLabel}>Mã chia sẻ:</Text>
              <View style={styles.shareCodeBox}>
                <Text style={styles.shareCodeText}>{shareCode}</Text>
              </View>
              <Text style={styles.shareCodeHint}>
                Chia sẻ mã này để người khác có thể sao chép album của bạn
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleCopyShareCode}
              >
                <Text style={styles.applyButtonText}>Sao chép mã</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Album Items Grid - FlatList to avoid image recycling issues */}
      <FlatList
        key={`album-items-${categoryFilter}`}
        data={pagedItems}
        keyExtractor={(item: any) => `${item._id}-${item.category}`}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item, index }) => renderAlbumItem(item, index)}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Platform.OS === "android"
                ? responsiveHeight(24) + insets.bottom
                : responsiveHeight(24),
          },
        ]}
        removeClippedSubviews
        windowSize={5}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={80}
        extraData={categoryFilter}
        getItemLayout={(data, index) => {
          const cardHeight = getItemHeight() + 24 + 40; // image + margin + text/badge approx
          const row = Math.floor(index / 3);
          return { length: cardHeight, offset: cardHeight * row, index };
        }}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (visibleCount < filteredItems.length) {
            setVisibleCount((c) => Math.min(c + 6, filteredItems.length)); // thêm 2 hàng (3x2)
          }
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(16),
    height: responsiveHeight(64),
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: responsiveFont(20),
    fontFamily: "Agbalumo",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
    marginTop: spacing.xs / 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(16),
  },
  headerIconButton: {
    padding: spacing.xs,
  },
  nameDisplayContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  editNameContainer: {
    width: responsiveWidth(200),
  },
  nameInput: {
    fontSize: responsiveFont(20),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
    borderBottomWidth: 2,
    borderBottomColor: "#F9CBD6",
    paddingVertical: spacing.xs,
    textAlign: "center",
  },
  customImagesBanner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: responsiveWidth(16),
    backgroundColor: "#E0F2FE",
    borderBottomWidth: 1,
    borderBottomColor: "#BAE6FD",
  },
  bannerText: {
    fontSize: responsiveFont(12),
    fontFamily: fonts.montserratMedium,
    color: "#0369a1",
    textAlign: "center",
  },
  pendingImagesSection: {
    paddingVertical: spacing.md,
    paddingLeft: responsiveWidth(16),
    backgroundColor: "#FFF7ED",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sectionTitle: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
    marginBottom: spacing.md,
  },
  pendingImagesScroll: {
    flexDirection: "row",
    gap: spacing.md,
    paddingRight: responsiveWidth(16),
    marginBottom: spacing.md,
  },
  pendingImageWrapper: {
    position: "relative",
    width: responsiveWidth(120),
    height: responsiveWidth(120),
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  customImage: {
    width: "100%",
    height: "100%",
  },
  deleteImageButton: {
    position: "absolute",
    top: spacing.sm - 2,
    right: spacing.sm - 2,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    borderRadius: borderRadius.md,
    padding: spacing.xs,
  },
  confirmButton: {
    backgroundColor: "#F9CBD6",
    paddingVertical: spacing.md,
    paddingHorizontal: responsiveWidth(24),
    borderRadius: borderRadius.sm,
    alignItems: "center",
    marginRight: responsiveWidth(16),
  },
  confirmButtonText: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  scrollContent: {
    paddingBottom: responsiveHeight(24),
    paddingTop: 0,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: 0,
    gap: spacing.sm,
  },
  filterWrapper: {
    paddingVertical: spacing.md,
    paddingHorizontal: responsiveWidth(16),
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterButtonsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: "#F9CBD6",
  },
  filterButtonText: {
    fontFamily: fonts.montserratMedium,
    color: "#1f2937",
    fontSize: responsiveFont(14),
  },
  filterButtonTextActive: {
    fontFamily: fonts.montserratSemiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: "80%",
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: responsiveFont(18),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  modalCloseButton: {
    fontSize: responsiveFont(32),
    color: "#6b7280",
    fontFamily: fonts.montserratMedium,
  },
  modalScrollView: {
    maxHeight: responsiveHeight(400),
    paddingHorizontal: responsiveWidth(16),
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  checkbox: {
    width: responsiveWidth(24),
    height: responsiveWidth(24),
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: "#F9CBD6",
    borderColor: "#F9CBD6",
  },
  checkmark: {
    color: "#1f2937",
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratSemiBold,
  },
  categoryItemText: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratMedium,
    color: "#1f2937",
    flex: 1,
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: responsiveWidth(16),
    paddingTop: spacing.md,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratSemiBold,
    color: "#6b7280",
  },
  applyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: "#F9CBD6",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  columnWrapper: {
    paddingHorizontal: responsiveWidth(16),
    gap: spacing.sm,
  },
  itemWrapper: {
    position: "relative",
    width: (width - responsiveWidth(32) - spacing.sm * 2) / 3, // 3 cards per row: (total width - horizontal padding - gaps) / 3
    marginBottom: spacing.md,
  },
  categoryBadge: {
    position: "absolute",
    left: 0,
    right: 0,
    width: "100%",
    paddingVertical: spacing.md,
    zIndex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: {
    fontSize: responsiveFont(11),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
    textAlign: "center",
    textShadowColor: "rgba(255, 255, 255, 0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratMedium,
    color: "#ef4444",
    textAlign: "center",
    paddingHorizontal: responsiveWidth(16),
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerCloseArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageViewerHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? responsiveHeight(50) : responsiveHeight(20),
    right: responsiveWidth(20),
    zIndex: 10,
  },
  imageViewerCloseButton: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerCloseText: {
    fontSize: responsiveFont(24),
    color: "#fff",
    fontFamily: fonts.montserratSemiBold,
  },
  imageViewerContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: responsiveWidth(20),
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  shareCodeContainer: {
    padding: responsiveWidth(16),
    gap: spacing.md,
  },
  shareCodeLabel: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
    textAlign: "center",
  },
  shareCodeBox: {
    backgroundColor: "#F3F4F6",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F9CBD6",
  },
  shareCodeText: {
    fontSize: responsiveFont(28),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
    letterSpacing: 4,
  },
  shareCodeHint: {
    fontSize: responsiveFont(12),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
    textAlign: "center",
  },
});

export default AlbumDetailScreen;
