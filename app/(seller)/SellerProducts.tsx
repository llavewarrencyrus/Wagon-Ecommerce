import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { getSellerProducts, deleteProduct } from "@/data/data";
import { Product } from "@/types/types";
import { Colors } from "@/constants/Colors";
import CustomAlertModal, { ModalButton } from "@/components/common/CustomAlertModal";

export default function SellerProducts() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const isFirstMount = useRef(true);

  // Modal states
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: ModalButton[];
  }>({ visible: false, title: "", message: "" });

  const fetchProducts = async (showLoading = true) => {
    if (!user?.id) return;
    if (showLoading) setLoading(true);
    try {
      const data = await getSellerProducts(user.id);
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProducts(isFirstMount.current);
      isFirstMount.current = false;
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleEditProduct = (productId: string) => {
    router.push({
      pathname: "/UpdateProduct" as any,
      params: { productId },
    });
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    setProductToDelete({ id: productId, name: productName });
    setIsDeleteModalVisible(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const { id } = productToDelete;
    setIsDeleteModalVisible(false);
    try {
      await deleteProduct(id);
      setAlertModal({
        visible: true,
        title: "Deleted",
        message: "Product has been removed.",
      });
      fetchProducts();
    } catch (err: any) {
      setAlertModal({
        visible: true,
        title: "Error",
        message: err.message || "Failed to delete product.",
      });
    }
  };

  // Extract unique categories from seller's products
  const availableCategories = [
    "All",
    ...Array.from(new Set(products.flatMap((p) => (Array.isArray(p.product_category) ? p.product_category : [])))),
  ];

  // Filter products by search and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.product_description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      (Array.isArray(p.product_category) && p.product_category.includes(selectedCategory));

    return matchesSearch && matchesCategory;
  });

  const renderProductItem = ({ item }: { item: any }) => {
    // Calculate total stock across variants
    let totalStock = 0;
    if (item.product_variant && Array.isArray(item.product_variant)) {
      item.product_variant.forEach((v: any) => {
        totalStock += v.product_quantity || 0;
      });
    }

    const imageUri = Array.isArray(item.product_image) && item.product_image.length > 0 ? item.product_image[0] : null;

    const isLowStock = totalStock < 5;
    const isOutOfStock = totalStock === 0;

    return (
      <View style={styles.productCard}>
        <View style={styles.cardTop}>
          {/* Thumbnail */}
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.productThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productThumb, styles.productThumbPlaceholder]}>
              <Ionicons
                name="image-outline"
                size={28}
                color="#AAA"
              />
            </View>
          )}

          {/* Info */}
          <View style={styles.cardInfo}>
            <Text
              style={styles.productName}
              numberOfLines={2}>
              {item.product_name}
            </Text>

            {/* Category Tags */}
            {Array.isArray(item.product_category) && item.product_category.length > 0 ? (
              <View style={styles.catWrap}>
                {item.product_category.slice(0, 2).map((c: string, idx: number) => (
                  <Text
                    key={idx}
                    style={styles.catChip}>
                    {c}
                  </Text>
                ))}
              </View>
            ) : null}

            {/* Price & Rating */}
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>${Number(item.product_price).toFixed(2)}</Text>
              {item.product_discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>-{item.product_discount}%</Text>
                </View>
              )}
            </View>

            {/* Stock Level Tag */}
            <View style={styles.stockRow}>
              <View
                style={[
                  styles.stockBadge,
                  isOutOfStock ? styles.stockOut : isLowStock ? styles.stockLow : styles.stockGood,
                ]}>
                <Text
                  style={[
                    styles.stockBadgeText,
                    isOutOfStock ? styles.stockOutText : isLowStock ? styles.stockLowText : styles.stockGoodText,
                  ]}>
                  {isOutOfStock ? "Out of Stock" : isLowStock ? `Low Stock (${totalStock})` : `In Stock: ${totalStock}`}
                </Text>
              </View>
              <Text style={styles.variantCount}>{item.product_variant?.length || 0} variant(s)</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Footer */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() => handleDeleteProduct(item.product_id, item.product_name)}>
            <Ionicons
              name="trash-outline"
              size={16}
              color="#D32F2F"
            />
            <Text style={styles.actionBtnSecondaryText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => handleEditProduct(item.product_id)}>
            <Ionicons
              name="create-outline"
              size={16}
              color="#FFF"
            />
            <Text style={styles.actionBtnPrimaryText}>Edit Product</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Products</Text>
          <Text style={styles.headerSub}>
            {products.length} product{products.length === 1 ? "" : "s"} in your store catalog
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => router.push("/AddProduct")}>
          <Ionicons
            name="add"
            size={20}
            color="#FFF"
          />
          <Text style={styles.headerAddBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Category Filter */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search-outline"
            size={18}
            color="#888"
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by name..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color="#888"
              />
            </TouchableOpacity>
          )}
        </View>

        {availableCategories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}>
            {availableCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                onPress={() => setSelectedCategory(cat)}>
                <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Product List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator
            size="large"
            color="#5C3A2E"
          />
          <Text style={styles.loadingText}>Loading catalog...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.product_id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#5C3A2E"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons
                name="tag-outline"
                size={60}
                color="#C4B0A3"
              />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedCategory !== "All"
                  ? "Try changing your search keywords or filter category."
                  : 'Start listing items for sale by tapping "Add Product".'}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => router.push("/AddProduct")}>
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color="#FFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.emptyAddBtnText}>Add Your First Product</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Delete Confirmation Modal */}
      <CustomAlertModal
        visible={isDeleteModalVisible}
        title="Delete Product"
        message={
          productToDelete
            ? `Are you sure you want to permanently delete "${productToDelete.name}" and its variants?`
            : ""
        }
        buttons={[
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: confirmDeleteProduct,
          },
        ]}
        onClose={() => setIsDeleteModalVisible(false)}
      />

      {/* Action Feedback Modal */}
      <CustomAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        buttons={alertModal.buttons}
        onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2E1E17",
  },
  headerSub: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5C3A2E",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  headerAddBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 4,
  },
  filterSection: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  categoryScroll: {
    paddingTop: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#5C3A2E",
  },
  filterChipText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 50,
  },
  loadingBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  productCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
  },
  productThumb: {
    width: 85,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#EEE",
  },
  productThumbPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
  },
  catWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  catChip: {
    fontSize: 10,
    color: "#666",
    backgroundColor: "#EBEBEB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5C3A2E",
  },
  discountBadge: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  discountBadgeText: {
    fontSize: 11,
    color: "#D32F2F",
    fontWeight: "bold",
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  stockGood: {
    backgroundColor: "#E8F5E9",
  },
  stockGoodText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "600",
  },
  stockLow: {
    backgroundColor: "#FFF3E0",
  },
  stockLowText: {
    fontSize: 11,
    color: "#E65100",
    fontWeight: "700",
  },
  stockOut: {
    backgroundColor: "#FFEBEE",
  },
  stockOutText: {
    fontSize: 11,
    color: "#C62828",
    fontWeight: "700",
  },
  variantCount: {
    fontSize: 11,
    color: "#888",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  actionBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    marginRight: 8,
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    color: "#D32F2F",
    fontWeight: "600",
    marginLeft: 4,
  },
  actionBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: "#5C3A2E",
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 4,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5C3A2E",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyAddBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
