import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "@/lib/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { getProductById } from "@/data/data";
import CustomAlertModal, { ModalButton } from "@/components/common/CustomAlertModal";

export default function UpdateProduct() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = (params.productId || params.id) as string;

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: ModalButton[];
  }>({ visible: false, title: "", message: "" });

  // Form states
  const [productName, setProductName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [discount, setDiscount] = useState<string>("0");
  const [description, setDescription] = useState<string>("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [tempMaterial, setTempMaterial] = useState<string>("");
  const [showCustomMaterial, setShowCustomMaterial] = useState<boolean>(false);

  // Variants state
  const [variants, setVariants] = useState<any[]>([]);
  const [bulkStock, setBulkStock] = useState<string>("");

  const presetCategories = [
    "Sleepwear",
    "Party Wear",
    "Baby Wears",
    "Sport Wears",
    "Formal Attire",
    "Casual Attire",
    "Male Closet",
    "Women Closet",
    "Living Room",
    "Bedroom",
    "Dining",
    "Office",
  ];

  const presetMaterials = [
    "Cotton",
    "Silk",
    "Leather",
    "Linen",
    "Wool",
    "Fur",
    "Hemp",
    "Elastane",
    "Sateen",
    "Wood",
    "Metal",
    "Glass",
  ];

  useEffect(() => {
    if (productId) {
      loadProductData(productId);
    } else {
      setAlertModal({
        visible: true,
        title: "Error",
        message: "Product ID missing.",
        buttons: [{ text: "OK", onPress: () => router.back() }],
      });
    }
  }, [productId]);

  const loadProductData = async (id: string) => {
    setInitialLoading(true);
    try {
      const data = await getProductById(id);
      if (data && data.length > 0) {
        const prod = data[0];
        setProductName(prod.product_name || "");
        setPrice(prod.product_price ? String(prod.product_price) : "");
        setDiscount(prod.product_discount ? String(prod.product_discount) : "0");
        setDescription(prod.product_description || "");
        setImageUris(Array.isArray(prod.product_image) ? prod.product_image : []);
        setSelectedCategories(Array.isArray(prod.product_category) ? prod.product_category : []);
        setSelectedMaterials(Array.isArray(prod.product_material) ? prod.product_material : []);
        setVariants(Array.isArray(prod.product_variant) ? prod.product_variant : []);
      } else {
        setAlertModal({
          visible: true,
          title: "Not Found",
          message: "Product details could not be found.",
          buttons: [{ text: "OK", onPress: () => router.back() }],
        });
      }
    } catch (e) {
      console.error("Error fetching product to update:", e);
      setAlertModal({
        visible: true,
        title: "Error",
        message: "Failed to fetch product details.",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  // Combine preset and any existing custom categories
  const allCategories = Array.from(new Set([...presetCategories, ...selectedCategories]));
  const allMaterials = Array.from(new Set([...presetMaterials, ...selectedMaterials]));

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    );
  };

  const handleAddCustomMaterial = () => {
    const trimmed = tempMaterial.trim();
    if (!trimmed) return;
    if (!selectedMaterials.includes(trimmed)) {
      setSelectedMaterials((prev) => [...prev, trimmed]);
    }
    setTempMaterial("");
    setShowCustomMaterial(false);
  };

  const handleStockChange = (variantId: string, text: string) => {
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
    setVariants((prev) =>
      prev.map((v) => (v.variant_id === variantId ? { ...v, product_quantity: num } : v))
    );
  };

  const handleApplyBulkStock = () => {
    const num = parseInt(bulkStock.replace(/[^0-9]/g, ""), 10);
    if (isNaN(num) || num < 0) {
      setAlertModal({
        visible: true,
        title: "Invalid Quantity",
        message: "Please enter a valid non-negative number for bulk stock.",
      });
      return;
    }
    setVariants((prev) => prev.map((v) => ({ ...v, product_quantity: num })));
    setBulkStock("");
    setAlertModal({
      visible: true,
      title: "Updated",
      message: `Set all variant quantities to ${num}.`,
    });
  };

  const handleAddImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setAlertModal({
        visible: true,
        title: "Permission Denied",
        message: "You need to grant access to the photo library.",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        setUploadingImage(true);
        const fileName = `${uuid.v4()}.png`;
        const filePath = `product/${fileName}`;

        try {
          const { error } = await supabase.storage
            .from("files")
            .upload(filePath, decode(asset.base64), {
              contentType: "image/png",
            });

          if (error) {
            setAlertModal({
              visible: true,
              title: "Upload Error",
              message: error.message,
            });
            return;
          }

          const { data: urlData } = supabase.storage.from("files").getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            setImageUris((prev) => [...prev, urlData.publicUrl]);
          }
        } catch (err: any) {
          setAlertModal({
            visible: true,
            title: "Upload failed",
            message: err.message || "Error uploading image",
          });
        } finally {
          setUploadingImage(false);
        }
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!productName.trim()) {
      setAlertModal({
        visible: true,
        title: "Validation",
        message: "Please enter a product name.",
      });
      return;
    }
    if (!price.trim()) {
      setAlertModal({
        visible: true,
        title: "Validation",
        message: "Please enter a product price.",
      });
      return;
    }
    if (!description.trim()) {
      setAlertModal({
        visible: true,
        title: "Validation",
        message: "Please enter a product description.",
      });
      return;
    }
    if (imageUris.length === 0) {
      setAlertModal({
        visible: true,
        title: "Validation",
        message: "Please include at least one product photo.",
      });
      return;
    }
    if (selectedCategories.length === 0) {
      setAlertModal({
        visible: true,
        title: "Validation",
        message: "Please select at least one product category.",
      });
      return;
    }

    const priceNum = parseFloat(price);
    const discountNum = parseInt(discount.replace(/[^0-9]/g, ""), 10) || 0;

    if (isNaN(priceNum) || priceNum <= 0) {
      setAlertModal({
        visible: true,
        title: "Invalid Price",
        message: "Please enter a valid price greater than $0.",
      });
      return;
    }
    if (discountNum < 0 || discountNum > 99) {
      setAlertModal({
        visible: true,
        title: "Invalid Discount",
        message: "Discount must be between 0% and 99%.",
      });
      return;
    }

    setSaving(true);
    try {
      // 1. Update product main table
      const { error: prodError } = await supabase
        .from("products")
        .update({
          product_name: productName.trim(),
          product_price: priceNum,
          product_discount: discountNum,
          product_description: description.trim(),
          product_image: imageUris,
          product_category: selectedCategories,
          product_material: selectedMaterials,
        })
        .eq("product_id", productId);

      if (prodError) throw prodError;

      // 2. Update variant stock quantities concurrently
      if (variants.length > 0) {
        const updatePromises = variants.map((v) => {
          if (v.variant_id) {
            return supabase
              .from("product_variant")
              .update({
                product_quantity: v.product_quantity ?? 0,
              })
              .eq("variant_id", v.variant_id);
          }
          return Promise.resolve(null);
        });

        await Promise.all(updatePromises);
      }

      setAlertModal({
        visible: true,
        title: "Success",
        message: "Product updated successfully!",
        buttons: [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      });
    } catch (err: any) {
      console.error("Error updating product:", err);
      setAlertModal({
        visible: true,
        title: "Update Failed",
        message: err.message || "Could not update product.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C3A2E" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </SafeAreaView>
    );
  }

  // Calculate total units in stock
  const totalStock = variants.reduce((sum, v) => sum + (v.product_quantity || 0), 0);
  const parsedPrice = parseFloat(price) || 0;
  const parsedDiscount = parseInt(discount, 10) || 0;
  const customerPrice = parsedPrice > 0 ? (parsedPrice * (1 - parsedDiscount / 100)).toFixed(2) : "0.00";

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={saving}>
          <Ionicons name="arrow-back" size={22} color="#3E2B23" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Edit Product</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {productName || "Catalog Item"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.headerSaveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.headerSaveBtnText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photos Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="images-outline" size={18} color="#5C3A2E" />
            <Text style={styles.cardTitle}>Product Photos</Text>
          </View>
          <Text style={styles.cardHint}>
            Manage product images (aspect ratio 3:4). The first image serves as the main thumbnail.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
            {/* Upload New Image Button */}
            <TouchableOpacity
              style={styles.addImageBtn}
              onPress={handleAddImage}
              disabled={uploadingImage}
              activeOpacity={0.7}
            >
              {uploadingImage ? (
                <ActivityIndicator color="#5C3A2E" size="small" />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={24} color="#5C3A2E" />
                  <Text style={styles.addImageBtnText}>+ Add Photo</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Existing Images */}
            {imageUris.map((uri, idx) => (
              <View key={idx} style={styles.imageThumbWrap}>
                <Image source={{ uri }} style={styles.imageThumb} resizeMode="cover" />
                {idx === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Main</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveImage(idx)}
                >
                  <Ionicons name="close-circle" size={20} color="#D32F2F" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* General Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="create-outline" size={18} color="#5C3A2E" />
            <Text style={styles.cardTitle}>General Information</Text>
          </View>

          <Text style={styles.fieldLabel}>Product Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Modern Minimalist Sofa"
            placeholderTextColor="#999"
            value={productName}
            onChangeText={setProductName}
          />

          <Text style={styles.fieldLabel}>Description *</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter comprehensive product description..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Pricing & Discounts Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="pricetag-outline" size={18} color="#5C3A2E" />
            <Text style={styles.cardTitle}>Pricing & Discount</Text>
          </View>

          <View style={styles.twoColumnRow}>
            <View style={styles.columnHalf}>
              <Text style={styles.fieldLabel}>Base Price ($) *</Text>
              <View style={styles.priceInputWrapper}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
            </View>

            <View style={styles.columnHalf}>
              <Text style={styles.fieldLabel}>Discount (%)</Text>
              <View style={styles.priceInputWrapper}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="0"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={discount}
                  onChangeText={setDiscount}
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>
            </View>
          </View>

          {/* Price Calculation Summary */}
          {parsedPrice > 0 && (
            <View style={styles.priceSummaryBox}>
              <Text style={styles.priceSummaryLabel}>Customer will pay:</Text>
              <Text style={styles.priceSummaryValue}>${customerPrice}</Text>
              {parsedDiscount > 0 && (
                <Text style={styles.priceSummaryStrike}>
                  Original: ${parsedPrice.toFixed(2)} (-{discount}%)
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Categories Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="grid-outline" size={18} color="#5C3A2E" />
            <Text style={styles.cardTitle}>Categories *</Text>
          </View>
          <Text style={styles.cardHint}>Select all departments that apply to this item.</Text>

          <View style={styles.chipsWrap}>
            {allCategories.map((cat) => {
              const isSelected = selectedCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => toggleCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Materials Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="shirt-outline" size={18} color="#5C3A2E" />
            <Text style={styles.cardTitle}>Fabric & Materials</Text>
          </View>
          <Text style={styles.cardHint}>Select all manufacturing materials.</Text>

          <View style={styles.chipsWrap}>
            {allMaterials.map((mat) => {
              const isSelected = selectedMaterials.includes(mat);
              return (
                <TouchableOpacity
                  key={mat}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => toggleMaterial(mat)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {mat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Material Toggle */}
          <TouchableOpacity
            style={styles.customAddToggle}
            onPress={() => setShowCustomMaterial(!showCustomMaterial)}
          >
            <Ionicons
              name={showCustomMaterial ? "chevron-up" : "add-circle-outline"}
              size={16}
              color="#5C3A2E"
            />
            <Text style={styles.customAddToggleText}>
              {showCustomMaterial ? "Cancel Custom Material" : "+ Add Custom Material"}
            </Text>
          </TouchableOpacity>

          {showCustomMaterial && (
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customTextInput}
                placeholder="e.g. Bamboo Fiber"
                placeholderTextColor="#999"
                value={tempMaterial}
                onChangeText={setTempMaterial}
              />
              <TouchableOpacity
                style={styles.customAddBtn}
                onPress={handleAddCustomMaterial}
              >
                <Text style={styles.customAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Variant Inventory Management Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderBetween}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="cube-outline" size={18} color="#5C3A2E" />
              <Text style={styles.cardTitle}>Variant Stock Inventory</Text>
            </View>
            <View style={styles.stockSummaryBadge}>
              <Text style={styles.stockSummaryBadgeText}>{totalStock} units</Text>
            </View>
          </View>

          <Text style={styles.cardHint}>
            Update available stock counts for each color and size variant.
          </Text>

          {/* Bulk Stock Input */}
          {variants.length > 1 && (
            <View style={styles.bulkFillRow}>
              <TextInput
                style={styles.bulkStockInput}
                placeholder="Qty for all"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={bulkStock}
                onChangeText={setBulkStock}
              />
              <TouchableOpacity
                style={styles.bulkStockBtn}
                onPress={handleApplyBulkStock}
                activeOpacity={0.7}
              >
                <Text style={styles.bulkStockBtnText}>Apply to All</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Variant Rows List */}
          {variants && variants.length > 0 ? (
            <View style={styles.variantList}>
              {variants.map((v) => {
                const colorName = v.product_color?.color || "Standard";
                const sizeName = v.product_size?.size || "Standard";
                const dimension = v.product_size?.dimension;

                return (
                  <View key={v.variant_id} style={styles.variantRow}>
                    <View style={styles.variantInfoCol}>
                      <View style={styles.variantBadges}>
                        <View style={styles.colorPill}>
                          <Text style={styles.colorPillText}>{colorName}</Text>
                        </View>
                        <View style={styles.sizePill}>
                          <Text style={styles.sizePillText}>{sizeName}</Text>
                        </View>
                      </View>
                      {dimension ? (
                        <Text style={styles.dimensionText}>Dim: {dimension}</Text>
                      ) : null}
                    </View>

                    <View style={styles.stockInputContainer}>
                      <Text style={styles.stockLabel}>Stock:</Text>
                      <TextInput
                        style={styles.variantStockInput}
                        keyboardType="numeric"
                        value={String(v.product_quantity ?? 0)}
                        onChangeText={(text) => handleStockChange(v.variant_id, text)}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noVariantsText}>No variants defined for this product.</Text>
          )}
        </View>

        {/* Action Buttons Footer */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F4EFEB",
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2E1E17",
  },
  headerSub: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  headerSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5C3A2E",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  headerSaveBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2E1E17",
    marginLeft: 8,
  },
  cardHint: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 17,
  },
  imagesScroll: {
    flexDirection: "row",
    marginTop: 4,
  },
  addImageBtn: {
    width: 85,
    height: 110,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#5C3A2E",
    backgroundColor: "#FAF7F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  addImageBtnText: {
    fontSize: 11,
    color: "#5C3A2E",
    fontWeight: "600",
    marginTop: 6,
  },
  imageThumbWrap: {
    position: "relative",
    marginRight: 10,
  },
  imageThumb: {
    width: 85,
    height: 110,
    borderRadius: 8,
    backgroundColor: "#EEE",
  },
  mainBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(92, 58, 46, 0.85)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  removeImageBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FFF",
    borderRadius: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3E2B23",
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: "#FBFBFB",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: "#333",
  },
  textArea: {
    height: 90,
  },
  twoColumnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  columnHalf: {
    width: "48%",
  },
  priceInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBFBFB",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5C3A2E",
    marginRight: 4,
  },
  percentSymbol: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginLeft: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  priceSummaryBox: {
    backgroundColor: "#F4EFEB",
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  priceSummaryLabel: {
    fontSize: 13,
    color: "#5C3A2E",
    fontWeight: "600",
    marginRight: 6,
  },
  priceSummaryValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#5C3A2E",
  },
  priceSummaryStrike: {
    fontSize: 12,
    color: "#888",
    marginLeft: 10,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "#5C3A2E",
  },
  chipText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  customAddToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 4,
  },
  customAddToggleText: {
    fontSize: 13,
    color: "#5C3A2E",
    fontWeight: "600",
    marginLeft: 6,
  },
  customInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  customTextInput: {
    flex: 1,
    backgroundColor: "#FBFBFB",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#333",
    marginRight: 8,
  },
  customAddBtn: {
    backgroundColor: "#5C3A2E",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  customAddBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  stockSummaryBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stockSummaryBadgeText: {
    fontSize: 11,
    color: "#2E7D32",
    fontWeight: "700",
  },
  bulkFillRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#F8F8F8",
    padding: 8,
    borderRadius: 8,
  },
  bulkStockInput: {
    width: 100,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: "#333",
    marginRight: 10,
  },
  bulkStockBtn: {
    backgroundColor: "#5C3A2E",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  bulkStockBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  variantList: {
    marginTop: 4,
  },
  variantRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    padding: 10,
    marginBottom: 8,
  },
  variantInfoCol: {
    flex: 1,
  },
  variantBadges: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorPill: {
    backgroundColor: "#EBEBEB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  colorPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
  },
  sizePill: {
    backgroundColor: "#F4EFEB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sizePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5C3A2E",
  },
  dimensionText: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
  },
  stockInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  stockLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 6,
  },
  variantStockInput: {
    width: 60,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 8,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  noVariantsText: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
    paddingVertical: 8,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#5C3A2E",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: "35%",
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5C3A2E",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5C3A2E",
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    flex: 1,
    marginLeft: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});
