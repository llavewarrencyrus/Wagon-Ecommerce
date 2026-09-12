import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import uuid from 'react-native-uuid';
import { Colors } from '@/constants/Colors';
import { getProductById } from '@/data/data';

const UpdateProduct = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const productId = (params.productId || params.id) as string;

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [description, setDescription] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  // Variants state
  const [variants, setVariants] = useState<any[]>([]);

  const categories = [
    'Sleepwear',
    'Party Wear',
    'Baby Wears',
    'Sport Wears',
    'Formal Attire',
    'Casual Attire',
    'Living Room',
    'Bedroom',
    'Dining',
    'Office',
  ];
  const materials = ['Cotton', 'Silk', 'Leather', 'Linen', 'Wool', 'Wood', 'Metal', 'Glass'];

  useEffect(() => {
    if (productId) {
      loadProductData(productId);
    } else {
      Alert.alert('Error', 'Product ID missing');
      navigation.goBack();
    }
  }, [productId]);

  const loadProductData = async (id: string) => {
    setInitialLoading(true);
    try {
      const data = await getProductById(id);
      if (data && data.length > 0) {
        const prod = data[0];
        setProductName(prod.product_name || '');
        setPrice(prod.product_price ? String(prod.product_price) : '');
        setDiscount(prod.product_discount ? String(prod.product_discount) : '0');
        setDescription(prod.product_description || '');
        setImageUris(prod.product_image || []);
        setSelectedCategories(prod.product_category || []);
        setSelectedMaterials(prod.product_material || []);
        setVariants(prod.product_variant || []);
      } else {
        Alert.alert('Not Found', 'Product could not be loaded.');
        navigation.goBack();
      }
    } catch (e) {
      console.error('Error fetching product to update:', e);
      Alert.alert('Error', 'Failed to fetch product details.');
    } finally {
      setInitialLoading(false);
    }
  };

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

  const handleStockChange = (variantId: string, text: string) => {
    const num = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
    setVariants((prev) =>
      prev.map((v) => (v.variant_id === variantId ? { ...v, product_quantity: num } : v))
    );
  };

  const handleAddImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'You need to grant access to the photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        const fileName = `${uuid.v4()}.png`;
        const filePath = `product/${fileName}`;

        try {
          const { error } = await supabase.storage
            .from('files')
            .upload(filePath, decode(asset.base64), {
              contentType: 'image/png',
            });

          if (error) {
            Alert.alert('Upload Error', error.message);
            return;
          }

          const { data: urlData } = supabase.storage.from('files').getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            setImageUris((prev) => [...prev, urlData.publicUrl]);
          }
        } catch (err: any) {
          Alert.alert('Upload failed', err.message || 'Error uploading image');
        }
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!productName.trim() || !price.trim() || !description.trim() || imageUris.length === 0) {
      Alert.alert('Validation', 'Please fill in product name, price, description and at least one image.');
      return;
    }

    const priceNum = parseFloat(price);
    const discountNum = parseFloat(discount) || 0;

    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than 0.');
      return;
    }

    setSaving(true);
    try {
      // 1. Update product main table
      const { error: prodError } = await supabase
        .from('products')
        .update({
          product_name: productName.trim(),
          product_price: priceNum,
          product_discount: discountNum,
          product_description: description.trim(),
          product_image: imageUris,
          product_category: selectedCategories,
          product_material: selectedMaterials,
        })
        .eq('product_id', productId);

      if (prodError) throw prodError;

      // 2. Update variant stock quantities
      for (const v of variants) {
        if (v.variant_id) {
          await supabase
            .from('product_variant')
            .update({
              product_quantity: v.product_quantity ?? 0,
            })
            .eq('variant_id', v.variant_id);
        }
      }

      Alert.alert('Success', 'Product updated successfully!');
      navigation.goBack();
    } catch (err: any) {
      console.error('Error updating product:', err);
      Alert.alert('Update Failed', err.message || 'Could not update product.');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C3A2E" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Edit Product</Text>
      <Text style={styles.subtitle}>Update catalog info, photos, and stock inventory</Text>

      {/* Product Name */}
      <Text style={styles.label}>Product Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Modern Minimalist Sofa"
        value={productName}
        onChangeText={setProductName}
      />

      {/* Pricing Row */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Base Price ($)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={styles.label}>Discount (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="numeric"
            value={discount}
            onChangeText={setDiscount}
          />
        </View>
      </View>

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter comprehensive product description..."
        multiline
        numberOfLines={5}
        value={description}
        onChangeText={setDescription}
      />

      {/* Product Images */}
      <Text style={styles.label}>Product Images</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
        {imageUris.map((uri, idx) => (
          <View key={idx} style={styles.imageWrap}>
            <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveImage(idx)}>
              <Ionicons name="close-circle" size={22} color="#D32F2F" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={styles.addImageBtn} onPress={handleAddImage}>
          <Ionicons name="camera-outline" size={28} color="#5C3A2E" />
          <Text style={styles.addImageText}>Add Photo</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Categories */}
      <Text style={styles.label}>Categories</Text>
      <View style={styles.chipsWrap}>
        {categories.map((cat) => {
          const isSelected = selectedCategories.includes(cat);
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => toggleCategory(cat)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Materials */}
      <Text style={styles.label}>Materials</Text>
      <View style={styles.chipsWrap}>
        {materials.map((mat) => {
          const isSelected = selectedMaterials.includes(mat);
          return (
            <TouchableOpacity
              key={mat}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => toggleMaterial(mat)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{mat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Variant Inventory Management */}
      <Text style={[styles.label, { marginTop: 15 }]}>Variant Stock Inventory</Text>
      {variants && variants.length > 0 ? (
        variants.map((v) => {
          const colorName = v.product_color?.color || 'Standard';
          const sizeName = v.product_size?.size || 'Standard';
          return (
            <View key={v.variant_id} style={styles.variantCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.variantTitle}>
                  {colorName} / {sizeName}
                </Text>
                {v.product_size?.dimension ? (
                  <Text style={styles.variantSub}>Dim: {v.product_size.dimension}</Text>
                ) : null}
              </View>
              <View style={styles.stockInputRow}>
                <Text style={styles.stockLabel}>Stock: </Text>
                <TextInput
                  style={styles.stockInput}
                  keyboardType="numeric"
                  value={String(v.product_quantity ?? 0)}
                  onChangeText={(text) => handleStockChange(v.variant_id, text)}
                />
              </View>
            </View>
          );
        })
      ) : (
        <Text style={styles.noVariantsText}>No variants defined for this product.</Text>
      )}

      {/* Action Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
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
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default UpdateProduct;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E1E17',
  },
  subtitle: {
    fontSize: 13,
    color: '#777',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E2B23',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagesScroll: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  imageWrap: {
    position: 'relative',
    marginRight: 10,
  },
  thumbImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#EEE',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  addImageBtn: {
    width: 80,
    height: 100,
    borderRadius: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#5C3A2E',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageText: {
    fontSize: 11,
    color: '#5C3A2E',
    fontWeight: '600',
    marginTop: 4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EBEBEB',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: '#5C3A2E',
  },
  chipText: {
    fontSize: 12,
    color: '#555',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  variantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  variantTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  variantSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  stockInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 13,
    color: '#555',
    marginRight: 4,
  },
  stockInput: {
    width: 60,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noVariantsText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#E8E8E8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  saveBtn: {
    flex: 2,
    backgroundColor: '#5C3A2E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
