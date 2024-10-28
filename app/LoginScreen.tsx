import { Link, Stack, useRouter } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Alert, ImageBackground } from 'react-native';
import { Colors } from '@/constants/Colors';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

import React, { useState } from 'react';

const LoginScreen = () => {

  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const onPressLogin = async () => {
    if (!email || !password) {
      Alert.alert('Login', 'Please fill all the fields!');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        console.log('Login Error: ', error);
        Alert.alert('Login', error.message);
        return;
      }
      console.log(data.user)

      if (data.user) {
        const userId = data.user.id;
        const userEmail = data.user.email ?? 'seller@wagon.com';

        if (userId && userEmail) {
          login({ id: userId, email: userEmail });

          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError) {
            console.log('User Check Error: ', userError);
            Alert.alert('Error', 'Failed to check user details');
            return;
          }

          router.push(userData?.user?.email === 'seller@wagon.com' ? '/' : '/');
        } else {
          Alert.alert('Error', 'User ID or email is missing');
        }
      }
    } catch (err) {
      console.error('Unexpected Error: ', err);
      Alert.alert('Login', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <ImageBackground
        source={require('@/assets/images/backDrop.jpg')} // Image path
        style={styles.backgroundImage}
        resizeMode="cover" // Or "contain", "stretch", etc.
      >
        <LinearGradient
          colors={['#8B4513', '#D2B48C', 'transparent']} // Warm brown to light tan to transparent
          start={{ x: 0.3, y: 0 }}  // Start of gradient at top left
          end={{ x: 0.7, y: 0.6 }}  // End of gradient angled to the middle part of the screen
          style={styles.gradientOverlay}
        />
        <Stack.Screen options={{
          headerTitle: '',
          headerTransparent: true,
          headerBackVisible: false,
          headerLeft: () => <Link href="/" style={{ backgroundColor: Colors.tertiary, padding: 5, marginRight: 25, borderRadius: 20 }}><AntDesign name="arrowleft" size={24} color="black" /></Link>
        }} />
        <View style={{ flex: 1, margin: 'auto', justifyContent: 'space-around' }}>
          <View style={{ width: '95%', margin: 'auto' }}>
            <Text style={styles.textLogo}>WAGON</Text>
            <Text style={styles.title}>Login</Text>

            <View style={styles.inputContainer}>
              <Ionicons name='person' size={20} color={'black'} style={styles.iconInside} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#6e6e6e"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name='key' size={20} color={'black'} style={styles.iconInside} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#6e6e6e"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <Ionicons
                  name={isPasswordVisible ? 'eye' : 'eye-off'}
                  size={20}
                  color="black"
                  style={styles.iconInside}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onPressLogin} style={styles.loginButton} disabled={loading}>
              <Text style={styles.loginButtonText}>LOGIN</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ paddingHorizontal: 7, marginLeft: 'auto' }} onPress={() => router.push('../UnderConstruction')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>


          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?
              <TouchableOpacity onPress={() => router.navigate('/SignupScreen')}>
                <Text style={styles.signUpLink}> Sign Up</Text>
              </TouchableOpacity>
            </Text>
          </View>
        </View >
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  innerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 1,
  },
  logo: {
    width: '60%',
    resizeMode: 'contain',
    marginTop: -90,
  },
  textLogo: {
    fontWeight: 'bold',
    fontSize: 46,
    letterSpacing: 10,
    lineHeight: 48,
    textAlign: 'center',
    fontFamily: 'System',
  },
  title: {
    fontWeight: '700',
    fontSize: 30,
    color: Colors.title,
    margin: 'auto',
    marginVertical: 18
  },
  inputContainer: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 25,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
  },
  iconInside: {
    marginRight: 10,
  },
  loginButton: {
    backgroundColor: Colors.button,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFF',
    fontWeight: '700',
  },
  forgotPasswordText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 16,
    color: 'lightgrey',
  },
  signUpLink: {
    color: 'white',
    fontWeight: '600',
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
  backgroundImage: {
    flex: 1, // Ensures the image covers the entire screen
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center', // Adjust content positioning as needed
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Optional: Adds a translucent overlay to improve text readability
  },
  text: {
    color: 'white', // Ensure text contrasts with the background
    fontSize: 24,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default LoginScreen;