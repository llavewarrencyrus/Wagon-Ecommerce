import * as React from 'react';
import { useState, useRef } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from "expo-router";
import { AntDesign } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
    const router = useRouter();
    const emailRef = useRef('');
    const passwordRef = useRef('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
      if (!emailRef.current) {
            Alert.alert('Sign Up', 'Please fill out the email field!');
            return;
      } if (!passwordRef.current){
            Alert.alert('Sign Up', 'Please fill out the email field!');
            return;
      } else if (passwordRef.current.length < 8){
            Alert.alert('Sign Up', 'Password must be at least 8 characters.');
            return;
      }
  
      let email = emailRef.current.trim();
      let password = passwordRef.current.trim();
  
      setLoading(true);
  
      const { data: {session}, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
              data: {
                  email, 
                  password
              }
          }
      });
  
      setLoading(false);

      /*console.log('session: ', session);
      console.log('error: ', error);*/
  
      if (error) {
          console.error('Error signing up:', error);
          Alert.alert('Sign Up', error.message);
          return;
      }

      if (session) {
        // Redirect to login screen
        router.push('/LoginScreen'); // Replace '/home' with the actual path of your home screen
    }
  };
  

    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ position: 'absolute', top: 50, left: 25 }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
                    <AntDesign name="arrowleft" size={24} color="black" />
                </TouchableOpacity>
            </View>
            <Image source={require('@/assets/images/LogoHorizontal2.png')} style={{ alignSelf: 'center', width: '50%', marginTop: -85, marginBottom: -70, resizeMode: 'contain', }} />
            <Text style={styles.title}>Sign Up</Text>

            <View style={styles.inputView}>
                <TextInput
                    style={styles.inputText}
                    placeholder="Email"
                    placeholderTextColor="#003f5c"
                    onChangeText={value => emailRef.current = value}
                />
            </View>
            <View style={styles.inputView}>
                <TextInput
                    style={styles.inputText}
                    secureTextEntry
                    placeholder="Password"
                    maxLength={25}
                    spellCheck={false}
                    autoCapitalize='none'

                    placeholderTextColor="#003f5c"
                    onChangeText={value => passwordRef.current = value}
                />
            </View>
            <TouchableOpacity /*style={styles.signUpBtn}*/ onPress={onSubmit} disabled={loading}>
                {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Text style={styles.loginText}>Sign Up</Text>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 50,
        color: 'black',
        marginBottom: 40,
        marginTop: -15,
    },
    inputView: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 25,
        height: 50,
        marginBottom: 20,
        justifyContent: 'center',
        padding: 20,
    },
    inputText: {
        height: 50,
        color: 'black',
    },
    forgotAndSignUpText: {
        color: 'black',
        fontSize: 15,
        textDecorationLine: 'underline',
    },
    loginBtn: {
        width: '80%',
        backgroundColor: '#c0bf40',
        borderRadius: 12,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 10,
    },
    loginText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
