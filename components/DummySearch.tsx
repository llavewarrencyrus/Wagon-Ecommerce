import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { DummySearch } from "@/types/types";

const DummySearchBar: React.FC<DummySearch> = ({ value }) => {
  const router = useRouter();

  const goToSearchScreen = () => {
    const encoded = value ? encodeURIComponent(value) : '';
    router.push(`/SearchScreen?value=${encoded}`);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={goToSearchScreen} style={styles.inputContainer}>
        <Ionicons name="search-outline" size={18} color="#888" style={styles.leftIcon} />
        <Text style={[styles.placeholderText, !!value && styles.valueText]} numberOfLines={1}>
          {value || "Search products, brands, styles..."}
        </Text>
        <View style={styles.searchPill}>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 24,
    paddingLeft: 12,
    paddingRight: 6,
    height: 40,
    backgroundColor: "#f9fafb",
  },
  leftIcon: {
    marginRight: 8,
  },
  placeholderText: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
  },
  valueText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  searchPill: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DummySearchBar;
