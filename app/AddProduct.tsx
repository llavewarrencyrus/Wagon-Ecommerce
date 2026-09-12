import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  FlatList,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";
import { useNavigation } from "expo-router";
import * as Progress from "react-native-progress";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import uuid from "react-native-uuid";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";

const AddProduct = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0.33);

  const [imageUploaded, setImageUploaded] = useState<string[]>([]);
  const [imageColorUploaded, setImageColorUploaded] = useState<string[]>([]);

  const product_id = String(uuid.v4());

  // Multi-select states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [tempColor, setTempColor] = useState("");
  const [showCustomColor, setShowCustomColor] = useState(false); // Control visibility of custom material input
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [tempMaterial, setTempMaterial] = useState("");
  const [showCustomMaterial, setShowCustomMaterial] = useState(false); // Control visibility of custom material input

  //States for form fields
  const [nameState, setNameState] = useState("");
  const [priceState, setPriceState] = useState("");
  const [descriptionState, setDescriptionState] = useState("");

  const [base64, setBase64] = useState<string[]>([]);
  const [selectedCompleteColors, setSelectedCompleteColors] = useState<
    { id: string; color: string; image: string | null; base64: string | null | undefined }[]
  >([]);
  const [selectedCompleteSizes, setSelectedCompleteSizes] = useState<
    { id: string; size: string; dimension: string | null }[]
  >([]);
  const [variant, setVariant] = useState<
    { variant_id: string; color_id: string; color: string; size_id: string; size: string; quantity: number }[]
  >([]);

  // Data arrays
  const categories = [
    "Sleepwear",
    "Party Wear",
    "Baby Wears",
    "Sport Wears",
    "Formal Attire",
    "Casual Attire",
    "Male Closet",
    "Women Closet",
  ];
  const types = ["Shirt", "Dress", "Gown", "Pants", "Shorts", "Blouse", "Pajama", "Coat", "Leggings", "Jacket"];
  const colors = ["Red", "Blue", "Green", "Yellow", "Black", "White", "Gray", "Pink"];
  const sizes = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"];
  const materials = ["Cotton", "Silk", "Leather", "Linen", "Wool", "Fur", "Hemp", "Elastane", "Sateen"];

  // Toggles selection for a given item
  const toggleSelection = (item: string, setState: React.Dispatch<React.SetStateAction<string[]>>, state: string[]) => {
    setState((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const toggleColorSelection = (
    color: string,
    setColorState: React.Dispatch<React.SetStateAction<string[]>>,
    setState: React.Dispatch<
      React.SetStateAction<{ id: string; color: string; image: string | null; base64: string | null | undefined }[]>
    >,
    colorState: string[],
    state: { id: string; color: string; image: string | null; base64: string | null | undefined }[]
  ) => {
    const id = String(uuid.v4());

    const item = {
      id: id,
      color: color,
      image: null,
      base64: null,
    };

    setColorState((prev) => (prev.includes(color) ? prev.filter((i) => i !== color) : [...prev, color]));

    setState((prev) => {
      const exists = prev.some((i) => i.color === color);
      if (exists) {
        return prev.filter((i) => i.color !== color); // Remove if exists
      } else {
        return [...prev, item]; // Add if not exists
      }
    });
  };

  const toggleSizeSelection = (
    size: string,
    setSizeState: React.Dispatch<React.SetStateAction<string[]>>,
    setState: React.Dispatch<React.SetStateAction<{ id: string; size: string; dimension: string | null }[]>>,
    sizeState: string[],
    state: { id: string; size: string; dimension: string | null }[]
  ) => {
    const id = String(uuid.v4());

    const item = {
      id: id,
      size: size,
      dimension: null,
    };

    setSizeState((prev) => (prev.includes(size) ? prev.filter((i) => i !== size) : [...prev, size]));

    setState((prev) => {
      const exists = prev.some((i) => i.size === size);
      if (exists) {
        return prev.filter((i) => i.size !== size); // Remove if exists
      } else {
        return [...prev, item]; // Add if not exists
      }
    });
  };

  // Navigation through steps
  const nextStep = () => {
    if (step < 3) {
      setStep(step + 1);
      setProgress(progress + 0.33);
    }
    if (step === 2) {
      // First, remove any variant where color or size is unselected
      const remainingVariants = variant.filter((existingVariant) => {
        const isColorSelected = selectedCompleteColors.some((color) => color.id === existingVariant.color_id);
        const isSizeSelected = selectedCompleteSizes.some((size) => size.id === existingVariant.size_id);
        return isColorSelected && isSizeSelected;
      });
      setVariant(remainingVariants); // Update the variant list to only include selected colors and sizes

      // Then, add new variants for the selected colors and sizes
      selectedCompleteColors.forEach((color) => {
        selectedCompleteSizes.forEach((size) => {
          // Check if this variant already exists; if not, add it
          const existingVariant = variant.find(
            (variant) => variant.color_id === color.id && variant.size_id === size.id
          );
          if (!existingVariant) {
            const id = String(uuid.v4());
            const newVariant = {
              variant_id: id,
              color_id: color.id,
              color: color.color,
              size_id: size.id,
              size: size.size,
              quantity: 0,
            };
            setVariant((prevVar) => [...prevVar, newVariant]);
          }
        });
      });
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      setProgress(progress - 0.33);
    }
  };

  const addProducts = async () => {
    if (
      !nameState ||
      !priceState ||
      selectedCategories.length === 0 ||
      selectedColors.length === 0 ||
      selectedSizes.length === 0 ||
      variant.length === 0 ||
      selectedMaterials.length === 0 ||
      !descriptionState ||
      imageUris.length === 0
    ) {
      Alert.alert("Creating", "Please fill all the fields and upload at least one image!");
      return;
    }

    const price = parseFloat(priceState);

    if (price <= 0) {
      Alert.alert("Invalid Input", "Product price must be greater than 0.");
      return;
    }

    setLoading(true);

    try {
      const productInsert = await insertToProducts(price);
      if (!productInsert) throw new Error("Product insert failed");

      const colorInsert = await insertToColors();
      if (!colorInsert) throw new Error("Color insert failed");

      const sizeInsert = await insertToSize();
      if (!sizeInsert) throw new Error("Size insert failed");

      const variantInsert = await insertToVariant();
      if (!variantInsert) throw new Error("Variant insert failed");

      Alert.alert("Success", "Product added successfully!");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const insertToProducts = async (price: number) => {
    const uploadedImages: string[] = [];

    for (const base64Data of base64) {
      const imageUrl = await uploadImage(base64Data);
      if (imageUrl) {
        uploadedImages.push(imageUrl);
      } else {
        Alert.alert("Error", "Failed to upload an image.");
        return false;
      }
    }
    const product = {
      product_id: product_id,
      seller_id: user?.id,
      product_name: nameState.trim(),
      product_image: uploadedImages,
      product_price: price.toFixed(2),
      product_category: selectedCategories,
      product_material: selectedMaterials,
      product_description: descriptionState.trim(),
    };
    const { data, error } = await supabase.from("products").insert([product]);

    if (error) {
      throw new Error("There was an error inserting the product: " + error.message);
    }

    return true;
  };

  const insertToColors = async () => {
    const uploadedImages: string[] = [];

    for (const color of selectedCompleteColors) {
      const imageUrl = await uploadImage(color.base64);
      if (imageUrl) {
        uploadedImages.push(imageUrl);
      } else {
        Alert.alert("Error", "Failed to upload an image.");
        return false;
      }
    }

    for (const [index, colors] of selectedCompleteColors.entries()) {
      const color = {
        id: colors.id,
        color: colors.color,
        product_id: product_id,
        image: uploadedImages[index],
      };

      const { data, error } = await supabase.from("product_color").insert([color]);

      if (error) {
        throw new Error("There was an error inserting the product color: " + error.message);
      }
    }

    return true;
  };

  const insertToSize = async () => {
    for (const sizes of selectedCompleteSizes) {
      const size = {
        id: sizes.id,
        size: sizes.size,
        product_id: product_id,
        dimension: sizes.dimension,
      };

      const { data, error } = await supabase.from("product_size").insert([size]);

      if (error) {
        throw new Error("There was an error inserting the product size: " + error.message);
      }
    }

    return true;
  };

  const insertToVariant = async () => {
    for (const variants of variant) {
      const variantData = {
        variant_id: variants.variant_id,
        product_color: variants.color_id,
        product_size: variants.size_id,
        product_id: product_id,
        product_quantity: variants.quantity,
      };

      const { data, error } = await supabase.from("product_variant").insert([variantData]);

      if (error) {
        throw new Error("There was an error inserting the product variant: " + error.message);
      }
    }

    return true;
  };

  const handleImageSelect = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "You need to grant access to the photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imgUri = result.assets[0].uri;
      setImageUris((prevUris) => [...prevUris, imgUri]);
      const base64Data = result.assets[0].base64;
      if (base64Data) {
        setBase64((prevBase) => [...prevBase, base64Data]);
      }
    } else {
      Alert.alert("No Image Selected", "Please select an image to upload.");
    }
  };

  const handleColorImageSelect = async (color: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "You need to grant access to the photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imgUri = result.assets[0].uri;
      const base64Data = result.assets[0].base64;

      setSelectedCompleteColors((prevItems) => {
        const existingItemIndex = prevItems.findIndex((item) => item.color === color);

        // If color already exists, update the existing item
        if (existingItemIndex !== -1) {
          const updatedItems = [...prevItems];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            image: imgUri,
            base64: base64Data,
          };
          return updatedItems;
        } else {
          // Add a new item if color doesn't exist
          return [...prevItems, { id: String(uuid.v4()), color: color, image: imgUri, base64: base64Data }];
        }
      });
    } else {
      Alert.alert("No Image Selected", "Please select an image to upload.");
    }
  };

  const handleDimensionChange = (id: string, newDimension: string) => {
    setSelectedCompleteSizes((prevSizes) =>
      prevSizes.map((item) => (item.id === id ? { ...item, dimension: newDimension } : item))
    );
  };

  const handleStockChange = (variantId: string, stock: string) => {
    const updatedStock = stock.replace(/[^0-9]/g, ""); // Ensures only numbers are allowed

    setVariant((prevVariants) => {
      return prevVariants.map((item) =>
        item.variant_id === variantId
          ? { ...item, quantity: parseInt(updatedStock, 10) } // Update the quantity with the stock value
          : item
      );
    });
  };

  const uploadImage = async (base64Image: string | null | undefined) => {
    if (base64Image) {
      const base64Data = base64Image;

      if (!base64Data) {
        Alert.alert("No base64 data", "The selected image has no base64 data.");
        return;
      }

      const fileName = `${uuid.v4()}.png`;
      const filePath = `product/${fileName}`;

      try {
        const { data, error } = await supabase.storage.from("files").upload(filePath, decode(base64Data), {
          contentType: "image/png",
        });

        if (error) {
          Alert.alert("Upload failed", error.message);
          return;
        }

        const { data: urlData } = supabase.storage.from("files").getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          Alert.alert("Error", "Failed to get image URL.");
          return;
        }

        return urlData.publicUrl;
      } catch (err) {
        Alert.alert("Upload Error", "Something went wrong during the upload.");
        console.error("Upload error:", err);
        return false;
      }
    } else {
      Alert.alert("No Image Found", "Please add an image to upload.");
      return false;
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <Progress.Bar
        progress={progress}
        width={null}
        color={"#fabb00"}
        style={styles.progressBar}
      />

      {/* Step 1 - Basic Info */}
      {step === 1 && (
        <>
          <ScrollView>
            <Text>Product Name:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Product Name"
              onChangeText={(text) => setNameState(text)}
              value={nameState}
            />
            {imageUris.length > 0 && (
              <FlatList
                data={imageUris}
                renderItem={({ item }) => (
                  <Image
                    key={item}
                    source={{ uri: item }}
                    style={styles.image}
                  />
                )}
                keyExtractor={(item) => item}
                horizontal
              />
            )}
            <TouchableOpacity
              onPress={handleImageSelect}
              style={styles.imgButton}>
              <Text style={styles.imgButtonText}>Select Image</Text>
            </TouchableOpacity>
            <Text>Description:</Text>
            <TextInput
              style={styles.textInput}
              multiline={true}
              numberOfLines={15}
              placeholder="Enter product description here..."
              placeholderTextColor="#888"
              textAlignVertical="top" // Ensure text starts at the top of the input box
              onChangeText={(text) => setDescriptionState(text)}
              value={descriptionState}
            />

            <Text style={styles.arrayLabels}>Select Categories:</Text>
            <View style={styles.multiSelectContainer}>
              <ScrollView horizontal>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    onPress={() => toggleSelection(category, setSelectedCategories, selectedCategories)}
                    style={selectedCategories.includes(category) ? styles.selectedItem : styles.unselectedItem}>
                    <Text>{category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TouchableOpacity
              onPress={nextStep}
              style={styles.firstButton}>
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      {/* Step 2 - Categories, Types, Colors, Sizes */}
      {step === 2 && (
        <>
          <ScrollView>
            <View style={styles.customWrap}>
              <Text style={styles.arrayLabels}>Select Materials:</Text>
              <View style={styles.multiSelectContainer}>
                <ScrollView horizontal>
                  {materials.map((material) => (
                    <TouchableOpacity
                      key={material}
                      onPress={() => toggleSelection(material, setSelectedMaterials, selectedMaterials)}
                      style={selectedMaterials.includes(material) ? styles.selectedItem : styles.unselectedItem}>
                      <Text>{material}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Button to show/hide the custom material input */}
              <TouchableOpacity
                onPress={() => setShowCustomMaterial(!showCustomMaterial)}
                style={styles.customMaterialToggle}>
                <View style={{ flex: 1, flexDirection: "row" }}>
                  <Ionicons
                    name={"menu-outline"}
                    size={20}
                    color={"black"}
                  />
                  <Text style={{ fontSize: 15 }}>
                    {showCustomMaterial ? "Hide Custom Material" : "Add Custom Material"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Show custom input only if showCustomMaterial is true */}
              {showCustomMaterial && (
                <View style={styles.customInputWrap}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Custom Material"
                    onChangeText={(text) => setTempMaterial(text)}
                    value={tempMaterial}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      if (tempMaterial) {
                        setSelectedMaterials((prev) => [...prev, tempMaterial.trim()]);
                        setTempMaterial(""); // Clear the input field after adding
                      }
                    }}
                    style={styles.customButton}>
                    <Text>Add Material</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.arrayLabels}>Select Colors:</Text>
            <View style={styles.multiSelectContainer}>
              <ScrollView horizontal>
                {colors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    onPress={() =>
                      toggleColorSelection(
                        color,
                        setSelectedColors,
                        setSelectedCompleteColors,
                        selectedColors,
                        selectedCompleteColors
                      )
                    }
                    style={selectedColors.includes(color) ? styles.selectedItem : styles.unselectedItem}>
                    <Text>{color}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Button to show/hide the custom color input */}
            <TouchableOpacity
              onPress={() => setShowCustomColor(!showCustomColor)}
              style={styles.customMaterialToggle}>
              <View style={{ flex: 1, flexDirection: "row" }}>
                <Ionicons
                  name={"menu-outline"}
                  size={20}
                  color={"black"}
                />
                <Text style={{ fontSize: 15 }}>{showCustomColor ? "Hide Custom Color" : "Add Custom Color"}</Text>
              </View>
            </TouchableOpacity>

            {/* Show custom input only if showCustomColor is true */}
            {showCustomColor && (
              <View style={styles.customInputWrap}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Custom Color"
                  onChangeText={(text) => setTempColor(text)}
                  value={tempColor}
                />
                <TouchableOpacity
                  onPress={() => {
                    if (tempColor) {
                      setSelectedColors((prev) => [...prev, tempColor]);
                      setTempColor(""); // Clear the input field after adding
                    }
                  }}
                  style={styles.customButton}>
                  <Text>Add Material</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.materialList}>
              {selectedCompleteColors
                ? selectedCompleteColors.map((item, index) => (
                    <View
                      key={index}
                      style={{
                        width: "48%",
                        backgroundColor: "#fff",
                        padding: 15,
                        flexDirection: "row",
                        marginRight: "auto",
                        marginBottom: 10,
                      }}>
                      <TouchableOpacity onPress={() => handleColorImageSelect(item.color)}>
                        {item.image ? (
                          <View>
                            <View style={{ width: 100, height: (100 * 4) / 3 }}>
                              <Image
                                source={{ uri: item.image }}
                                style={{ width: "100%", height: "100%" }}
                                resizeMode="cover"
                              />
                            </View>
                          </View>
                        ) : (
                          <View>
                            <View style={{ borderWidth: 1, width: 100, height: (100 * 4) / 3 }}>
                              <MaterialCommunityIcons
                                name="file-image-plus-outline"
                                size={63}
                                color="#000"
                                style={{ margin: "auto" }}
                              />
                            </View>
                          </View>
                        )}
                      </TouchableOpacity>
                      <Text style={{ margin: "auto", fontSize: 18 }}>{item.color}</Text>
                    </View>
                  ))
                : null}
            </View>

            <Text style={styles.arrayLabels}>Select Sizes:</Text>
            <View style={styles.multiSelectContainer}>
              <ScrollView horizontal>
                {sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() =>
                      toggleSizeSelection(
                        size,
                        setSelectedSizes,
                        setSelectedCompleteSizes,
                        selectedSizes,
                        selectedCompleteSizes
                      )
                    }
                    style={selectedSizes.includes(size) ? styles.selectedItem : styles.unselectedItem}>
                    <Text>{size}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={styles.materialList}>
              {selectedCompleteSizes
                ? selectedCompleteSizes.map((item, index) => (
                    <View
                      key={item.id}
                      style={{ marginBottom: 10, flexDirection: "row", width: "100%" }}>
                      <Text style={{ textAlignVertical: "center" }}>{item.size}:</Text>
                      <TextInput
                        placeholder="Enter dimension"
                        value={item.dimension ?? ""}
                        onChangeText={(text) => handleDimensionChange(item.id, text)}
                        style={{
                          borderWidth: 0.8,
                          padding: 5,
                          marginVertical: 5,
                          borderRadius: 4,
                          width: "90%",
                          marginLeft: "auto",
                        }}
                      />
                    </View>
                  ))
                : null}
            </View>
            <View style={styles.buttonWrap}>
              <TouchableOpacity
                onPress={prevStep}
                style={styles.button}>
                <Text style={styles.buttonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={nextStep}
                style={styles.button}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}

      {/* Step 3 - Materials, Description, and Image */}
      {step === 3 && (
        <>
          <ScrollView>
            <Text>Product Price:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Product Price"
              onChangeText={(text) => setPriceState(text)}
              keyboardType="numeric"
              value={priceState}
            />

            <View>
              {variant
                ? variant.map((item) => (
                    <View
                      key={item.variant_id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "#fff",
                        marginBottom: 15,
                        padding: 10,
                      }}>
                      <View style={{ flexDirection: "row", alignItems: "center", width: "40%" }}>
                        <View style={{ width: "70%" }}>
                          <Text
                            style={{
                              borderWidth: 0.8,
                              padding: 6,
                              borderRadius: 4,
                              color: Colors.border,
                              marginRight: "auto",
                              borderColor: Colors.border,
                            }}>
                            {item.color}
                          </Text>
                        </View>
                        <View style={{ width: "30%" }}>
                          <Text
                            style={{
                              borderWidth: 0.8,
                              padding: 6,
                              borderRadius: 4,
                              color: Colors.border,
                              marginRight: "auto",
                              borderColor: Colors.border,
                            }}>
                            {item.size}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text>Enter Stock: </Text>
                        <TextInput
                          style={{ width: 30, backgroundColor: "#D3D3D3", paddingHorizontal: 5, borderRadius: 4 }}
                          keyboardType="numeric"
                          onChangeText={(text) => handleStockChange(item.variant_id, text)}
                          value={item.quantity.toString()}
                        />
                      </View>
                    </View>
                  ))
                : null}
            </View>
            <View style={styles.finalButtonWrap}>
              <TouchableOpacity
                onPress={prevStep}
                style={styles.button}>
                <Text style={styles.buttonText}>Previous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addProducts}
                style={styles.submitButton}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Product</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
    marginVertical: 20,
  },
  progressBar: {
    marginBottom: 20,
    backgroundColor: "#fff4ad",
  },
  textInput: {
    width: "100%",
    padding: 10,
    borderRadius: 5,
    backgroundColor: "white",
    marginBottom: 20,
    marginTop: 8,
  },
  arrayLabels: {
    marginBottom: 8,
    marginTop: 10,
  },
  buttonWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 30,
  },
  finalButtonWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 30,
  },
  button: {
    backgroundColor: "#fabb00",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: "45%",
  },
  selectedButton: {
    backgroundColor: "#fcdb00",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginRight: 8,
    width: "45%",
  },
  unselectedButton: {
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginRight: 8,
    width: "45%",
  },
  discountContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  imgButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fabb00",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginRight: 8,
  },
  buttonText: {
    color: "black",
  },
  imgButtonText: {
    color: "black",
  },
  submitButton: {
    backgroundColor: "tomato",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    width: "45%",
  },
  submitButtonText: {
    color: "#fff",
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  multiSelectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#fff4ad",
    padding: 5,
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: "#fcdb00",
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  unselectedItem: {
    backgroundColor: "#ccc",
    padding: 10,
    margin: 5,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: "#fabb00",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 8,
  },
  firstButton: {
    backgroundColor: "#fabb00",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 8,
  },
  materialList: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  customWrap: {
    borderWidth: 0,
  },
  customInputWrap: {
    marginBottom: 10,
    flex: 1,
    flexDirection: "row",
  },
  customInput: {
    width: "65%",
    padding: 10,
    borderRadius: 5,
    backgroundColor: "white",
  },
  customButton: {
    width: "35%",
    backgroundColor: "#fabb00",
    padding: 10,
    alignItems: "center",
  },
  customMaterialToggle: {
    backgroundColor: "transparent",
    alignItems: "center",
    marginVertical: 5,
    marginBottom: 12,
  },
});

export default AddProduct;
