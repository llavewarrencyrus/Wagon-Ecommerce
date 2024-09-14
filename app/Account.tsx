import React from 'react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useNavigation } from "expo-router";
import { ActivityIndicator, InteractionManager, StyleSheet, Button, Text, View, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
import { Colors } from '@/constants/Colors';

export default function Account() {
  const navigation = useNavigation();
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const [isSeller, setIsSeller] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {

    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user) {

      navigation.goBack();
      return;
    }

    const email = userData.user.email ?? null;
    setUserEmail(email);
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      logout();

      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          router.push('/');
        }, 10000); 
      });

    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Logout Error', 'There was a problem logging out.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Logging out...</Text>
      </View>
    );
  }

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: Colors.primary,
  },
});
