import React, { createContext, useContext, useState } from "react";
import * as userSelectionService from "../service/userSelectionService";
import * as albumService from "../service/albumService";

// Define the sequential steps in the wizard (20 screens total)
export enum AlbumWizardStep {
  NOT_STARTED = 0,
  LOCATION = 1, // LocationScreen
  STYLE = 2, // StyleScreen
  TONE_COLOR = 3, // ColorToneScreen
  BRIDE_AODAI_STYLE = 4, // BrideAoDaiStyleScreen
  BRIDE_AODAI_MATERIAL = 5, // BrideAoDaiMaterialScreen
  BRIDE_AODAI_PATTERN = 6, // BrideAoDaiPatternScreen
  BRIDE_HEADSCARF = 7, // BrideHeadscarfScreen
  GROOM_ENGAGE_OUTFIT = 8, // GroomEngagementOutfitScreen
  GROOM_ENGAGE_ACCESS = 9, // GroomEngagementAccessoriesScreen
  WEDDING_DRESS = 10, // WeddingDressScreen
  WEDDING_MATERIAL = 11, // WeddingMaterialScreen
  WEDDING_NECKLINE = 12, // WeddingNecklineScreen
  WEDDING_DETAIL = 13, // WeddingDetailScreen
  ACCESSORIES_VEIL = 14, // AccessoriesScreen (Voan)
  ACCESSORIES_JEWELRY = 15, // AccessoriesJewelryScreen
  ACCESSORIES_CROWN = 16, // AccessoriesCrownScreen
  ACCESSORIES_HAIRCLIP = 17, // AccessoriesHairClipScreen
  WEDDING_FLOWERS = 18, // WeddingFlowersScreen
  GROOM_SUIT = 19, // GroomSuitScreen
  GROOM_MATERIAL = 20, // GroomMaterialScreen
  GROOM_COLOR = 21, // GroomColorScreen
  GROOM_LAPEL = 22, // GroomAccessoriesLapelScreen
  GROOM_POCKET = 23, // GroomAccessoriesPocketSquareScreen
  GROOM_DECOR = 24, // GroomAccessoriesDecorScreen
  COMPLETED = 25,
}

interface AlbumCreationContextType {
  isCreatingAlbum: boolean;
  currentStep: AlbumWizardStep;
  startAlbumCreation: () => void;
  goToStep: (step: AlbumWizardStep) => boolean;
  nextStep: () => boolean;
  completeAlbumCreation: () => Promise<void>;
  cancelAlbumCreation: () => void;
  resetAlbumCreation: () => void;
  canProceedToNextStep: () => boolean;
  isLastStep: () => boolean;
}

const AlbumCreationContext = createContext<
  AlbumCreationContextType | undefined
>(undefined);

export const AlbumCreationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [currentStep, setCurrentStep] = useState<AlbumWizardStep>(
    AlbumWizardStep.NOT_STARTED
  );

  const startAlbumCreation = () => {
    setIsCreatingAlbum(true);
    setCurrentStep(AlbumWizardStep.LOCATION);
  };

  // Only allow sequential navigation - cannot skip steps
  const goToStep = (targetStep: AlbumWizardStep): boolean => {
    // Cannot go backward or skip forward
    if (targetStep <= currentStep || targetStep > currentStep + 1) {
      return false;
    }
    setCurrentStep(targetStep);
    return true;
  };

  const nextStep = (): boolean => {
    if (currentStep >= AlbumWizardStep.GROOM_DECOR) {
      return false; // Already at last step
    }
    setCurrentStep((prev) => prev + 1);
    return true;
  };

  const canProceedToNextStep = (): boolean => {
    return currentStep < AlbumWizardStep.GROOM_DECOR;
  };

  const isLastStep = (): boolean => {
    return currentStep === AlbumWizardStep.GROOM_DECOR; // Step 24
  };

  const completeAlbumCreation = async () => {
    // Only allow completion if on the last step
    if (currentStep !== AlbumWizardStep.GROOM_DECOR) {
      throw new Error(
        "Bạn phải hoàn thành tất cả các bước trước khi lưu album"
      );
    }

    // Just reset state - album creation will be handled by AlbumWizardCompleteScreen
    setIsCreatingAlbum(false);
    setCurrentStep(AlbumWizardStep.NOT_STARTED);
  };

  const cancelAlbumCreation = () => {
    setIsCreatingAlbum(false);
    setCurrentStep(AlbumWizardStep.NOT_STARTED);
  };

  const resetAlbumCreation = () => {
    setIsCreatingAlbum(false);
    setCurrentStep(AlbumWizardStep.NOT_STARTED);
  };

  return (
    <AlbumCreationContext.Provider
      value={{
        isCreatingAlbum,
        currentStep,
        startAlbumCreation,
        goToStep,
        nextStep,
        completeAlbumCreation,
        cancelAlbumCreation,
        resetAlbumCreation,
        canProceedToNextStep,
        isLastStep,
      }}
    >
      {children}
    </AlbumCreationContext.Provider>
  );
};

export const useAlbumCreation = () => {
  const context = useContext(AlbumCreationContext);
  if (context === undefined) {
    throw new Error(
      "useAlbumCreation must be used within an AlbumCreationProvider"
    );
  }
  return context;
};
