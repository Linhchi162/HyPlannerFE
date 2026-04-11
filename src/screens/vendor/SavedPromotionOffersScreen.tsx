import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import {
  Promotion,
  formatPromotionValidityHint,
  getPromotion,
  subscribeActivePromotions,
} from "../../service/promotionService";
import {
  getSavedPromotionEntries,
  removeSavedPromotion,
  type SavedPromotionEntry,
} from "../../service/savedPromotionsService";

type Nav = StackNavigationProp<RootStackParamList>;

type TabKey = "unused" | "used" | "voucher";

const TABS: { key: TabKey; label: string }[] = [
  { key: "unused", label: "Chưa sử dụng" },
  { key: "used", label: "Đã dùng" },
  { key: "voucher", label: "Voucher" },
];

function filterEntriesForTab(
  entries: SavedPromotionEntry[],
  tab: TabKey
): SavedPromotionEntry[] {
  return entries.filter((e) => {
    if (tab === "unused")
      return e.status === "unused" && !e.isVoucher;
    if (tab === "used") return e.status === "used";
    return e.status === "unused" && e.isVoucher === true;
  });
}

export default function SavedPromotionOffersScreen() {
  const navigation = useNavigation<Nav>();
  const [tab, setTab] = useState<TabKey>("unused");
  const [entries, setEntries] = useState<SavedPromotionEntry[]>([]);
  const [livePromos, setLivePromos] = useState<Promotion[]>([]);
  const [fetched, setFetched] = useState<Record<string, Promotion | null>>({});
  const [loadingList, setLoadingList] = useState(true);

  const refreshEntries = useCallback(async () => {
    setLoadingList(true);
    const list = await getSavedPromotionEntries();
    setEntries(list);
    setLoadingList(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshEntries();
    }, [refreshEntries])
  );

  useEffect(() => {
    const unsub = subscribeActivePromotions(setLivePromos);
    return () => unsub();
  }, []);

  useEffect(() => {
    const fromLive = new Set(livePromos.map((p) => p.id));
    const need = [
      ...new Set(
        entries.map((e) => e.promotionId).filter((id) => !fromLive.has(id))
      ),
    ];
    if (need.length === 0) {
      setFetched({});
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<string, Promotion | null> = {};
      await Promise.all(
        need.map(async (id) => {
          try {
            const p = await getPromotion(id);
            if (!cancelled) next[id] = p;
          } catch {
            if (!cancelled) next[id] = null;
          }
        })
      );
      if (!cancelled) setFetched(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [entries, livePromos]);

  const promoById = useMemo(() => {
    const m: Record<string, Promotion> = {};
    livePromos.forEach((p) => {
      m[p.id] = p;
    });
    Object.entries(fetched).forEach(([id, p]) => {
      if (p) m[id] = p;
    });
    return m;
  }, [livePromos, fetched]);

  const tabEntries = useMemo(
    () => filterEntriesForTab(entries, tab),
    [entries, tab]
  );

  const openPromotion = (promotionId: string) => {
    navigation.navigate("PromotionDetail", { promotionId });
  };

  const onUnsave = async (promotionId: string) => {
    await removeSavedPromotion(promotionId);
    await refreshEntries();
  };

  const renderRow = ({ item }: { item: SavedPromotionEntry }) => {
    const p = promoById[item.promotionId];
    const title =
      p?.title?.trim() || "Ưu đãi không còn hiển thị";
    const imageUri = p?.imageUrl?.trim() || "";
    const dateLine = p ? formatPromotionValidityHint(p) : "—";

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardMain}
          activeOpacity={0.9}
          onPress={() => openPromotion(item.promotionId)}
        >
          <View style={styles.thumbWrap}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.thumb}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]} />
            )}
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {title.toUpperCase()}
            </Text>
            <Text style={styles.cardDate}>{dateLine}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cardHeart}
          onPress={() => void onUnsave(item.promotionId)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AntDesign name="heart" size={18} color="#ff3f6c" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Image
        source={require("../../../assets/images/emtyBox.png")}
        style={styles.emptyImage}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>Chưa có dữ liệu hiển thị</Text>
      <Text style={styles.emptySubtitle}>
        Hiện tại chưa có dữ liệu cho phần này vui lòng thử lại sau bạn nhé...
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ưu đãi</Text>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => navigation.goBack()}
        >
          <Feather name="x" size={26} color="#111" />
        </TouchableOpacity>
      </View>

      <View style={styles.subHeader}>
        <TouchableOpacity
          style={styles.subBack}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="chevron-left" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.subTitle}>Ưu đãi đã lưu</Text>
        <View style={styles.subBackSpacer} />
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tabBtn}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t.label}
              </Text>
              {active ? <View style={styles.tabUnderline} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {loadingList ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#ff3f6c" />
        </View>
      ) : (
        <FlatList
          style={styles.listFlex}
          data={tabEntries}
          keyExtractor={(e) => e.promotionId}
          renderItem={renderRow}
          contentContainerStyle={
            tabEntries.length === 0
              ? styles.listContentEmpty
              : styles.listContent
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(18),
    paddingTop: responsiveHeight(10),
    paddingBottom: responsiveHeight(14),
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(22),
    color: "#ff3f6c",
  },
  subHeader: {
    backgroundColor: "#ff3f6c",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(8),
  },
  subBack: { width: responsiveWidth(40), alignItems: "center" },
  subBackSpacer: { width: responsiveWidth(40) },
  subTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(17),
    color: "#fff",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: responsiveWidth(8),
    paddingTop: responsiveHeight(8),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e8e0e3",
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    paddingBottom: responsiveHeight(0),
  },
  tabLabel: {
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(13),
    color: "#888",
  },
  tabLabelActive: {
    color: "#ff3f6c",
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  tabUnderline: {
    marginTop: responsiveHeight(8),
    marginBottom: -StyleSheet.hairlineWidth,
    height: 2,
    width: responsiveWidth(56),
    backgroundColor: "#ff3f6c",
    borderRadius: 1,
  },
  listContent: {
    paddingHorizontal: responsiveWidth(14),
    paddingTop: responsiveHeight(14),
    paddingBottom: responsiveHeight(32),
    backgroundColor: "#faedf1",
    flexGrow: 1,
  },
  listFlex: { flex: 1 },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  listContentEmpty: {
    flexGrow: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(28),
    paddingVertical: responsiveHeight(36),
  },
  emptyWrap: {
    alignItems: "center",
    maxWidth: responsiveWidth(320),
  },
  emptyImage: {
    width: responsiveWidth(220),
    height: responsiveWidth(200),
    marginBottom: responsiveHeight(20),
  },
  emptyTitle: {
    textAlign: "center",
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(16),
    color: "#111",
    marginBottom: responsiveHeight(10),
  },
  emptySubtitle: {
    textAlign: "center",
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(13),
    lineHeight: responsiveFont(20),
    color: "#888",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: responsiveWidth(12),
    marginBottom: responsiveHeight(12),
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
    shadowColor: "#e0b0b8",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardMain: {
    flex: 1,
    flexDirection: "row",
    minWidth: 0,
    paddingVertical: responsiveHeight(10),
    paddingLeft: responsiveWidth(10),
    paddingRight: responsiveWidth(4),
  },
  thumbWrap: {
    borderRadius: responsiveWidth(8),
    overflow: "hidden",
  },
  thumb: {
    width: responsiveWidth(88),
    height: responsiveWidth(88),
    borderRadius: responsiveWidth(8),
  },
  thumbPlaceholder: { backgroundColor: "#eee" },
  cardBody: {
    flex: 1,
    minWidth: 0,
    marginLeft: responsiveWidth(10),
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(12),
    color: "#111",
    lineHeight: responsiveFont(17),
  },
  cardDate: {
    marginTop: responsiveHeight(6),
    fontFamily: "Roboto",
    fontWeight: "500",
    fontSize: responsiveFont(11),
    color: "#888",
  },
  cardHeart: {
    justifyContent: "flex-start",
    paddingTop: responsiveHeight(10),
    paddingRight: responsiveWidth(10),
    paddingLeft: responsiveWidth(4),
  },
});
