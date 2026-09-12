import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import Loading from '@/components/Loading';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  address?: string;
  profile_picture?: string;
}

const EditProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user, refreshUserProfile } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr || !authData?.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUsername(data.username || '');
        setEmail(data.email || '');
        setPhone(data.address || '');
        setProfilePic(data.profile_picture || null);
      }
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      Alert.alert('Error', 'Unable to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow gallery access to upload a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSelectedAsset(asset);
        setProfilePic(asset.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleSave = async () => {
    // Validate username
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      Alert.alert('Validation Error', 'Please enter a username.');
      return;
    }
    if (trimmedUsername.length < 3) {
      Alert.alert('Validation Error', 'Username must be at least 3 characters long.');
      return;
    }

    setSaving(true);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id;
      if (!currentUserId) throw new Error('Not authenticated');

      let uploadedUrl = profilePic;

      // If a new image was picked, upload to Supabase storage
      if (selectedAsset?.base64) {
        const filePath = `profile/${currentUserId}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('files')
          .upload(filePath, decode(selectedAsset.base64), {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('files').getPublicUrl(filePath);
          uploadedUrl = publicUrlData.publicUrl;
        } else {
          console.warn('Storage upload error, fallback to data URI if needed:', uploadError.message);
          // If storage bucket isn't configured, use base64 data URI
          uploadedUrl = `data:image/jpeg;base64,${selectedAsset.base64}`;
        }
      }

      const updates: any = {
        username: trimmedUsername,
        address: phone.trim(),
      };

      if (uploadedUrl) {
        updates.profile_picture = uploadedUrl;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', currentUserId);

      if (updateError) throw updateError;

      // Refresh global Auth state
      await refreshUserProfile();

      Alert.alert('Profile Updated', 'Your profile details have been saved successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      Alert.alert('Save Failed', err.message || 'Could not update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen
        options={{
          headerTitle: 'Edit Profile',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Avatar & Change Action */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <Image source={require('@/assets/images/user.png')} style={styles.avatarImage} />
            )}
            <TouchableOpacity
              style={styles.cameraBadge}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handlePickImage} style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* User Details Form Card */}
        <View style={styles.formCard}>
          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#9ca3af" style={styles.fieldIcon} />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Email (Readonly with Verified Badge) */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <View style={[styles.inputWrap, styles.disabledInputWrap]}>
              <Ionicons name="mail-outline" size={18} color="#9ca3af" style={styles.fieldIcon} />
              <TextInput
                style={[styles.input, { color: '#6b7280' }]}
                value={email}
                editable={false}
                placeholder="Email address"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Phone / Mobile Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Mobile Number</Text>
            <View style={styles.phoneInputWrap}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>+63</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="9XX XXX XXXX"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="check" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.securityButton}
          onPress={() => router.push('/CurrentPasswordScreen')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="lock-reset" size={18} color={Colors.primary} style={{ marginRight: 6 }} />
          <Text style={styles.securityButtonText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8f8f9',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 18,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarImage: {
    width: 105,
    height: 105,
    borderRadius: 52.5,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 2,
  },
  changePhotoBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.title,
    marginBottom: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verifiedText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
    marginLeft: 3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  disabledInputWrap: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#1f2937',
  },
  phoneInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    height: 48,
    overflow: 'hidden',
  },
  prefixBox: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  prefixText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  phoneInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 26,
    marginBottom: 12,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  securityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 13,
    borderRadius: 26,
  },
  securityButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
