import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import uuid from 'react-native-uuid';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { updateStoreProfile, getStoreProfile } from '@/data/data';
import CustomAlertModal, { ModalButton } from '@/components/common/CustomAlertModal';

export default function EditStoreScreen() {
  const router = useRouter();
  const { user, storeProfile, refreshUserProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeBanner, setStoreBanner] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: ModalButton[];
  }>({ visible: false, title: '', message: '' });

  useEffect(() => {
    if (storeProfile) {
      setStoreName(storeProfile.store_name || user?.username || '');
      setStoreDescription(storeProfile.store_description || '');
      setPickupAddress(storeProfile.pickup_address || '');
      setStoreLogo(storeProfile.store_logo || null);
      setStoreBanner(storeProfile.store_banner || null);
    }
  }, [storeProfile]);

  const handlePickImage = async (type: 'logo' | 'banner') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setAlertModal({
        visible: true,
        title: 'Permission Denied',
        message: 'Please allow media library access to upload photos.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        const fileName = `store_${type}_${uuid.v4()}.png`;
        const filePath = `store/${fileName}`;

        try {
          const { error } = await supabase.storage
            .from('files')
            .upload(filePath, decode(asset.base64), { contentType: 'image/png' });

          if (error) {
            setAlertModal({
              visible: true,
              title: 'Upload Error',
              message: error.message,
            });
            return;
          }

          const { data: urlData } = supabase.storage.from('files').getPublicUrl(filePath);
          if (urlData?.publicUrl) {
            if (type === 'logo') setStoreLogo(urlData.publicUrl);
            else setStoreBanner(urlData.publicUrl);
          }
        } catch (e: any) {
          setAlertModal({
            visible: true,
            title: 'Error',
            message: e.message || 'Image upload failed',
          });
        }
      }
    }
  };

  const handleSave = async () => {
    if (!storeName.trim()) {
      setAlertModal({
        visible: true,
        title: 'Validation',
        message: 'Please enter a store name.',
      });
      return;
    }

    if (!user?.id) return;

    setLoading(true);
    try {
      await updateStoreProfile(user.id, {
        store_name: storeName.trim(),
        store_description: storeDescription.trim(),
        pickup_address: pickupAddress.trim(),
        store_logo: storeLogo || undefined,
        store_banner: storeBanner || undefined,
      });

      await refreshUserProfile();
      setAlertModal({
        visible: true,
        title: 'Success',
        message: 'Store profile updated successfully!',
        buttons: [{ text: 'OK', onPress: () => router.back() }],
      });
    } catch (e: any) {
      console.error('Error saving store profile:', e);
      setAlertModal({
        visible: true,
        title: 'Error',
        message: e.message || 'Failed to save store profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Store Settings & Profile</Text>
        <Text style={styles.subtitle}>Customize your brand identity and pickup location</Text>

        {/* Store Banner */}
        <Text style={styles.label}>Store Banner (16:9)</Text>
        <TouchableOpacity
          style={styles.bannerContainer}
          onPress={() => handlePickImage('banner')}
        >
          {storeBanner ? (
            <Image source={{ uri: storeBanner }} style={styles.bannerImage} resizeMode="cover" />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Ionicons name="image-outline" size={32} color="#888" />
              <Text style={styles.uploadText}>Upload Store Banner</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Store Logo */}
        <Text style={styles.label}>Store Logo</Text>
        <View style={styles.logoRow}>
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={() => handlePickImage('logo')}
          >
            {storeLogo ? (
              <Image source={{ uri: storeLogo }} style={styles.logoImage} resizeMode="cover" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="camera-outline" size={28} color="#5C3A2E" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.changeLogoBtn}
            onPress={() => handlePickImage('logo')}
          >
            <Text style={styles.changeLogoBtnText}>Choose New Logo</Text>
          </TouchableOpacity>
        </View>

        {/* Store Name */}
        <Text style={styles.label}>Store Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Wagon Home & Living"
          value={storeName}
          onChangeText={setStoreName}
        />

        {/* Store Bio / Description */}
        <Text style={styles.label}>Store Bio / Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell buyers about your shop, warranty, and craftsmanship..."
          value={storeDescription}
          onChangeText={setStoreDescription}
          multiline
          numberOfLines={4}
        />

        {/* Courier Pickup Address */}
        <Text style={styles.label}>Courier Pickup Address</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Street address, building, contact person, and phone for courier collection..."
          value={pickupAddress}
          onChangeText={setPickupAddress}
          multiline
          numberOfLines={3}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Store Settings</Text>
          )}
        </TouchableOpacity>
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
    backgroundColor: '#F8F8F8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E1E17',
  },
  subtitle: {
    fontSize: 13,
    color: '#777',
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E2B23',
    marginBottom: 6,
    marginTop: 12,
  },
  bannerContainer: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 12,
    color: '#777',
    marginTop: 6,
    fontWeight: '500',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5EBE6',
  },
  changeLogoBtn: {
    marginLeft: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#5C3A2E',
    borderRadius: 8,
  },
  changeLogoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C3A2E',
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
    height: 85,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: '#5C3A2E',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 25,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
