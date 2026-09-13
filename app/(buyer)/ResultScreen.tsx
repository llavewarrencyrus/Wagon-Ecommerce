import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";

import { getProducts } from "@/data/data";
import { Product } from "@/types/types";
import { Colors } from "@/constants/Colors";
import ProductList from "@/components/ProductList";
import DummySearch from "@/components/DummySearch";

import { Ionicons } from "@expo/vector-icons";
import NetworkIssue from "@/components/NetworkIssue";
import { useNetwork } from "@/components/NetworkContext";
import Loading from "@/components/Loading";
import { SCREEN_WIDTH as width } from "@/constants/Layout";

type SortOption = "relevance" | "latest" | "topSales" | "priceAsc" | "priceDesc";

const SUGGESTIONS = ["Hoodie", "Sneakers", "Headphones", "Tote Bag", "Diffuser", "Watch"];

function Result() {
  const { isConnected, refreshNetworkStatus } = useNetwork();
  const router = useRouter();

  if (!isConnected) {
    return <NetworkIssue onRetry={refreshNetworkStatus} />;
  }

  const params = useLocalSearchParams<{ keyword?: string; category?: string }>();
  const keyword = typeof params.keyword === "string" ? params.keyword.trim() : "";
  const category = typeof params.category === "string" ? params.category.trim() : "";

  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSort, setSelectedSort] = useState<SortOption>("relevance");

  useEffect(() => {
    let isActive = true;
    setLoading(true);

    const fetchResults = async () => {
      try {
        const fetched = await getProducts({
          searchTerm: keyword || undefined,
          sortBy: selectedSort,
          category: category || undefined,
        });

        if (isActive) {
          setResults(fetched || []);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching search results:", error);
        if (isActive) {
          setResults([]);
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      isActive = false;
    };
  }, [keyword, category, selectedSort]);

  const handleSortChange = (sortKey: SortOption) => {
    if (selectedSort !== sortKey) {
      setSelectedSort(sortKey);
    }
  };

  const handleSuggestionPress = (suggestedKeyword: string) => {
    router.replace(`/ResultScreen?keyword=${encodeURIComponent(suggestedKeyword)}`);
  };

  const displayTitle = keyword ? `"${keyword}"` : category ? `${category}` : "All Products";

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={{ width: width * 0.75 }}>
              <DummySearch value={keyword || category} />
            </View>
          ),
          headerStyle: { backgroundColor: "white" },
          headerShadowVisible: false,
        }}
      />

      {/* Sorting Filter Bar */}
      <View style={styles.sortContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScrollContent}>
          <TouchableOpacity
            style={[styles.sortPill, selectedSort === "relevance" && styles.sortPillActive]}
            onPress={() => handleSortChange("relevance")}>
            <Text style={[styles.sortPillText, selectedSort === "relevance" && styles.sortPillTextActive]}>
              Relevance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortPill, selectedSort === "latest" && styles.sortPillActive]}
            onPress={() => handleSortChange("latest")}>
            <Text style={[styles.sortPillText, selectedSort === "latest" && styles.sortPillTextActive]}>Latest</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortPill, selectedSort === "topSales" && styles.sortPillActive]}
            onPress={() => handleSortChange("topSales")}>
            <Text style={[styles.sortPillText, selectedSort === "topSales" && styles.sortPillTextActive]}>
              Top Sales
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortPill, selectedSort === "priceAsc" && styles.sortPillActive]}
            onPress={() => handleSortChange("priceAsc")}>
            <Text style={[styles.sortPillText, selectedSort === "priceAsc" && styles.sortPillTextActive]}>
              Price: Low → High
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortPill, selectedSort === "priceDesc" && styles.sortPillActive]}
            onPress={() => handleSortChange("priceDesc")}>
            <Text style={[styles.sortPillText, selectedSort === "priceDesc" && styles.sortPillTextActive]}>
              Price: High → Low
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Results Header Count */}
      {!loading && results.length > 0 && <Loading />}

      {/* Main Content / Loading / Empty States */}
      {loading ? (
        <Loading />
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name="search-outline"
              size={44}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptySubtitle}>
            We couldn't find any products matching <Text style={{ fontWeight: "bold" }}>{displayTitle}</Text>.
          </Text>

          {/* Pivot Search Chips */}
          <View style={styles.suggestionWrap}>
            <Text style={styles.suggestionHeader}>Try searching for:</Text>
            <View style={styles.suggestionChipsRow}>
              {SUGGESTIONS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionPress(item)}>
                  <Text style={styles.suggestionChipText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ProductList products={results} />
        </View>
      )}
    </View>
  );
}

export default Result;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f8f9",
  },
  sortContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 8,
  },
  sortScrollContent: {
    paddingHorizontal: 12,
  },
  sortPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  sortPillActive: {
    backgroundColor: Colors.primary,
  },
  sortPillText: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "500",
  },
  sortPillTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  resultCountBar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f8f8f9",
  },
  resultCountText: {
    fontSize: 13,
    color: "#6b7280",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingLabel: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.subtitle,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#f3ece7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.title,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.subtitle,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  suggestionWrap: {
    width: "100%",
    alignItems: "center",
  },
  suggestionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 12,
  },
  suggestionChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  suggestionChip: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    margin: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  suggestionChipText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
});
