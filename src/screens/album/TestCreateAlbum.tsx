import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { Download } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import WeddingItemCard from "../../components/WeddingItemCard";
import CreateAlbumModal from "./CreateAlbumModal";
import { fonts } from "../../theme/fonts";
import {
  getItemHeight,
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
  spacing,
  borderRadius,
} from "../../../assets/styles/utils/responsive";
import * as weddingCostumeService from "../../service/weddingCostumeService";
import * as groomSuitService from "../../service/groomSuitService";
import * as venueThemeService from "../../service/venueThemeService";
import * as toneService from "../../service/toneService";
import * as brideEngageService from "../../service/brideEngageService";
import * as groomEngageService from "../../service/groomEngageService";
import * as userSelectionService from "../../service/userSelectionService";
import * as albumService from "../../service/albumService";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { selectCurrentUser } from "../../store/authSlice";
import { canCreateAlbum, getUpgradeMessage } from "../../utils/accountLimits";

const { width } = Dimensions.get("window");

interface ItemWithCategory {
  _id: string;
  name: string;
  image: string;
  category: string;
  categoryColor: string;
  isSelected: boolean;
}

const TestCreateAlbum = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useSelector(selectCurrentUser);
  const accountType = user?.accountType || "FREE";

  const [allItems, setAllItems] = useState<ItemWithCategory[]>([]);
  const [currentAlbumCount, setCurrentAlbumCount] = useState<number>(0);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempSelectedCategories, setTempSelectedCategories] = useState<
    string[]
  >([]);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((it) => set.add(it.category));
    const ordered: string[] = [
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
      "Vest - Túi ngực, túi hông,..",
      "Vest - Trang trí",
    ];
    return ordered.filter((c) => set.has(c));
  }, [allItems]);

  useEffect(() => {
    loadAllItems();
    loadAlbumCount();
  }, []);

  const loadAlbumCount = async () => {
    try {
      const albums = await albumService.getMyAlbums();
      setCurrentAlbumCount(albums.length);
    } catch (error) {
      console.error("Error loading album count:", error);
    }
  };

  const loadAllItems = async () => {
    try {
      setIsLoading(true);
      const items: ItemWithCategory[] = [];

      // ✅ FIX SEQUENTIAL API CALLS - Gọi tất cả API parallel với Promise.all
      const [
        venuesRes,
        themesRes,
        weddingToneColorsRes,
        engageToneColorsRes,
        brideStylesRes,
        brideMaterialsRes,
        bridePatternsRes,
        brideHeadwearsRes,
        groomOutfitsRes,
        groomAccessoriesRes,
        stylesRes,
        materialsRes,
        necklinesRes,
        detailsRes,
        veilsRes,
        jewelryRes,
        hairpinsRes,
        crownsRes,
        flowersRes,
        vestStylesRes,
        vestMaterialsRes,
        vestColorsRes,
        vestLapelsRes,
        vestPocketsRes,
        vestDecorationsRes,
      ] = await Promise.all([
        venueThemeService.getWeddingVenues(),
        venueThemeService.getWeddingThemes(),
        toneService.getWeddingToneColors(),
        toneService.getEngageToneColors(),
        brideEngageService.getAllBrideEngageStyles(),
        brideEngageService.getAllBrideEngageMaterials(),
        brideEngageService.getAllBrideEngagePatterns(),
        brideEngageService.getAllBrideEngageHeadwears(),
        groomEngageService.getAllGroomEngageOutfits(),
        groomEngageService.getAllGroomEngageAccessories(),
        weddingCostumeService.getAllStyles(),
        weddingCostumeService.getAllMaterials(),
        weddingCostumeService.getAllNecklines(),
        weddingCostumeService.getAllDetails(),
        weddingCostumeService.getAllVeils(),
        weddingCostumeService.getAllJewelry(),
        weddingCostumeService.getAllHairpins(),
        weddingCostumeService.getAllCrowns(),
        weddingCostumeService.getAllFlowers(),
        groomSuitService.getVestStyles(),
        groomSuitService.getVestMaterials(),
        groomSuitService.getVestColors(),
        groomSuitService.getVestLapels(),
        groomSuitService.getVestPockets(),
        groomSuitService.getVestDecorations(),
      ]);

      // Process wedding venues
      if (venuesRes.success && venuesRes.data) {
        venuesRes.data.forEach((venue: any) => {
          items.push({
            _id: venue._id,
            name: venue.name,
            image: venue.image,
            category: "Địa điểm",
            categoryColor: "#FEF0F3",
            isSelected: false,
          });
        });
      }

      // Process wedding themes
      if (themesRes.success && themesRes.data) {
        themesRes.data.forEach((theme: any) => {
          items.push({
            _id: theme._id,
            name: theme.name,
            image: theme.image,
            category: "Phong cách",
            categoryColor: "#F0F9FF",
            isSelected: false,
          });
        });
      }

      // Process wedding tone colors
      if (weddingToneColorsRes.success && weddingToneColorsRes.data) {
        weddingToneColorsRes.data.forEach((color: any) => {
          items.push({
            _id: color._id,
            name: color.name,
            image: color.image,
            category: "Tone màu - Đám cưới",
            categoryColor: "#FDF2F8",
            isSelected: false,
          });
        });
      }

      // Process engage tone colors
      if (engageToneColorsRes.success && engageToneColorsRes.data) {
        engageToneColorsRes.data.forEach((color: any) => {
          items.push({
            _id: color._id,
            name: color.name,
            image: color.image,
            category: "Tone màu - Lễ ăn hỏi",
            categoryColor: "#FFF7ED",
            isSelected: false,
          });
        });
      }

      // Process bride engagement styles
      if (brideStylesRes.success && brideStylesRes.data) {
        brideStylesRes.data.forEach((style: any) => {
          items.push({
            _id: style._id,
            name: style.name,
            image: style.image,
            category: "Áo dài - Kiểu dáng",
            categoryColor: "#FEF0F3",
            isSelected: false,
          });
        });
      }

      // Process bride materials
      if (brideMaterialsRes.success && brideMaterialsRes.data) {
        brideMaterialsRes.data.forEach((material: any) => {
          items.push({
            _id: material._id,
            name: material.name,
            image: material.image,
            category: "Áo dài - Chất liệu",
            categoryColor: "#F0F9FF",
            isSelected: false,
          });
        });
      }

      // Process bride patterns
      if (bridePatternsRes.success && bridePatternsRes.data) {
        bridePatternsRes.data.forEach((pattern: any) => {
          items.push({
            _id: pattern._id,
            name: pattern.name,
            image: pattern.image,
            category: "Áo dài - Hoa văn",
            categoryColor: "#F0FDF4",
            isSelected: false,
          });
        });
      }

      // Process bride headwears
      if (brideHeadwearsRes.success && brideHeadwearsRes.data) {
        brideHeadwearsRes.data.forEach((headwear: any) => {
          items.push({
            _id: headwear._id,
            name: headwear.name,
            image: headwear.image,
            category: "Áo dài - Khăn đội đầu",
            categoryColor: "#FFFBEB",
            isSelected: false,
          });
        });
      }

      // Process groom outfits
      if (groomOutfitsRes.success && groomOutfitsRes.data) {
        groomOutfitsRes.data.forEach((outfit: any) => {
          items.push({
            _id: outfit._id,
            name: outfit.name,
            image: outfit.image,
            category: "Lễ ăn hỏi - Trang phục chú rể",
            categoryColor: "#FEF0F3",
            isSelected: false,
          });
        });
      }

      // Process groom accessories
      if (groomAccessoriesRes.success && groomAccessoriesRes.data) {
        groomAccessoriesRes.data.forEach((accessory: any) => {
          items.push({
            _id: accessory._id,
            name: accessory.name,
            image: accessory.image,
            category: "Lễ ăn hỏi - Phụ kiện chú rể",
            categoryColor: "#F0F9FF",
            isSelected: false,
          });
        });
      }

      // Process wedding dress styles
      if (stylesRes.success && stylesRes.data) {
        stylesRes.data.forEach((style: any) => {
          items.push({
            _id: style._id,
            name: style.name,
            image: style.image,
            category: "Váy cưới - Kiểu dáng",
            categoryColor: "#FEF0F3",
            isSelected: false,
          });
        });
      }

      // Process materials
      if (materialsRes.success && materialsRes.data) {
        materialsRes.data.forEach((material: any) => {
          items.push({
            _id: material._id,
            name: material.name,
            image: material.image,
            category: "Váy cưới - Chất liệu",
            categoryColor: "#F0F9FF",
            isSelected: false,
          });
        });
      }

      // Process necklines
      if (necklinesRes.success && necklinesRes.data) {
        necklinesRes.data.forEach((neckline: any) => {
          items.push({
            _id: neckline._id,
            name: neckline.name,
            image: neckline.image,
            category: "Váy cưới - Cổ áo",
            categoryColor: "#F0FDF4",
            isSelected: false,
          });
        });
      }

      // Process details
      if (detailsRes.success && detailsRes.data) {
        detailsRes.data.forEach((detail: any) => {
          items.push({
            _id: detail._id,
            name: detail.name,
            image: detail.image,
            category: "Váy cưới - Chi tiết",
            categoryColor: "#FFFBEB",
            isSelected: false,
          });
        });
      }

      // Process veils
      if (veilsRes.success && veilsRes.data) {
        veilsRes.data.forEach((veil: any) => {
          items.push({
            _id: veil._id,
            name: veil.name,
            image: veil.image,
            category: "Voan cưới",
            categoryColor: "#FDF2F8",
            isSelected: false,
          });
        });
      }

      // Process jewelry
      if (jewelryRes.success && jewelryRes.data) {
        jewelryRes.data.forEach((item: any) => {
          items.push({
            _id: item._id,
            name: item.name,
            image: item.image,
            category: "Trang sức",
            categoryColor: "#FEF3C7",
            isSelected: false,
          });
        });
      }

      // Process hairpins
      if (hairpinsRes.success && hairpinsRes.data) {
        hairpinsRes.data.forEach((hairpin: any) => {
          items.push({
            _id: hairpin._id,
            name: hairpin.name,
            image: hairpin.image,
            category: "Kẹp tóc",
            categoryColor: "#E0E7FF",
            isSelected: false,
          });
        });
      }

      // Process crowns
      if (crownsRes.success && crownsRes.data) {
        crownsRes.data.forEach((crown: any) => {
          items.push({
            _id: crown._id,
            name: crown.name,
            image: crown.image,
            category: "Vương miện",
            categoryColor: "#F3E8FF",
            isSelected: false,
          });
        });
      }

      // Process flowers
      if (flowersRes.success && flowersRes.data) {
        flowersRes.data.forEach((flower: any) => {
          items.push({
            _id: flower._id,
            name: flower.name,
            image: flower.image,
            category: "Hoa cưới",
            categoryColor: "#ECFDF5",
            isSelected: false,
          });
        });
      }

      // Process vest styles
      if (vestStylesRes.success && vestStylesRes.data) {
        vestStylesRes.data.forEach((style: any) => {
          items.push({
            _id: style._id,
            name: style.name,
            image: style.image,
            category: "Vest - Kiểu dáng",
            categoryColor: "#F3E8FF",
            isSelected: false,
          });
        });
      }

      // Process vest materials
      if (vestMaterialsRes.success && vestMaterialsRes.data) {
        vestMaterialsRes.data.forEach((material: any) => {
          items.push({
            _id: material._id,
            name: material.name,
            image: material.image,
            category: "Vest - Chất liệu",
            categoryColor: "#E0F2FE",
            isSelected: false,
          });
        });
      }

      // Process vest colors
      if (vestColorsRes.success && vestColorsRes.data) {
        vestColorsRes.data.forEach((color: any) => {
          items.push({
            _id: color._id,
            name: color.name,
            image: color.image,
            category: "Vest - Màu sắc",
            categoryColor: "#FEE2E2",
            isSelected: false,
          });
        });
      }

      // Process vest lapels
      if (vestLapelsRes.success && vestLapelsRes.data) {
        vestLapelsRes.data.forEach((lapel: any) => {
          items.push({
            _id: lapel._id,
            name: lapel.name,
            image: lapel.image,
            category: "Vest - Ve áo",
            categoryColor: "#DCFCE7",
            isSelected: false,
          });
        });
      }

      // Process vest pockets
      if (vestPocketsRes.success && vestPocketsRes.data) {
        vestPocketsRes.data.forEach((pocket: any) => {
          items.push({
            _id: pocket._id,
            name: pocket.name,
            image: pocket.image,
            category: "Vest - Túi ngực, túi hông,..",
            categoryColor: "#FAE8FF",
            isSelected: false,
          });
        });
      }

      // Process vest decorations
      if (vestDecorationsRes.success && vestDecorationsRes.data) {
        vestDecorationsRes.data.forEach((decoration: any) => {
          items.push({
            _id: decoration._id,
            name: decoration.name,
            image: decoration.image,
            category: "Vest - Trang trí",
            categoryColor: "#FFFBEB",
            isSelected: false,
          });
        });
      }

      setAllItems(items);
    } catch (error) {
      console.error("Error loading items:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelection = (itemId: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

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

  const handleSaveAlbum = () => {
    if (selectedItems.size === 0) {
      Alert.alert("Thông báo", "Vui lòng chọn ít nhất một ảnh");
      return;
    }

    // Kiểm tra giới hạn album
    if (!canCreateAlbum(currentAlbumCount, accountType)) {
      Alert.alert("Nâng cấp tài khoản", getUpgradeMessage("album"), [
        { text: "Hủy", style: "cancel" },
        {
          text: "Nâng cấp",
          onPress: () => (navigation as any).navigate("UpgradeAccountScreen"),
        },
      ]);
      return;
    }

    setShowMetadataModal(true);
  };

  const handleImportAlbum = async () => {
    if (!importCode.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập mã share code");
      return;
    }

    try {
      setIsImporting(true);
      const response = await albumService.cloneAlbumByCode(
        importCode.toUpperCase()
      );

      Alert.alert(
        "Thành công",
        `Đã import album "${response.album.name}" thành công!`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowImportModal(false);
              setImportCode("");
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể import album");
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmSave = async (
    albumName: string,
    authorName?: string,
    coverImage?: string
  ) => {
    try {
      setIsSaving(true);
      setShowMetadataModal(false);

      // Organize selected items by category
      const selectedItemsData = allItems.filter((item) =>
        selectedItems.has(item._id)
      );

      const selectionData: any = {
        styles: [],
        materials: [],
        necklines: [],
        details: [],
        weddingVenues: [],
        weddingThemes: [],
        weddingToneColors: [],
        engageToneColors: [],
        brideEngageStyles: [],
        brideEngageMaterials: [],
        brideEngagePatterns: [],
        brideEngageHeadwears: [],
        groomEngageOutfits: [],
        groomEngageAccessories: [],
        accessories: {
          veils: [],
          jewelries: [],
          hairpins: [],
          crowns: [],
        },
        flowers: [],
        vestStyles: [],
        vestMaterials: [],
        vestColors: [],
        vestLapels: [],
        vestPockets: [],
        vestDecorations: [],
      };

      selectedItemsData.forEach((item) => {
        const itemData = { _id: item._id, name: item.name, image: item.image };

        switch (item.category) {
          case "Địa điểm":
            selectionData.weddingVenues.push(itemData);
            break;
          case "Phong cách":
            selectionData.weddingThemes.push(itemData);
            break;
          case "Tone màu - Đám cưới":
            selectionData.weddingToneColors.push(itemData);
            break;
          case "Tone màu - Lễ ăn hỏi":
            selectionData.engageToneColors.push(itemData);
            break;
          case "Áo dài - Kiểu dáng":
            selectionData.brideEngageStyles.push(itemData);
            break;
          case "Áo dài - Chất liệu":
            selectionData.brideEngageMaterials.push(itemData);
            break;
          case "Áo dài - Hoa văn":
            selectionData.brideEngagePatterns.push(itemData);
            break;
          case "Áo dài - Khăn đội đầu":
            selectionData.brideEngageHeadwears.push(itemData);
            break;
          case "Lễ ăn hỏi - Trang phục chú rể":
            selectionData.groomEngageOutfits.push(itemData);
            break;
          case "Lễ ăn hỏi - Phụ kiện chú rể":
            selectionData.groomEngageAccessories.push(itemData);
            break;
          case "Váy cưới - Kiểu dáng":
            selectionData.styles.push(itemData);
            break;
          case "Váy cưới - Chất liệu":
            selectionData.materials.push(itemData);
            break;
          case "Váy cưới - Cổ áo":
            selectionData.necklines.push(itemData);
            break;
          case "Váy cưới - Chi tiết":
            selectionData.details.push(itemData);
            break;
          case "Voan cưới":
            selectionData.accessories.veils.push(itemData);
            break;
          case "Trang sức":
            selectionData.accessories.jewelries.push(itemData);
            break;
          case "Kẹp tóc":
            selectionData.accessories.hairpins.push(itemData);
            break;
          case "Vương miện":
            selectionData.accessories.crowns.push(itemData);
            break;
          case "Hoa cưới":
            selectionData.flowers.push(itemData);
            break;
          case "Vest - Kiểu dáng":
            selectionData.vestStyles.push(itemData);
            break;
          case "Vest - Chất liệu":
            selectionData.vestMaterials.push(itemData);
            break;
          case "Vest - Màu sắc":
            selectionData.vestColors.push(itemData);
            break;
          case "Vest - Ve áo":
            selectionData.vestLapels.push(itemData);
            break;
          case "Vest - Túi ngực, túi hông,..":
            selectionData.vestPockets.push(itemData);
            break;
          case "Vest - Trang trí":
            selectionData.vestDecorations.push(itemData);
            break;
        }
      });

      // Create UserSelections for each type and collect their IDs
      const createdSelectionIds: string[] = [];

      // Wedding dress selection
      if (
        selectionData.styles.length > 0 ||
        selectionData.materials.length > 0 ||
        selectionData.necklines.length > 0 ||
        selectionData.details.length > 0 ||
        selectionData.accessories.veils.length > 0 ||
        selectionData.accessories.jewelries.length > 0 ||
        selectionData.accessories.hairpins.length > 0 ||
        selectionData.accessories.crowns.length > 0 ||
        selectionData.flowers.length > 0
      ) {
        const weddingDressRes = await userSelectionService.createSelection(
          {
            styleIds: selectionData.styles.map((s: any) => s._id),
            materialIds: selectionData.materials.map((m: any) => m._id),
            necklineIds: selectionData.necklines.map((n: any) => n._id),
            detailIds: selectionData.details.map((d: any) => d._id),
            veilIds: selectionData.accessories.veils.map((v: any) => v._id),
            jewelryIds: selectionData.accessories.jewelries.map(
              (j: any) => j._id
            ),
            hairpinIds: selectionData.accessories.hairpins.map(
              (h: any) => h._id
            ),
            crownIds: selectionData.accessories.crowns.map((c: any) => c._id),
            flowerIds: selectionData.flowers.map((f: any) => f._id),
          },
          "wedding-dress"
        );
        if (weddingDressRes.success && weddingDressRes.data?._id) {
          createdSelectionIds.push(weddingDressRes.data._id);
        }
      }

      // Vest selection
      if (
        selectionData.vestStyles.length > 0 ||
        selectionData.vestMaterials.length > 0 ||
        selectionData.vestColors.length > 0 ||
        selectionData.vestLapels.length > 0 ||
        selectionData.vestPockets.length > 0 ||
        selectionData.vestDecorations.length > 0
      ) {
        const vestRes = await userSelectionService.createSelection(
          {
            vestStyleIds: selectionData.vestStyles.map((s: any) => s._id),
            vestMaterialIds: selectionData.vestMaterials.map((m: any) => m._id),
            vestColorIds: selectionData.vestColors.map((c: any) => c._id),
            vestLapelIds: selectionData.vestLapels.map((l: any) => l._id),
            vestPocketIds: selectionData.vestPockets.map((p: any) => p._id),
            vestDecorationIds: selectionData.vestDecorations.map(
              (d: any) => d._id
            ),
          },
          "vest"
        );
        if (vestRes.success && vestRes.data?._id) {
          createdSelectionIds.push(vestRes.data._id);
        }
      }

      // Bride engage selection
      if (
        selectionData.brideEngageStyles.length > 0 ||
        selectionData.brideEngageMaterials.length > 0 ||
        selectionData.brideEngagePatterns.length > 0 ||
        selectionData.brideEngageHeadwears.length > 0
      ) {
        const brideEngageRes = await userSelectionService.createSelection(
          {
            brideEngageStyleIds: selectionData.brideEngageStyles.map(
              (s: any) => s._id
            ),
            brideEngageMaterialIds: selectionData.brideEngageMaterials.map(
              (m: any) => m._id
            ),
            brideEngagePatternIds: selectionData.brideEngagePatterns.map(
              (p: any) => p._id
            ),
            brideEngageHeadwearIds: selectionData.brideEngageHeadwears.map(
              (h: any) => h._id
            ),
          },
          "bride-engage"
        );
        if (brideEngageRes.success && brideEngageRes.data?._id) {
          createdSelectionIds.push(brideEngageRes.data._id);
        }
      }

      // Groom engage selection
      if (
        selectionData.groomEngageOutfits.length > 0 ||
        selectionData.groomEngageAccessories.length > 0
      ) {
        const groomEngageRes = await userSelectionService.createSelection(
          {
            groomEngageOutfitIds: selectionData.groomEngageOutfits.map(
              (o: any) => o._id
            ),
            groomEngageAccessoryIds: selectionData.groomEngageAccessories.map(
              (a: any) => a._id
            ),
          },
          "groom-engage"
        );
        if (groomEngageRes.success && groomEngageRes.data?._id) {
          createdSelectionIds.push(groomEngageRes.data._id);
        }
      }

      // Tone color selection
      if (
        selectionData.weddingToneColors.length > 0 ||
        selectionData.engageToneColors.length > 0
      ) {
        const toneColorRes = await userSelectionService.createSelection(
          {
            weddingToneColorIds: selectionData.weddingToneColors.map(
              (t: any) => t._id
            ),
            engageToneColorIds: selectionData.engageToneColors.map(
              (t: any) => t._id
            ),
          },
          "tone-color"
        );
        if (toneColorRes.success && toneColorRes.data?._id) {
          createdSelectionIds.push(toneColorRes.data._id);
        }
      }

      // Wedding venue selection
      if (selectionData.weddingVenues.length > 0) {
        const venueRes = await userSelectionService.createSelection(
          {
            weddingVenueIds: selectionData.weddingVenues.map((v: any) => v._id),
          },
          "wedding-venue"
        );
        if (venueRes.success && venueRes.data?._id) {
          createdSelectionIds.push(venueRes.data._id);
        }
      }

      // Wedding theme selection
      if (selectionData.weddingThemes.length > 0) {
        const themeRes = await userSelectionService.createSelection(
          {
            weddingThemeIds: selectionData.weddingThemes.map((t: any) => t._id),
          },
          "wedding-theme"
        );
        if (themeRes.success && themeRes.data?._id) {
          createdSelectionIds.push(themeRes.data._id);
        }
      }

      if (createdSelectionIds.length === 0) {
        throw new Error("Không thể tạo selections");
      }

      // Create album with metadata and selections
      const createdAlbum = await albumService.createAlbum({
        name: albumName,
        authorName: authorName || "",
        coverImage: coverImage || "",
        selections: createdSelectionIds,
        isPublic: false,
      });

      Alert.alert(
        "Thành công",
        "Đã tạo album thành công với tất cả lựa chọn!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error saving album:", error);
      Alert.alert("Lỗi", error.message || "Không thể tạo album");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (categoryFilter.length === 0) {
      return allItems;
    }
    return allItems.filter((it) => categoryFilter.includes(it.category));
  }, [allItems, categoryFilter]);

  const pagedItems = useMemo(() => {
    return filteredItems.slice(0, Math.min(visibleCount, filteredItems.length));
  }, [filteredItems, visibleCount]);

  const renderItem = (item: ItemWithCategory) => {
    const isSelected = selectedItems.has(item._id);

    const displayCategory = (() => {
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
        "Vest - Túi ngực, túi hông,..": "Túi áo Vest",
        "Vest - Trang trí": "Trang trí Vest",
      };
      return categoryMap[item.category] || item.category;
    })();

    return (
      <View style={styles.itemWrapper}>
        <WeddingItemCard
          id={item._id}
          name={item.name}
          image={item.image}
          isSelected={isSelected}
          onSelect={() => handleToggleSelection(item._id)}
          showPinButton={false}
        />
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
        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <AntDesign
              name="checkcircle"
              size={responsiveFont(20)}
              color="#F9CBD6"
            />
          </View>
        )}
      </View>
    );
  };

  const topPad =
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 0;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F9CBD6" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
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
          <Text style={styles.headerTitle}>Tạo Album Nhanh</Text>
          <Text style={styles.headerSubtitle}>
            Đã chọn: {selectedItems.size}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.importButton}
          onPress={() => setShowImportModal(true)}
        >
          <Download size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
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

            <FlatList
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item: category }) => (
                <TouchableOpacity
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
              )}
            />

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

      {/* Album Metadata Modal */}
      <CreateAlbumModal
        visible={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
        onCreated={handleConfirmSave}
        initialName={`Album ${new Date().getTime()}`}
        isEdit={true}
      />

      {/* Import Album Modal */}
      <Modal
        visible={showImportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Album</Text>
              <TouchableOpacity onPress={() => setShowImportModal(false)}>
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.importContainer}>
              <Text style={styles.importLabel}>
                Nhập mã share code (8 ký tự):
              </Text>
              <TextInput
                style={styles.importInput}
                value={importCode}
                onChangeText={setImportCode}
                placeholder="VD: ABC12345"
                placeholderTextColor="#9CA3AF"
                maxLength={8}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={styles.importHint}>
                Nhập mã chia sẻ để sao chép album từ người khác
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setShowImportModal(false);
                  setImportCode("");
                }}
              >
                <Text style={styles.clearButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  isImporting && styles.applyButtonDisabled,
                ]}
                onPress={handleImportAlbum}
                disabled={isImporting || !importCode.trim()}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#1f2937" />
                ) : (
                  <Text style={styles.applyButtonText}>Import</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Items Grid */}
      <FlatList
        data={pagedItems}
        keyExtractor={(item) => item._id}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={({ item }) => renderItem(item)}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews
        windowSize={5}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={80}
        getItemLayout={(data, index) => {
          const cardHeight = getItemHeight() + 24 + 40;
          const row = Math.floor(index / 3);
          return { length: cardHeight, offset: cardHeight * row, index };
        }}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (visibleCount < filteredItems.length) {
            setVisibleCount((c) => Math.min(c + 12, filteredItems.length));
          }
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* Save Button */}
      <View
        style={[
          styles.saveButtonContainer,
          {
            paddingBottom:
              Platform.OS === "android"
                ? Math.max(insets.bottom, spacing.md)
                : spacing.md,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            selectedItems.size === 0 && styles.saveButtonDisabled,
          ]}
          onPress={handleSaveAlbum}
          disabled={selectedItems.size === 0 || isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              Lưu Album ({selectedItems.size})
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
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
    fontSize: responsiveFont(12),
    fontFamily: fonts.montserratMedium,
    color: "#F9CBD6",
    marginTop: spacing.xs / 2,
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
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: responsiveWidth(16),
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
  scrollContent: {
    paddingBottom: responsiveHeight(100),
    paddingTop: spacing.sm,
  },
  columnWrapper: {
    paddingHorizontal: responsiveWidth(16),
    gap: spacing.sm,
  },
  itemWrapper: {
    position: "relative",
    width: (width - responsiveWidth(32) - spacing.sm * 2) / 3,
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
  checkmarkContainer: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    borderRadius: 100,
    padding: 2,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: spacing.md,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  saveButton: {
    backgroundColor: "#F9CBD6",
    paddingVertical: spacing.md + 4,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveButtonText: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  importButton: {
    padding: spacing.xs,
  },
  importContainer: {
    padding: responsiveWidth(16),
    gap: spacing.md,
  },
  importLabel: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  importInput: {
    backgroundColor: "#F3F4F6",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    fontSize: responsiveFont(18),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
    textAlign: "center",
    letterSpacing: 2,
    borderWidth: 2,
    borderColor: "#F9CBD6",
  },
  importHint: {
    fontSize: responsiveFont(12),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
    textAlign: "center",
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
});

export default TestCreateAlbum;
