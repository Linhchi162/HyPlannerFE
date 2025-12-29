import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { ChevronLeft, Menu } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { fonts } from "../theme/fonts";
import WeddingDressMenu from "./WeddingDressMenu";
import { useWeddingDress } from "../contexts/WeddingDressContext";

interface WeddingDressFeatureScreenProps {
  title: string;
  currentScreen: string;
  data: Array<{
    _id: string;
    name: string;
    description?: string;
    imageUrl?: string;
  }>;
  onItemPress: (item: any) => void;
}

const WeddingDressFeatureScreen = ({
  title,
  currentScreen,
  data,
  onItemPress,
}: WeddingDressFeatureScreenProps) => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const { loading, error } = useWeddingDress();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => onItemPress(item)}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.itemImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        {item.description && (
          <Text style={styles.itemDescription}>{item.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
          <Menu size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <WeddingDressMenu
        visible={menuVisible}
        currentScreen={currentScreen}
        onClose={() => setMenuVisible(false)}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFD4E3" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.montserratMedium,
    color: "#EF4444",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  itemContainer: {
    backgroundColor: "#FEF0F3",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: "100%",
    height: 200,
  },
  itemContent: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: fonts.montserratRegular,
    color: "#4B5563",
  },
});

export default WeddingDressFeatureScreen;
