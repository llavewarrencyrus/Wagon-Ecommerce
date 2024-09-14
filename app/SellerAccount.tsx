import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useNavigation } from "expo-router";
import { StyleSheet, Button, Text, View, Alert } from 'react-native';
import { supabase } from '@/lib/supabase'; // Import supabase instance
import { useAuth } from '@/components/AuthContext';
import React from 'react';

export default function SellerAccount() {
  const navigation = useNavigation();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth(); // comes from AuthContext
  const [isSeller, setIsSeller] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null); // To store the user's email

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    // Fetch the user from Supabase
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user) {
      Alert.alert("Error", "You must be logged in to access this page.");
      navigation.goBack(); // Redirect if not logged in
      return;
    }

    const email = userData.user.email ?? null; // Use null if email is undefined
    setUserEmail(email); // Correctly set the email

    // Check if user is a seller
    if (email === 'seller@wagon.com') {
      setIsSeller(true); // Allow access if user is the seller
    }
  };

  const handleLogout = async () => {
    try {
      logout();
      router.push('/'); // '/' will Redirect to user's homepage
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Logout Error', 'There was a problem logging out.');
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Please log in to access this screen.</Text>
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          <Button
            title="Go to Login"
            onPress={() => router.push('/LoginScreen')}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Welcome to your account!</Text>

      

      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
});
