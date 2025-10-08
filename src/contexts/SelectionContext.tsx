import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as userSelectionService from '../service/userSelectionService';

interface SelectionContextType {
  // State for tracking selected items
  selectedStyles: string[];
  selectedMaterials: string[];
  selectedNecklines: string[];
  selectedDetails: string[];
  selectedVeils: string[];
  selectedJewelry: string[];
  selectedHairpins: string[];
  selectedCrowns: string[];
  selectedFlowers: string[];
  selectedColors: string[];
  // Tone color selections
  selectedWeddingToneColors: string[];
  selectedEngageToneColors: string[];
  // Groom-specific
  selectedGroomLapel: string[];
  selectedGroomPocketSquare: string[];
  selectedGroomDecor: string[];
  selectedGroomVestStyles: string[];
  selectedGroomVestMaterials: string[];
  selectedGroomVestColors: string[];
  
  // Bride-engage specific
  selectedBrideEngageStyles: string[];
  selectedBrideEngageMaterials: string[];
  selectedBrideEngagePatterns: string[];
  selectedBrideEngageHeadwears: string[];
  
  // Groom-engage specific
  selectedGroomEngageOutfits: string[];
  selectedGroomEngageAccessories: string[];
  
  // Actions
  toggleStyleSelection: (styleId: string) => Promise<void>;
  toggleMaterialSelection: (materialId: string) => Promise<void>;
  toggleNecklineSelection: (necklineId: string) => Promise<void>;
  toggleDetailSelection: (detailId: string) => Promise<void>;
  toggleVeilSelection: (veilId: string) => Promise<void>;
  toggleJewelrySelection: (jewelryId: string) => Promise<void>;
  toggleHairpinSelection: (hairpinId: string) => Promise<void>;
  toggleCrownSelection: (crownId: string) => Promise<void>;
  toggleFlowerSelection: (flowerId: string) => Promise<void>;
  toggleColorSelection: (colorId: string) => Promise<void>;
  // Tone color toggles
  toggleWeddingToneColor: (id: string) => Promise<void>;
  toggleEngageToneColor: (id: string) => Promise<void>;
  // Groom-specific toggles
  toggleGroomLapel: (id: string) => Promise<void>;
  toggleGroomPocketSquare: (id: string) => Promise<void>;
  toggleGroomDecor: (id: string) => Promise<void>;
  toggleGroomVestStyle: (id: string) => Promise<void>;
  toggleGroomVestMaterial: (id: string) => Promise<void>;
  toggleGroomVestColor: (id: string) => Promise<void>;
  
  // Bride-engage toggles
  toggleBrideEngageStyle: (id: string) => Promise<void>;
  toggleBrideEngageMaterial: (id: string) => Promise<void>;
  toggleBrideEngagePattern: (id: string) => Promise<void>;
  toggleBrideEngageHeadwear: (id: string) => Promise<void>;
  
  // Groom-engage toggles
  toggleGroomEngageOutfit: (id: string) => Promise<void>;
  toggleGroomEngageAccessory: (id: string) => Promise<void>;
  
  // Save selections
  saveSelections: () => Promise<void>;
  
  // Create album
  createAlbum: (type: 'wedding-dress' | 'vest' | 'bride-engage' | 'groom-engage' | 'tone-color') => Promise<void>;
  
  // Clear all selections
  clearSelections: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const SelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedNecklines, setSelectedNecklines] = useState<string[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<string[]>([]);
  const [selectedVeils, setSelectedVeils] = useState<string[]>([]);
  const [selectedJewelry, setSelectedJewelry] = useState<string[]>([]);
  const [selectedHairpins, setSelectedHairpins] = useState<string[]>([]);
  const [selectedCrowns, setSelectedCrowns] = useState<string[]>([]);
  const [selectedFlowers, setSelectedFlowers] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  // Tone color
  const [selectedWeddingToneColors, setSelectedWeddingToneColors] = useState<string[]>([]);
  const [selectedEngageToneColors, setSelectedEngageToneColors] = useState<string[]>([]);
  // Groom-specific
  const [selectedGroomLapel, setSelectedGroomLapel] = useState<string[]>([]);
  const [selectedGroomPocketSquare, setSelectedGroomPocketSquare] = useState<string[]>([]);
  const [selectedGroomDecor, setSelectedGroomDecor] = useState<string[]>([]);
  const [selectedGroomVestStyles, setSelectedGroomVestStyles] = useState<string[]>([]);
  const [selectedGroomVestMaterials, setSelectedGroomVestMaterials] = useState<string[]>([]);
  const [selectedGroomVestColors, setSelectedGroomVestColors] = useState<string[]>([]);
  
  // Bride-engage specific
  const [selectedBrideEngageStyles, setSelectedBrideEngageStyles] = useState<string[]>([]);
  const [selectedBrideEngageMaterials, setSelectedBrideEngageMaterials] = useState<string[]>([]);
  const [selectedBrideEngagePatterns, setSelectedBrideEngagePatterns] = useState<string[]>([]);
  const [selectedBrideEngageHeadwears, setSelectedBrideEngageHeadwears] = useState<string[]>([]);
  
  // Groom-engage specific
  const [selectedGroomEngageOutfits, setSelectedGroomEngageOutfits] = useState<string[]>([]);
  const [selectedGroomEngageAccessories, setSelectedGroomEngageAccessories] = useState<string[]>([]);
  
  const [hasExistingSelection, setHasExistingSelection] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef<boolean>(false);
  const needsResaveRef = useRef<boolean>(false);
  const dirtyWeddingRef = useRef<boolean>(false);
  const dirtyVestRef = useRef<boolean>(false);
  const dirtyBrideEngageRef = useRef<boolean>(false);
  const dirtyGroomEngageRef = useRef<boolean>(false);
  const dirtyToneColorRef = useRef<boolean>(false);

  // Load existing selections on mount
  useEffect(() => {
    const loadExistingSelections = async () => {
      try {
        // Check if user is logged in before making API call
        const token = await AsyncStorage.getItem('token');
        if (!token) {
          return; // Don't make API call if no token
        }
        
        const response = await userSelectionService.getUserSelections();
        if (response && response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
          // Get the most recent selection (last one)
          const selection = response.data[response.data.length - 1];
          if (selection && selection._id) {
            setSelectedStyles(selection.styles || []);
            setSelectedMaterials(selection.materials || []);
            setSelectedNecklines(selection.necklines || []);
            setSelectedDetails(selection.details || []);
            setSelectedVeils(selection.accessories?.veils || []);
            setSelectedJewelry(selection.accessories?.jewelries || []);
            setSelectedHairpins(selection.accessories?.hairpins || []);
            setSelectedCrowns(selection.accessories?.crowns || []);
            setSelectedFlowers(selection.flowers || []);
            // Groom-specific selections are local-only for now
            setHasExistingSelection(true);
          }
        }
      } catch (error) {
        // Silently handle auth errors - user might not be logged in yet
      }
    };

    loadExistingSelections();
  }, []);

  const toggleSelection = useCallback((items: string[], setItems: React.Dispatch<React.SetStateAction<string[]>>, itemId: string) => {
    setItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  // Helper function to save all current selections to API (single-flight)
  const saveAllSelections = useCallback(async () => {
    if (isSavingRef.current) {
      // If a save is in progress, mark to run again afterward
      needsResaveRef.current = true;
      return;
    }
    isSavingRef.current = true;
    try {
      // Split by type
      const hasWeddingSelections =
        selectedStyles.length > 0 || selectedMaterials.length > 0 ||
        selectedNecklines.length > 0 || selectedDetails.length > 0 ||
        selectedVeils.length > 0 || selectedJewelry.length > 0 ||
        selectedHairpins.length > 0 || selectedCrowns.length > 0 ||
        selectedFlowers.length > 0;

      const hasVestSelections =
        selectedGroomVestStyles.length > 0 ||
        selectedGroomVestMaterials.length > 0 ||
        selectedGroomVestColors.length > 0 ||
        selectedGroomLapel.length > 0 ||
        selectedGroomPocketSquare.length > 0 ||
        selectedGroomDecor.length > 0;

      const hasBrideEngageSelections =
        selectedBrideEngageStyles.length > 0 ||
        selectedBrideEngageMaterials.length > 0 ||
        selectedBrideEngagePatterns.length > 0 ||
        selectedBrideEngageHeadwears.length > 0;

      const hasToneColorSelections =
        selectedWeddingToneColors.length > 0 || selectedEngageToneColors.length > 0;

      if (dirtyWeddingRef.current && hasWeddingSelections) {
        await userSelectionService.deleteSelection('wedding-dress');
        await userSelectionService.createSelection({
          styleIds: Array.from(new Set(selectedStyles)),
          materialIds: Array.from(new Set(selectedMaterials)),
          necklineIds: Array.from(new Set(selectedNecklines)),
          detailIds: Array.from(new Set(selectedDetails)),
          veilIds: Array.from(new Set(selectedVeils)),
          jewelryIds: Array.from(new Set(selectedJewelry)),
          hairpinIds: Array.from(new Set(selectedHairpins)),
          crownIds: Array.from(new Set(selectedCrowns)),
          flowerIds: Array.from(new Set(selectedFlowers)),
        }, 'wedding-dress');
        dirtyWeddingRef.current = false;
      }

      if (dirtyVestRef.current && hasVestSelections) {
        await userSelectionService.deleteSelection('vest');
        await userSelectionService.createSelection({
          vestStyleIds: Array.from(new Set(selectedGroomVestStyles)),
          vestMaterialIds: Array.from(new Set(selectedGroomVestMaterials)),
          vestColorIds: Array.from(new Set(selectedGroomVestColors)),
          vestLapelIds: Array.from(new Set(selectedGroomLapel)),
          vestPocketIds: Array.from(new Set(selectedGroomPocketSquare)),
          vestDecorationIds: Array.from(new Set(selectedGroomDecor)),
        }, 'vest');
        dirtyVestRef.current = false;
      }

      if (dirtyBrideEngageRef.current && hasBrideEngageSelections) {
        await userSelectionService.deleteSelection('bride-engage');
        await userSelectionService.createSelection({
          brideEngageStyleIds: Array.from(new Set(selectedBrideEngageStyles)),
          brideEngageMaterialIds: Array.from(new Set(selectedBrideEngageMaterials)),
          brideEngagePatternIds: Array.from(new Set(selectedBrideEngagePatterns)),
          brideEngageHeadwearIds: Array.from(new Set(selectedBrideEngageHeadwears)),
        }, 'bride-engage');
        dirtyBrideEngageRef.current = false;
      }

      const hasGroomEngageSelections = selectedGroomEngageOutfits.length > 0 || selectedGroomEngageAccessories.length > 0;
      if (dirtyGroomEngageRef.current && hasGroomEngageSelections) {
        await userSelectionService.deleteSelection('groom-engage');
        await userSelectionService.createSelection({
          groomEngageOutfitIds: Array.from(new Set(selectedGroomEngageOutfits)),
          groomEngageAccessoryIds: Array.from(new Set(selectedGroomEngageAccessories)),
        }, 'groom-engage');
        dirtyGroomEngageRef.current = false;
      }

      if (dirtyToneColorRef.current && hasToneColorSelections) {
        await userSelectionService.createSelection({
          weddingToneColorIds: Array.from(new Set(selectedWeddingToneColors)),
          engageToneColorIds: Array.from(new Set(selectedEngageToneColors)),
        }, 'tone-color');
        dirtyToneColorRef.current = false;
      }

      setHasExistingSelection(
        hasWeddingSelections || hasVestSelections || hasBrideEngageSelections || hasGroomEngageSelections || hasToneColorSelections
      );
    } catch (error) {
      console.error('Error saving selections:', error);
    } finally {
      isSavingRef.current = false;
      if (needsResaveRef.current) {
        needsResaveRef.current = false;
        // Run a follow-up save to capture the latest state
        // Avoid tight loops by scheduling on next tick
        setTimeout(() => {
          void saveAllSelections();
        }, 0);
      }
    }
  }, [selectedStyles, selectedMaterials, selectedNecklines, selectedDetails, selectedVeils, selectedJewelry, selectedHairpins, selectedCrowns, selectedFlowers, selectedGroomVestStyles, selectedGroomVestMaterials, selectedGroomVestColors, selectedGroomLapel, selectedGroomPocketSquare, selectedGroomDecor, selectedBrideEngageStyles, selectedBrideEngageMaterials, selectedBrideEngagePatterns, selectedBrideEngageHeadwears, selectedGroomEngageOutfits, selectedGroomEngageAccessories]);

  // Debounce helper (keep state local until album creation)
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  }, []);

  const toggleStyleSelection = useCallback(async (styleId: string) => {
    toggleSelection(selectedStyles, setSelectedStyles, styleId);
    dirtyWeddingRef.current = true;
    scheduleSave();
  }, [selectedStyles, toggleSelection, scheduleSave]);

  const toggleMaterialSelection = useCallback(async (materialId: string) => {
    toggleSelection(selectedMaterials, setSelectedMaterials, materialId);
    dirtyWeddingRef.current = true;
    scheduleSave();
  }, [selectedMaterials, toggleSelection, scheduleSave]);

  const toggleNecklineSelection = useCallback(async (necklineId: string) => {
    toggleSelection(selectedNecklines, setSelectedNecklines, necklineId);
    dirtyWeddingRef.current = true;
    scheduleSave();
  }, [selectedNecklines, toggleSelection, scheduleSave]);

  const toggleDetailSelection = useCallback(async (detailId: string) => {
    toggleSelection(selectedDetails, setSelectedDetails, detailId);
    dirtyWeddingRef.current = true;
    scheduleSave();
  }, [selectedDetails, toggleSelection, scheduleSave]);

  const toggleVeilSelection = useCallback(async (veilId: string) => {
    toggleSelection(selectedVeils, setSelectedVeils, veilId);
    dirtyWeddingRef.current = true;
    scheduleSave();
  }, [selectedVeils, toggleSelection, scheduleSave]);

  const toggleJewelrySelection = useCallback(async (jewelryId: string) => {
    toggleSelection(selectedJewelry, setSelectedJewelry, jewelryId);
    dirtyWeddingRef.current = true;
    scheduleSave();
  }, [selectedJewelry, toggleSelection, scheduleSave]);

  const toggleHairpinSelection = useCallback(async (hairpinId: string) => {
    toggleSelection(selectedHairpins, setSelectedHairpins, hairpinId);
    dirtyWeddingRef.current = true;
    scheduleSave();
  }, [selectedHairpins, toggleSelection, scheduleSave]);

  const toggleCrownSelection = useCallback(async (crownId: string) => {
    toggleSelection(selectedCrowns, setSelectedCrowns, crownId);
    dirtyWeddingRef.current = true;
    scheduleSave();
  }, [selectedCrowns, toggleSelection, scheduleSave]);

  const toggleFlowerSelection = useCallback(async (flowerId: string) => {
    toggleSelection(selectedFlowers, setSelectedFlowers, flowerId);
    dirtyWeddingRef.current = true;
    scheduleSave();
  }, [selectedFlowers, toggleSelection, scheduleSave]);

  const toggleColorSelection = useCallback(async (colorId: string) => {
    // Local-only, not persisted to API yet
    toggleSelection(selectedColors, setSelectedColors, colorId);
  }, [selectedColors, toggleSelection]);

  const toggleWeddingToneColor = useCallback(async (id: string) => {
    toggleSelection(selectedWeddingToneColors, setSelectedWeddingToneColors, id);
    dirtyToneColorRef.current = true;
    scheduleSave();
  }, [selectedWeddingToneColors, toggleSelection, scheduleSave]);

  const toggleEngageToneColor = useCallback(async (id: string) => {
    toggleSelection(selectedEngageToneColors, setSelectedEngageToneColors, id);
    dirtyToneColorRef.current = true;
    scheduleSave();
  }, [selectedEngageToneColors, toggleSelection, scheduleSave]);

  // Groom-specific (local-only for now)
  const toggleGroomLapel = useCallback(async (id: string) => {
    toggleSelection(selectedGroomLapel, setSelectedGroomLapel, id);
    dirtyVestRef.current = true;
    scheduleSave();
  }, [selectedGroomLapel, toggleSelection, scheduleSave]);

  const toggleGroomPocketSquare = useCallback(async (id: string) => {
    toggleSelection(selectedGroomPocketSquare, setSelectedGroomPocketSquare, id);
    dirtyVestRef.current = true;
    scheduleSave();
  }, [selectedGroomPocketSquare, toggleSelection, scheduleSave]);

  const toggleGroomDecor = useCallback(async (id: string) => {
    toggleSelection(selectedGroomDecor, setSelectedGroomDecor, id);
    dirtyVestRef.current = true;
    scheduleSave();
  }, [selectedGroomDecor, toggleSelection, scheduleSave]);

  const toggleGroomVestStyle = useCallback(async (id: string) => {
    toggleSelection(selectedGroomVestStyles, setSelectedGroomVestStyles, id);
    dirtyVestRef.current = true;
    scheduleSave();
  }, [selectedGroomVestStyles, toggleSelection, scheduleSave]);

  const toggleGroomVestMaterial = useCallback(async (id: string) => {
    toggleSelection(selectedGroomVestMaterials, setSelectedGroomVestMaterials, id);
    dirtyVestRef.current = true;
    scheduleSave();
  }, [selectedGroomVestMaterials, toggleSelection, scheduleSave]);

  const toggleGroomVestColor = useCallback(async (id: string) => {
    toggleSelection(selectedGroomVestColors, setSelectedGroomVestColors, id);
    dirtyVestRef.current = true;
    scheduleSave();
  }, [selectedGroomVestColors, toggleSelection, scheduleSave]);

  // Bride-engage toggles
  const toggleBrideEngageStyle = useCallback(async (id: string) => {
    toggleSelection(selectedBrideEngageStyles, setSelectedBrideEngageStyles, id);
    dirtyBrideEngageRef.current = true;
    scheduleSave();
  }, [selectedBrideEngageStyles, toggleSelection, scheduleSave]);

  const toggleBrideEngageMaterial = useCallback(async (id: string) => {
    toggleSelection(selectedBrideEngageMaterials, setSelectedBrideEngageMaterials, id);
    dirtyBrideEngageRef.current = true;
    scheduleSave();
  }, [selectedBrideEngageMaterials, toggleSelection, scheduleSave]);

  const toggleBrideEngagePattern = useCallback(async (id: string) => {
    toggleSelection(selectedBrideEngagePatterns, setSelectedBrideEngagePatterns, id);
    dirtyBrideEngageRef.current = true;
    scheduleSave();
  }, [selectedBrideEngagePatterns, toggleSelection, scheduleSave]);

  const toggleBrideEngageHeadwear = useCallback(async (id: string) => {
    toggleSelection(selectedBrideEngageHeadwears, setSelectedBrideEngageHeadwears, id);
    dirtyBrideEngageRef.current = true;
    scheduleSave();
  }, [selectedBrideEngageHeadwears, toggleSelection, scheduleSave]);

  // Groom-engage toggles
  const toggleGroomEngageOutfit = useCallback(async (id: string) => {
    toggleSelection(selectedGroomEngageOutfits, setSelectedGroomEngageOutfits, id);
    dirtyGroomEngageRef.current = true;
    scheduleSave();
  }, [selectedGroomEngageOutfits, toggleSelection, scheduleSave]);

  const toggleGroomEngageAccessory = useCallback(async (id: string) => {
    toggleSelection(selectedGroomEngageAccessories, setSelectedGroomEngageAccessories, id);
    dirtyGroomEngageRef.current = true;
    scheduleSave();
  }, [selectedGroomEngageAccessories, toggleSelection, scheduleSave]);

  const saveSelections = useCallback(async () => {
    try {
      // Save wedding-dress selections
      if (selectedStyles.length > 0 || selectedMaterials.length > 0 || selectedNecklines.length > 0 || 
          selectedDetails.length > 0 || selectedVeils.length > 0 || selectedJewelry.length > 0 ||
          selectedHairpins.length > 0 || selectedCrowns.length > 0 || selectedFlowers.length > 0) {
        try {
          await userSelectionService.deleteSelection('wedding-dress');
        } catch (error: any) {
          const status = error?.response?.status;
          const message = error?.message || '';
          const isNotFound = status === 404 || message === 'No pinned selection found' || message === 'No pinned wedding-dress selection found';
          if (!isNotFound) throw error;
        }
        
        await userSelectionService.createSelection({
          styleIds: selectedStyles,
          materialIds: selectedMaterials,
          necklineIds: selectedNecklines,
          detailIds: selectedDetails,
          veilIds: selectedVeils,
          jewelryIds: selectedJewelry,
          hairpinIds: selectedHairpins,
          crownIds: selectedCrowns,
          flowerIds: selectedFlowers,
        }, 'wedding-dress');
      }

      // Save vest selections
      if (selectedGroomVestStyles.length > 0 || selectedGroomVestMaterials.length > 0 || selectedGroomVestColors.length > 0 ||
          selectedGroomLapel.length > 0 || selectedGroomPocketSquare.length > 0 || selectedGroomDecor.length > 0) {
        try {
          await userSelectionService.deleteSelection('vest');
        } catch (error: any) {
          const status = error?.response?.status;
          const message = error?.message || '';
          const isNotFound = status === 404 || message === 'No pinned selection found' || message === 'No pinned vest selection found';
          if (!isNotFound) throw error;
        }
        
        await userSelectionService.createSelection({
          vestStyleIds: selectedGroomVestStyles,
          vestMaterialIds: selectedGroomVestMaterials,
          vestColorIds: selectedGroomVestColors,
          vestLapelIds: selectedGroomLapel,
          vestPocketIds: selectedGroomPocketSquare,
          vestDecorationIds: selectedGroomDecor,
        }, 'vest');
      }

      // Save bride-engage selections
      if (selectedBrideEngageStyles.length > 0 || selectedBrideEngageMaterials.length > 0 || 
          selectedBrideEngagePatterns.length > 0 || selectedBrideEngageHeadwears.length > 0) {
        try {
          await userSelectionService.deleteSelection('bride-engage');
        } catch (error: any) {
          const status = error?.response?.status;
          const message = error?.message || '';
          const isNotFound = status === 404 || message === 'No pinned selection found' || message === 'No pinned bride-engage selection found';
          if (!isNotFound) throw error;
        }
        
        await userSelectionService.createSelection({
          brideEngageStyleIds: selectedBrideEngageStyles,
          brideEngageMaterialIds: selectedBrideEngageMaterials,
          brideEngagePatternIds: selectedBrideEngagePatterns,
          brideEngageHeadwearIds: selectedBrideEngageHeadwears,
        }, 'bride-engage');
      }

      // Save groom-engage selections
      if (selectedGroomEngageOutfits.length > 0 || selectedGroomEngageAccessories.length > 0) {
        try {
          await userSelectionService.deleteSelection('groom-engage');
        } catch (error: any) {
          const status = error?.response?.status;
          const message = error?.message || '';
          const isNotFound = status === 404 || message === 'No pinned selection found' || message === 'No pinned groom-engage selection found';
          if (!isNotFound) throw error;
        }
        
        await userSelectionService.createSelection({
          groomEngageOutfitIds: selectedGroomEngageOutfits,
          groomEngageAccessoryIds: selectedGroomEngageAccessories,
        }, 'groom-engage');
      }
    } catch (error) {
      console.error('Error saving selections:', error);
      throw error;
    }
  }, [
    selectedStyles, selectedMaterials, selectedNecklines, selectedDetails,
    selectedVeils, selectedJewelry, selectedHairpins, selectedCrowns, selectedFlowers,
    selectedGroomVestStyles, selectedGroomVestMaterials, selectedGroomVestColors,
    selectedGroomLapel, selectedGroomPocketSquare, selectedGroomDecor,
    selectedBrideEngageStyles, selectedBrideEngageMaterials, selectedBrideEngagePatterns, selectedBrideEngageHeadwears,
    selectedGroomEngageOutfits, selectedGroomEngageAccessories
  ]);

  const clearSelections = useCallback(() => {
    setSelectedStyles([]);
    setSelectedMaterials([]);
    setSelectedNecklines([]);
    setSelectedDetails([]);
    setSelectedVeils([]);
    setSelectedJewelry([]);
    setSelectedHairpins([]);
    setSelectedCrowns([]);
    setSelectedFlowers([]);
    setSelectedColors([]);
    setSelectedWeddingToneColors([]);
    setSelectedEngageToneColors([]);
    setSelectedGroomLapel([]);
    setSelectedGroomPocketSquare([]);
    setSelectedGroomDecor([]);
    setSelectedGroomVestStyles([]);
    setSelectedGroomVestMaterials([]);
    setSelectedGroomVestColors([]);
    setSelectedBrideEngageStyles([]);
    setSelectedBrideEngageMaterials([]);
    setSelectedBrideEngagePatterns([]);
    setSelectedBrideEngageHeadwears([]);
    setSelectedGroomEngageOutfits([]);
    setSelectedGroomEngageAccessories([]);
    setHasExistingSelection(false);
  }, []);

  const createAlbum = useCallback(async (type: 'wedding-dress' | 'vest' | 'bride-engage' | 'groom-engage' | 'tone-color') => {
    try {
      // Check if we have any selections based on type
      let hasSelections = false;
      
      if (type === 'wedding-dress') {
        hasSelections = selectedStyles.length > 0 || selectedMaterials.length > 0 || 
                       selectedNecklines.length > 0 || selectedDetails.length > 0 ||
                       selectedVeils.length > 0 || selectedJewelry.length > 0 ||
                       selectedHairpins.length > 0 || selectedCrowns.length > 0 ||
                       selectedFlowers.length > 0;
      } else if (type === 'vest') {
        hasSelections = selectedGroomVestStyles.length > 0 || selectedGroomVestMaterials.length > 0 ||
                       selectedGroomVestColors.length > 0 || selectedGroomLapel.length > 0 ||
                       selectedGroomPocketSquare.length > 0 || selectedGroomDecor.length > 0;
      } else if (type === 'bride-engage') {
        hasSelections = selectedBrideEngageStyles.length > 0 || selectedBrideEngageMaterials.length > 0 ||
                       selectedBrideEngagePatterns.length > 0 || selectedBrideEngageHeadwears.length > 0;
      } else if (type === 'groom-engage') {
        hasSelections = selectedGroomEngageOutfits.length > 0 || selectedGroomEngageAccessories.length > 0;
      } else if (type === 'tone-color') {
        hasSelections = selectedWeddingToneColors.length > 0 || selectedEngageToneColors.length > 0;
      }
      
      if (!hasSelections) {
        throw new Error('Vui lòng chọn ít nhất một mục để tạo album');
      }

      // Persist only once at album creation time (handled below)
      
      // Get existing albums to auto-generate name
      let albumCount = 0;
      try {
        const albumsResponse = await userSelectionService.getUserAlbums();
        albumCount = albumsResponse.data.length;
      } catch (error) {
        console.warn('Could not get existing albums, using default count:', error);
      }
      
      const albumName = `Album ${albumCount + 1}`;
      
      // Create pinned selection from current state, then create album using that pin
      try {
        if (type === 'wedding-dress') {
          await userSelectionService.createSelection({
            styleIds: selectedStyles,
            materialIds: selectedMaterials,
            necklineIds: selectedNecklines,
            detailIds: selectedDetails,
            veilIds: selectedVeils,
            jewelryIds: selectedJewelry,
            hairpinIds: selectedHairpins,
            crownIds: selectedCrowns,
            flowerIds: selectedFlowers,
          }, 'wedding-dress');
        } else if (type === 'vest') {
          await userSelectionService.createSelection({
            vestStyleIds: selectedGroomVestStyles,
            vestMaterialIds: selectedGroomVestMaterials,
            vestColorIds: selectedGroomVestColors,
            vestLapelIds: selectedGroomLapel,
            vestPocketIds: selectedGroomPocketSquare,
            vestDecorationIds: selectedGroomDecor,
          }, 'vest');
        } else if (type === 'bride-engage') {
          await userSelectionService.createSelection({
            brideEngageStyleIds: selectedBrideEngageStyles,
            brideEngageMaterialIds: selectedBrideEngageMaterials,
            brideEngagePatternIds: selectedBrideEngagePatterns,
            brideEngageHeadwearIds: selectedBrideEngageHeadwears,
          }, 'bride-engage');
        } else if (type === 'groom-engage') {
          await userSelectionService.createSelection({
            groomEngageOutfitIds: selectedGroomEngageOutfits,
            groomEngageAccessoryIds: selectedGroomEngageAccessories,
          }, 'groom-engage');
        } else if (type === 'tone-color') {
          await userSelectionService.createSelection({
            weddingToneColorIds: selectedWeddingToneColors,
            engageToneColorIds: selectedEngageToneColors,
          }, 'tone-color');
        }

        const debugNote = type === 'wedding-dress'
          ? `WD counts -> styles:${selectedStyles.length}, materials:${selectedMaterials.length}, necklines:${selectedNecklines.length}, details:${selectedDetails.length}, veils:${selectedVeils.length}, jewelry:${selectedJewelry.length}, hairpins:${selectedHairpins.length}, crowns:${selectedCrowns.length}, flowers:${selectedFlowers.length}`
          : type === 'vest'
          ? `Vest counts -> styles:${selectedGroomVestStyles.length}, materials:${selectedGroomVestMaterials.length}, colors:${selectedGroomVestColors.length}, lapels:${selectedGroomLapel.length}, pockets:${selectedGroomPocketSquare.length}, decors:${selectedGroomDecor.length}`
          : type === 'bride-engage'
          ? `Bride-engage counts -> styles:${selectedBrideEngageStyles.length}, materials:${selectedBrideEngageMaterials.length}, patterns:${selectedBrideEngagePatterns.length}, headwears:${selectedBrideEngageHeadwears.length}`
          : `Groom-engage counts -> outfits:${selectedGroomEngageOutfits.length}, accessories:${selectedGroomEngageAccessories.length}`;

        await userSelectionService.createAlbum({
          name: albumName,
          note: debugNote,
          type,
        });
      } catch (error) {
        console.warn('Could not create album via API:', error);
        throw error;
      }
      // Clear selections after successful album creation
      clearSelections();
      
    } catch (error: any) {
      console.error('Error creating album:', error);
      throw new Error(error.message || 'Failed to create album');
    }
  }, [selectedStyles, selectedMaterials, selectedNecklines, selectedDetails, selectedVeils, selectedJewelry, selectedHairpins, selectedCrowns, selectedFlowers, selectedGroomVestStyles, selectedGroomVestMaterials, selectedGroomVestColors, selectedGroomLapel, selectedGroomPocketSquare, selectedGroomDecor, selectedBrideEngageStyles, selectedBrideEngageMaterials, selectedBrideEngagePatterns, selectedBrideEngageHeadwears, selectedWeddingToneColors, selectedEngageToneColors, saveSelections, clearSelections]);

  const value: SelectionContextType = {
    selectedStyles,
    selectedMaterials,
    selectedNecklines,
    selectedDetails,
    selectedVeils,
    selectedJewelry,
    selectedHairpins,
    selectedCrowns,
    selectedFlowers,
    selectedColors,
    selectedWeddingToneColors,
    selectedEngageToneColors,
    selectedGroomLapel,
    selectedGroomPocketSquare,
    selectedGroomDecor,
    selectedGroomVestStyles,
    selectedGroomVestMaterials,
    selectedGroomVestColors,
    selectedBrideEngageStyles,
    selectedBrideEngageMaterials,
    selectedBrideEngagePatterns,
    selectedBrideEngageHeadwears,
    selectedGroomEngageOutfits,
    selectedGroomEngageAccessories,
    toggleStyleSelection,
    toggleMaterialSelection,
    toggleNecklineSelection,
    toggleDetailSelection,
    toggleVeilSelection,
    toggleJewelrySelection,
    toggleHairpinSelection,
    toggleCrownSelection,
    toggleFlowerSelection,
    toggleColorSelection,
    toggleWeddingToneColor,
    toggleEngageToneColor,
    toggleGroomLapel,
    toggleGroomPocketSquare,
    toggleGroomDecor,
    toggleGroomVestStyle,
    toggleGroomVestMaterial,
    toggleGroomVestColor,
    toggleBrideEngageStyle,
    toggleBrideEngageMaterial,
    toggleBrideEngagePattern,
    toggleBrideEngageHeadwear,
    toggleGroomEngageOutfit,
    toggleGroomEngageAccessory,
    saveSelections,
    createAlbum,
    clearSelections,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};
