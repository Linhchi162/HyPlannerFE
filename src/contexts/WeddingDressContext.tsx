import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Style, Material, Neckline, Detail } from "../store/weddingCostume";
import * as weddingCostumeService from "../service/weddingCostumeService";

interface WeddingDressContextType {
  styles: Style[];
  materials: Material[];
  necklines: Neckline[];
  details: Detail[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  retryFetch: () => Promise<void>;
}

const WeddingDressContext = createContext<WeddingDressContextType | undefined>(
  undefined
);

export const useWeddingDress = () => {
  const context = useContext(WeddingDressContext);
  if (!context) {
    throw new Error(
      "useWeddingDress must be used within a WeddingDressProvider"
    );
  }
  return context;
};

interface WeddingDressProviderProps {
  children: ReactNode;
}

export const WeddingDressProvider = ({
  children,
}: WeddingDressProviderProps) => {
  const [styles, setStyles] = useState<Style[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [necklines, setNecklines] = useState<Neckline[]>([]);
  const [details, setDetails] = useState<Detail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [stylesRes, materialsRes, necklinesRes, detailsRes] =
        await Promise.all([
          weddingCostumeService.getAllStyles(),
          weddingCostumeService.getAllMaterials(),
          weddingCostumeService.getAllNecklines(),
          weddingCostumeService.getAllDetails(),
        ]);

      if (stylesRes.success) setStyles(stylesRes.data);
      if (materialsRes.success) setMaterials(materialsRes.data);
      if (necklinesRes.success) setNecklines(necklinesRes.data);
      if (detailsRes.success) setDetails(detailsRes.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
          ? String(err.message)
          : "Failed to fetch wedding dress data";

      setError(errorMessage);
      console.error("Error fetching wedding dress data:", err);
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = async () => {
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  const value = {
    styles,
    materials,
    necklines,
    details,
    loading,
    error,
    refreshData: fetchData,
    retryFetch,
  };

  return (
    <WeddingDressContext.Provider value={value}>
      {children}
    </WeddingDressContext.Provider>
  );
};
