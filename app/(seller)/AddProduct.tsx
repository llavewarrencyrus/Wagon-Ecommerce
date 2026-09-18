import React, { useState, useRef } from "react";
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
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { useAuth } from "@/context/AuthContext";
import CustomAlertModal, { ModalButton } from "@/components/common/CustomAlertModal";

interface CompleteColor {
  id: string;
  color: string;
  image: string | null;
  base64: string | null;
}

interface CompleteSize {
  id: string;
  size: string;
  dimension: string | null;
}

interface VariantItem {
  variant_id: string;
  color_id: string;
  color: string;
  size_id: string;
  size: string;
  quantity: number;
}

export default function AddProduct() {
  const router = useRouter();
  const { user } = useAuth();

  // Stable Product ID for this creation session
  const productIdRef = useRef<string>(String(uuid.v4()));
  const product_id = productIdRef.current;

  // Step state
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: ModalButton[];
  }>({ visible: false, title: "", message: "" });

  // Step 1: Product Basics
  const [nameState, setNameState] = useState<string>("");
  const [descriptionState, setDescriptionState] = useState<string>("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [base64List, setBase64List] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Step 2: Attributes & Variants
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [tempMaterial, setTempMaterial] = useState<string>("");
  const [showCustomMaterial, setShowCustomMaterial] = useState<boolean>(false);

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedCompleteColors, setSelectedCompleteColors] = useState<CompleteColor[]>([]);
  const [tempColor, setTempColor] = useState<string>("");
  const [showCustomColor, setShowCustomColor] = useState<boolean>(false);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCompleteSizes, setSelectedCompleteSizes] = useState<CompleteSize[]>([]);

  // Step 3: Pricing & Stock Matrix
  const [priceState, setPriceState] = useState<string>("");
  const [discountState, setDiscountState] = useState<string>("0");
  const [variant, setVariant] = useState<VariantItem[]>([]);
  const [bulkStock, setBulkStock] = useState<string>("");

  // Preset options
  const categories = [
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

  const materials = [
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

  const colors = [
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Black",
    "White",
    "Gray",
    "Pink",
    "Navy",
    "Beige",
    "Brown",
  ];

  const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "One Size"];

  // Toggle category
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((i) => i !== cat) : [...prev, cat]
    );
  };

  // Toggle material
  const toggleMaterial = (mat: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((i) => i !== mat) : [...prev, mat]
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

  // Toggle color
  const toggleColorSelection = (colorName: string) => {
    if (selectedColors.includes(colorName)) {
      setSelectedColors((prev) => prev.filter((c) => c !== colorName));
      setSelectedCompleteColors((prev) => prev.filter((c) => c.color !== colorName));
    } else {
      setSelectedColors((prev) => [...prev, colorName]);
      setSelectedCompleteColors((prev) => [
        ...prev,
        {
          id: String(uuid.v4()),
          color: colorName,
          image: null,
          base64: null,
        },
      ]);
    }
  };

  const handleAddCustomColor = () => {
    const trimmed = tempColor.trim();
    if (!trimmed) return;
    if (!selectedColors.includes(trimmed)) {
      setSelectedColors((prev) => [...prev, trimmed]);
      setSelectedCompleteColors((prev) => [
        ...prev,
        {
          id: String(uuid.v4()),
          color: trimmed,
          image: null,
          base64: null,
        },
      ]);
    }
    setTempColor("");
    setShowCustomColor(false);
  };

  // Toggle size
  const toggleSizeSelection = (sizeName: string) => {
    if (selectedSizes.includes(sizeName)) {
      setSelectedSizes((prev) => prev.filter((s) => s !== sizeName));
      setSelectedCompleteSizes((prev) => prev.filter((s) => s.size !== sizeName));
    } else {
      setSelectedSizes((prev) => [...prev, sizeName]);
      setSelectedCompleteSizes((prev) => [
        ...prev,
        {
          id: String(uuid.v4()),
          size: sizeName,
          dimension: null,
        },
      ]);
    }
  };

  const handleDimensionChange = (id: string, text: string) => {
    setSelectedCompleteSizes((prev) =>
      prev.map((item) => (item.id === id ? { ...item, dimension: text } : item))
    );
  };

  // Image handlers
  const handleSelectProductImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setAlertModal({
        visible: true,
        title: "Permission Denied",
        message: "Please grant access to your photo library to upload images.",
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
      setImageUris((prev) => [...prev, asset.uri]);
      if (asset.base64) {
        setBase64List((prev) => [...prev, asset.base64 as string]);
      }
    }
  };

  const handleRemoveProductImage = (indexToRemove: number) => {
    setImageUris((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setBase64List((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Color-specific swatch selection
  const handleColorImageSelect = async (colorName: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setAlertModal({
        visible: true,
        title: "Permission Denied",
        message: "Please grant access to your photo library.",
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
      setSelectedCompleteColors((prev) =>
        prev.map((item) =>
          item.color === colorName
            ? { ...item, image: asset.uri, base64: asset.base64 ?? null }
            : item
        )
      );
    }
  };

  const handleRemoveColorImage = (colorName: string) => {
    setSelectedCompleteColors((prev) =>
      prev.map((item) =>
        item.color === colorName ? { ...item, image: null, base64: null } : item
      )
    );
  };

  // Variant Matrix generation
  const generateVariantMatrix = () => {
    const updatedVariants: VariantItem[] = [];

    selectedCompleteColors.forEach((c) => {
      selectedCompleteSizes.forEach((s) => {
        const existing = variant.find(
          (v) => v.color_id === c.id && v.size_id === s.id
        );
        if (existing) {
          updatedVariants.push(existing);
        } else {
          updatedVariants.push({
            variant_id: String(uuid.v4()),
            color_id: c.id,
            color: c.color,
            size_id: s.id,
            size: s.size,
            quantity: 10, // sensible default
          });
        }
      });
    });

    setVariant(updatedVariants);
  };

  const handleStockChange = (variantId: string, text: string) => {
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
    setVariant((prev) =>
      prev.map((v) => (v.variant_id === variantId ? { ...v, quantity: num } : v))
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
    setVariant((prev) => prev.map((v) => ({ ...v, quantity: num })));
    setBulkStock("");
    setAlertModal({
      visible: true,
      title: "Updated",
      message: `Set all variant quantities to ${num}.`,
    });
  };

  // Step Validation & Navigation
  const handleNextFromStep1 = () => {
    if (!nameState.trim()) {
      setAlertModal({
        visible: true,
        title: "Missing Name",
        message: "Please enter a product name.",
      });
      return;
    }
    if (imageUris.length === 0) {
      setAlertModal({
        visible: true,
        title: "Missing Images",
        message: "Please upload at least one product photo.",
      });
      return;
    }
    if (!descriptionState.trim()) {
      setAlertModal({
        visible: true,
        title: "Missing Description",
        message: "Please enter a product description.",
      });
      return;
    }
    if (selectedCategories.length === 0) {
      setAlertModal({
        visible: true,
        title: "Missing Category",
        message: "Please select at least one product category.",
      });
      return;
    }
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (selectedMaterials.length === 0) {
      setAlertModal({
        visible: true,
        title: "Missing Material",
        message: "Please select at least one material.",
      });
      return;
    }
    if (selectedColors.length === 0) {
      setAlertModal({
        visible: true,
        title: "Missing Color",
        message: "Please select at least one color variant.",
      });
      return;
    }
    if (selectedSizes.length === 0) {
      setAlertModal({
        visible: true,
        title: "Missing Size",
        message: "Please select at least one size variant.",
      });
      return;
    }

    generateVariantMatrix();
    setStep(3);
  };

  // Upload image helper
  const uploadImage = async (base64Data: string | null | undefined): Promise<string | null> => {
    if (!base64Data) return null;
    const fileName = `${uuid.v4()}.png`;
    const filePath = `product/${fileName}`;

    try {
      const { error } = await supabase.storage.from("files").upload(filePath, decode(base64Data), {
        contentType: "image/png",
      });

      if (error) {
        console.error("Storage upload error:", error);
        return null;
      }

      const { data: urlData } = supabase.storage.from("files").getPublicUrl(filePath);
      return urlData?.publicUrl || null;
    } catch (err) {
      console.error("Upload exception:", err);
      return null;
    }
  };

  // Final Product Creation
  const handleAddProduct = async () => {
    const price = parseFloat(priceState);
    if (isNaN(price) || price <= 0) {
      setAlertModal({
        visible: true,
        title: "Invalid Price",
        message: "Please enter a valid product price greater than $0.",
      });
      return;
    }

    const discount = parseInt(discountState.replace(/[^0-9]/g, ""), 10) || 0;
    if (discount < 0 || discount > 99) {
      setAlertModal({
        visible: true,
        title: "Invalid Discount",
        message: "Discount must be between 0% and 99%.",
      });
      return;
    }

    if (variant.length === 0) {
      setAlertModal({
        visible: true,
        title: "Missing Variants",
        message: "At least one product variant must be configured.",
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Upload main product images
      const uploadedImages: string[] = [];
      for (const b64 of base64List) {
        const url = await uploadImage(b64);
        if (url) {
          uploadedImages.push(url);
        }
      }

      if (uploadedImages.length === 0) {
        throw new Error("Failed to upload product images. Please check your network connection.");
      }

      // 2. Insert into products table
      const productRecord = {
        product_id: product_id,
        seller_id: user?.id,
        product_name: nameState.trim(),
        product_image: uploadedImages,
        product_price: price,
        product_discount: discount,
        product_category: selectedCategories,
        product_material: selectedMaterials,
        product_description: descriptionState.trim(),
        sales_count: 0,
        product_rating: 5.0,
      };

      const { error: prodError } = await supabase.from("products").insert([productRecord]);
      if (prodError) {
        throw new Error("Failed to insert product: " + prodError.message);
      }

      // 3. Upload color images and insert into product_color table
      for (const col of selectedCompleteColors) {
        let colorImageUrl: string | null = null;
        if (col.base64) {
          colorImageUrl = await uploadImage(col.base64);
        }
        // Fallback to primary product image if no color-specific image was provided
        if (!colorImageUrl && uploadedImages.length > 0) {
          colorImageUrl = uploadedImages[0];
        }

        const colorRecord = {
          id: col.id,
          product_id: product_id,
          color: col.color,
          image: colorImageUrl,
        };

        const { error: colError } = await supabase.from("product_color").insert([colorRecord]);
        if (colError) {
          throw new Error("Failed to insert color variant: " + colError.message);
        }
      }

      // 4. Insert into product_size table
      for (const sz of selectedCompleteSizes) {
        const sizeRecord = {
          id: sz.id,
          product_id: product_id,
          size: sz.size,
          dimension: sz.dimension ? sz.dimension.trim() : null,
        };

        const { error: szError } = await supabase.from("product_size").insert([sizeRecord]);
        if (szError) {
          throw new Error("Failed to insert size variant: " + szError.message);
        }
      }

      // 5. Insert into product_variant table in batch
      const variantRecords = variant.map((v) => ({
        variant_id: v.variant_id,
        product_id: product_id,
        product_color_id: v.color_id,
        product_size_id: v.size_id,
        product_quantity: v.quantity || 0,
      }));

      const { error: varError } = await supabase.from("product_variant").insert(variantRecords);
      if (varError) {
        throw new Error("Failed to insert product inventory: " + varError.message);
      }

      setAlertModal({
        visible: true,
        title: "Success",
        message: `"${nameState.trim()}" has been published to your store!`,
        buttons: [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      });
    } catch (err: any) {
      console.error("Error creating product:", err);
      setAlertModal({
        visible: true,
        title: "Submission Error",
        message: err.message || "Failed to add product. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (step > 1) {
              setStep(step - 1);
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#3E2B23" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Add New Product</Text>
          <Text style={styles.headerSub}>
            {step === 1 && "Step 1 of 3: Basic Information"}
            {step === 2 && "Step 2 of 3: Attributes & Variants"}
            {step === 3 && "Step 3 of 3: Pricing & Inventory"}
          </Text>
        </View>

        <View style={styles.headerStepBadge}>
          <Text style={styles.headerStepBadgeText}>{step}/3</Text>
        </View>
      </View>

      {/* Stepper Progress Indicator */}
      <View style={styles.stepperWrap}>
        <View style={styles.stepperItem}>
          <View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}>
            <Ionicons
              name={step > 1 ? "checkmark" : "document-text-outline"}
              size={14}
              color={step >= 1 ? "#FFF" : "#888"}
            />
          </View>
          <Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>Basics</Text>
        </View>

        <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />

        <View style={styles.stepperItem}>
          <View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}>
            <Ionicons
              name={step > 2 ? "checkmark" : "options-outline"}
              size={14}
              color={step >= 2 ? "#FFF" : "#888"}
            />
          </View>
          <Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>Variants</Text>
        </View>

        <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />

        <View style={styles.stepperItem}>
          <View style={[styles.stepCircle, step >= 3 && styles.stepCircleActive]}>
            <Ionicons
              name="pricetags-outline"
              size={14}
              color={step >= 3 ? "#FFF" : "#888"}
            />
          </View>
          <Text style={[styles.stepLabel, step >= 3 && styles.stepLabelActive]}>Inventory</Text>
        </View>
      </View>

      {/* Scrollable Step Forms */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: BASICS */}
        {step === 1 && (
          <View>
            {/* Photos Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="images-outline" size={18} color="#5C3A2E" />
                <Text style={styles.cardTitle}>Product Photos</Text>
              </View>
              <Text style={styles.cardHint}>
                Add high-quality photos (aspect ratio 3:4). The first image will be your main thumbnail.
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesScroll}
              >
                {/* Upload Button */}
                <TouchableOpacity
                  style={styles.addImageBtn}
                  onPress={handleSelectProductImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={24} color="#5C3A2E" />
                  <Text style={styles.addImageBtnText}>+ Add Photo</Text>
                </TouchableOpacity>

                {/* Thumbnails */}
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
                      onPress={() => handleRemoveProductImage(idx)}
                    >
                      <Ionicons name="close-circle" size={20} color="#D32F2F" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* General Info Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="create-outline" size={18} color="#5C3A2E" />
                <Text style={styles.cardTitle}>General Information</Text>
              </View>

              <Text style={styles.fieldLabel}>Product Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Vintage Heavyweight Cotton Tee"
                placeholderTextColor="#999"
                value={nameState}
                onChangeText={setNameState}
              />

              <Text style={styles.fieldLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your product's features, style, fit, and highlights..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={descriptionState}
                onChangeText={setDescriptionState}
              />
            </View>

            {/* Categories Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="grid-outline" size={18} color="#5C3A2E" />
                <Text style={styles.cardTitle}>Categories *</Text>
              </View>
              <Text style={styles.cardHint}>Select all departments that apply to this item.</Text>

              <View style={styles.chipsWrap}>
                {categories.map((cat) => {
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

            {/* Step 1 Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleNextFromStep1}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionBtnText}>Next: Attributes & Variants</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 2: ATTRIBUTES & VARIANTS */}
        {step === 2 && (
          <View>
            {/* Materials Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="shirt-outline" size={18} color="#5C3A2E" />
                <Text style={styles.cardTitle}>Fabric & Materials *</Text>
              </View>
              <Text style={styles.cardHint}>Select the materials used to manufacture this item.</Text>

              <View style={styles.chipsWrap}>
                {materials.map((mat) => {
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

                {/* Render any added custom materials */}
                {selectedMaterials
                  .filter((m) => !materials.includes(m))
                  .map((customMat) => (
                    <TouchableOpacity
                      key={customMat}
                      style={[styles.chip, styles.chipActive]}
                      onPress={() => toggleMaterial(customMat)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, styles.chipTextActive]}>{customMat}</Text>
                    </TouchableOpacity>
                  ))}
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

            {/* Colors Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="color-palette-outline" size={18} color="#5C3A2E" />
                <Text style={styles.cardTitle}>Color Variants *</Text>
              </View>
              <Text style={styles.cardHint}>
                Choose colors and optionally upload a swatch photo for each color.
              </Text>

              <View style={styles.chipsWrap}>
                {colors.map((col) => {
                  const isSelected = selectedColors.includes(col);
                  return (
                    <TouchableOpacity
                      key={col}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => toggleColorSelection(col)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {col}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {/* Render any added custom colors */}
                {selectedColors
                  .filter((c) => !colors.includes(c))
                  .map((customCol) => (
                    <TouchableOpacity
                      key={customCol}
                      style={[styles.chip, styles.chipActive]}
                      onPress={() => toggleColorSelection(customCol)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, styles.chipTextActive]}>{customCol}</Text>
                    </TouchableOpacity>
                  ))}
              </View>

              {/* Custom Color Toggle */}
              <TouchableOpacity
                style={styles.customAddToggle}
                onPress={() => setShowCustomColor(!showCustomColor)}
              >
                <Ionicons
                  name={showCustomColor ? "chevron-up" : "add-circle-outline"}
                  size={16}
                  color="#5C3A2E"
                />
                <Text style={styles.customAddToggleText}>
                  {showCustomColor ? "Cancel Custom Color" : "+ Add Custom Color"}
                </Text>
              </TouchableOpacity>

              {showCustomColor && (
                <View style={styles.customInputRow}>
                  <TextInput
                    style={styles.customTextInput}
                    placeholder="e.g. Sage Green"
                    placeholderTextColor="#999"
                    value={tempColor}
                    onChangeText={setTempColor}
                  />
                  <TouchableOpacity style={styles.customAddBtn} onPress={handleAddCustomColor}>
                    <Text style={styles.customAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Color Swatch Photos */}
              {selectedCompleteColors.length > 0 && (
                <View style={styles.swatchesSection}>
                  <Text style={styles.swatchSectionTitle}>Color Swatches (Optional Photos):</Text>
                  <View style={styles.swatchGrid}>
                    {selectedCompleteColors.map((item) => (
                      <View key={item.id} style={styles.swatchCard}>
                        {item.image ? (
                          <View style={styles.swatchThumbWrap}>
                            <Image
                              source={{ uri: item.image }}
                              style={styles.swatchThumb}
                              resizeMode="cover"
                            />
                            <TouchableOpacity
                              style={styles.swatchRemoveBtn}
                              onPress={() => handleRemoveColorImage(item.color)}
                            >
                              <Ionicons name="close-circle" size={18} color="#D32F2F" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.swatchPlaceholder}
                            onPress={() => handleColorImageSelect(item.color)}
                          >
                            <Ionicons name="image-outline" size={22} color="#888" />
                            <Text style={styles.swatchAddText}>+ Swatch</Text>
                          </TouchableOpacity>
                        )}
                        <Text style={styles.swatchLabel} numberOfLines={1}>
                          {item.color}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Sizes & Dimensions Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="resize-outline" size={18} color="#5C3A2E" />
                <Text style={styles.cardTitle}>Size Variants *</Text>
              </View>
              <Text style={styles.cardHint}>
                Select available sizes and optionally specify measurement dimensions.
              </Text>

              <View style={styles.chipsWrap}>
                {sizes.map((sz) => {
                  const isSelected = selectedSizes.includes(sz);
                  return (
                    <TouchableOpacity
                      key={sz}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => toggleSizeSelection(sz)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {sz}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Dimensions Input for Selected Sizes */}
              {selectedCompleteSizes.length > 0 && (
                <View style={styles.dimensionsWrap}>
                  <Text style={styles.dimensionsSectionTitle}>
                    Dimensions / Measurements (Optional):
                  </Text>
                  {selectedCompleteSizes.map((sz) => (
                    <View key={sz.id} style={styles.dimensionRow}>
                      <View style={styles.sizeBadge}>
                        <Text style={styles.sizeBadgeText}>{sz.size}</Text>
                      </View>
                      <TextInput
                        style={styles.dimensionInput}
                        placeholder="e.g. Chest 42 in / Length 29 in"
                        placeholderTextColor="#999"
                        value={sz.dimension ?? ""}
                        onChangeText={(text) => handleDimensionChange(sz.id, text)}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Step 2 Actions */}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => setStep(1)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={18} color="#5C3A2E" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryActionBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={handleNextFromStep2}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionBtnText}>Next: Pricing & Stock</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: PRICING & INVENTORY */}
        {step === 3 && (
          <View>
            {/* Pricing Card */}
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
                      value={priceState}
                      onChangeText={setPriceState}
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
                      value={discountState}
                      onChangeText={setDiscountState}
                    />
                    <Text style={styles.percentSymbol}>%</Text>
                  </View>
                </View>
              </View>

              {/* Price Calculation Summary */}
              {parseFloat(priceState) > 0 && (
                <View style={styles.priceSummaryBox}>
                  <Text style={styles.priceSummaryLabel}>Customer will pay:</Text>
                  <Text style={styles.priceSummaryValue}>
                    $
                    {(
                      parseFloat(priceState) *
                      (1 - (parseInt(discountState, 10) || 0) / 100)
                    ).toFixed(2)}
                  </Text>
                  {parseInt(discountState, 10) > 0 && (
                    <Text style={styles.priceSummaryStrike}>
                      Original: ${parseFloat(priceState).toFixed(2)} (-{discountState}%)
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Inventory Matrix Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Ionicons name="cube-outline" size={18} color="#5C3A2E" />
                <Text style={styles.cardTitle}>
                  Variant Inventory ({variant.length} combinations)
                </Text>
              </View>
              <Text style={styles.cardHint}>
                Specify the in-stock quantity for each color and size combination.
              </Text>

              {/* Bulk Stock Fill */}
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

              {/* Variant Rows List */}
              <View style={styles.variantList}>
                {variant.map((v) => (
                  <View key={v.variant_id} style={styles.variantRow}>
                    <View style={styles.variantBadges}>
                      <View style={styles.colorPill}>
                        <Text style={styles.colorPillText}>{v.color}</Text>
                      </View>
                      <View style={styles.sizePill}>
                        <Text style={styles.sizePillText}>{v.size}</Text>
                      </View>
                    </View>

                    <View style={styles.stockInputContainer}>
                      <Text style={styles.stockLabel}>Stock:</Text>
                      <TextInput
                        style={styles.variantStockInput}
                        keyboardType="numeric"
                        value={v.quantity.toString()}
                        onChangeText={(text) => handleStockChange(v.variant_id, text)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Step 3 Actions */}
            <View style={styles.navRow}>
              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => setStep(2)}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={18} color="#5C3A2E" style={{ marginRight: 6 }} />
                <Text style={styles.secondaryActionBtnText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryActionBtn, styles.submitBtn]}
                onPress={handleAddProduct}
                activeOpacity={0.8}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryActionBtnText}>Publish Product</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  headerStepBadge: {
    backgroundColor: "#5C3A2E",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerStepBadgeText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  stepperItem: {
    alignItems: "center",
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EBEBEB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: "#5C3A2E",
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#888",
  },
  stepLabelActive: {
    color: "#5C3A2E",
    fontWeight: "700",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#EBEBEB",
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: "#5C3A2E",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
    marginBottom: 6,
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
  swatchesSection: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  swatchSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3E2B23",
    marginBottom: 8,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  swatchCard: {
    width: "30%",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: 8,
    padding: 6,
    alignItems: "center",
    marginRight: "3.33%",
    marginBottom: 10,
  },
  swatchThumbWrap: {
    position: "relative",
    width: "100%",
    height: 70,
  },
  swatchThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  swatchRemoveBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FFF",
    borderRadius: 9,
  },
  swatchPlaceholder: {
    width: "100%",
    height: 70,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CCC",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  swatchAddText: {
    fontSize: 10,
    color: "#777",
    marginTop: 2,
    fontWeight: "500",
  },
  swatchLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#444",
    marginTop: 4,
  },
  dimensionsWrap: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 10,
  },
  dimensionsSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3E2B23",
    marginBottom: 8,
  },
  dimensionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sizeBadge: {
    width: 50,
    paddingVertical: 7,
    backgroundColor: "#F4EFEB",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sizeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5C3A2E",
  },
  dimensionInput: {
    flex: 1,
    backgroundColor: "#FBFBFB",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    color: "#333",
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
  stockInputContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  actionRow: {
    marginTop: 10,
    marginBottom: 20,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  secondaryActionBtn: {
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
  secondaryActionBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5C3A2E",
  },
  primaryActionBtn: {
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
  submitBtn: {
    backgroundColor: "#2E7D32", // Green for final publish/creation
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFF",
  },
});
