import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { decode } from 'base64-arraybuffer';
import { Colors } from '@/constants/Colors';
import * as ImagePicker from 'expo-image-picker'; // Importing ImagePicker for selecting profile pictures

import { useRouter } from 'expo-router';
import Loading from '@/components/Loading';

interface User {
  id: string;
  email: string;
  username: string;
  address: string;
  password: string;
  profile_picture: string; // Add profile picture field
}

const EditProfileScreen = () => {
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null); // State for profile picture
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null)

  const [modalVisible, setModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);

  const router = useRouter();

  // Fetch data for the logged-in user
  const fetchUserData = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not logged in');
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      console.log(data.profile_picture),

      setUserData(data);
      setNickname(data.username);
      setEmail(data.email);
      setPhoneNumber(data.address);
      setProfilePicture(data.profile_picture); // Set profile picture from fetched data
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const updateUserData = async () => {
    setUpdating(true);
    if (!userData) return;

    const updates: any = {
      username: nickname,
      email: email,
      address: phoneNumber,
    };

    // If a new profile picture is selected, upload it and get the URL
    if (image) {
      const base64Data = image?.base64;
      if (!base64Data) {
        Alert.alert('No base64 data', 'The selected image has no base64 data.');
        return;
      }

      const fileImage = `profile/${userData.id}-${Date.now()}.jpg`;

      const { data, error: uploadError } = await supabase.storage
        .from('files') // Ensure you have a bucket named 'profile-pictures'
        .upload(fileImage, decode(base64Data), {
          contentType: 'image/jpg',
        });

      if (uploadError) {
        setModalVisible(false);
        setUpdating(false);
        console.error('Error uploading profile picture:', uploadError);
        Alert.alert('Error', 'Could not upload profile picture.');
        return;
      }

      setImage(null);

      updates.profile_picture = `https://xsqkrqgobxcfwcuutnwh.supabase.co/storage/v1/object/public/files/${fileImage}`;
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userData.id);

    if (error) {
      setModalVisible(false);
      setUpdating(false);
      console.error('Error updating user data:', error);
      Alert.alert('Error', 'Could not update user data.');
    } else {
      Alert.alert('Success', 'User data updated successfully.');
    }
    setModalVisible(false);
    setUpdating(false);
  };

  // Function to pick an image from the user's device
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      const selectedImage = result.assets?.[0];
      if (selectedImage) {
        setImage(selectedImage);
        setProfilePicture(selectedImage.uri);
      }
    }
  };

  if (loading) {
    return <Loading/>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileImage}>
        {profilePicture ? (
          <Image style={styles.profileImage} source={{ uri: profilePicture }} />
        ) : (
          <Image style={styles.profileImage} source={require('@/assets/images/user.png')} />
        )}
        <View style={styles.editIcon}>
          <TouchableOpacity style={styles.editButton} onPress={pickImage}>
            <FontAwesome5 name="edit" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        placeholder="Nickname"
        style={styles.input}
        value={nickname}
        onChangeText={setNickname}
      />
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.phoneInput}>
        <Text style={styles.phonePrefix}>+63</Text>
        <TextInput
          placeholder="Enter your phone number"
          style={styles.phoneInputBox}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
      </View>
      <TouchableOpacity style={styles.updateButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.updateButtonText}>Update</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.passButton} onPress={() => router.navigate('../CurrentPasswordScreen')}>
        <Text style={styles.passButtonText}>Change Password</Text>
      </TouchableOpacity>
      <Modal transparent={true} animationType="fade" visible={modalVisible}>
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            {updating ? (<ActivityIndicator size="large" color={Colors.primary} style={{ margin: 'auto' }} />) : (
              <>
                <Text style={styles.title}>Confirm Changes</Text>
                <Text style={styles.message}>Are you sure you want to save changes?</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.confirmButton} onPress={updateUserData}>
                    <Text style={styles.buttonText}>Yes, Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'gray',
    marginBottom: 20,
    alignSelf: 'center',
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'gray',
    padding: 5,
    borderRadius: 50,
  },
  input: {
    height: 45,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phonePrefix: {
    fontSize: 18,
    marginRight: 10,
    marginBottom: 20,
  },
  phoneInputBox: {
    flex: 1,
    height: 45,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: Colors.button,
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  passButton: {
    backgroundColor: '#A9A9A9',
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  passButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    height: 183,
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 5,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmButton: {
    backgroundColor: '#006D5B', // Red for confirm
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#ccc', // Grey for cancel
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
