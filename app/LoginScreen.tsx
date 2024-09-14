import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

export default function LoginScreen() {
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

  const onPressForgotPassword = () => {
    Alert.alert('Forgot Password', 'Redirect to forgot password screen.');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Logging in...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButtonContainer}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>

          {/* <Image source={require('@/assets/images/LogoHorizontal2.png')} style={styles.logo} /> */}
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

          <TouchableOpacity onPress={()=> router.push('../UnderConstruction')}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't have an account?
          <Link href="/SignupScreen" style={styles.signUpLink}> Signup</Link>
        </Text>
      </View>
    </SafeAreaView>
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
    marginBottom: 70,       
    letterSpacing: 15, 
    lineHeight: 48,           
    textAlign: 'center',    
    fontFamily: 'System',     
  },
  title: {
    fontWeight: '700',
    fontSize: 40,
    color: '#333',
    marginBottom: 20,
    marginTop: -50,
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
    width: '90%',
    backgroundColor: Colors.button, 
    borderRadius: 25,
    height: 50,
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
    color: Colors.link,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F4F4F4',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    color: '#333',
  },
  signUpLink: {
    color: Colors.link,
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
});