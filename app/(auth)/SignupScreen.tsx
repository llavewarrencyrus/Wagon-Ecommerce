import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, ImageBackground, ActivityIndicator } from 'react-native';
import { useRouter, Stack, Link } from 'expo-router';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

export default function SignupScreen() {
    const router = useRouter();
    const emailRef = useRef('');
    const passwordRef = useRef('');
    const confirmPasswordRef = useRef('');
    const usernameRef = useRef('');
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        if (!emailRef.current || !passwordRef.current || !confirmPasswordRef.current || !usernameRef.current) {
            Alert.alert('Sign Up', 'Please fill out all fields!');
            return;
        } else if (passwordRef.current.length < 8) {
            Alert.alert('Sign Up', 'Password must be at least 8 characters.');
            return;
        } else if (passwordRef.current !== confirmPasswordRef.current) {
            Alert.alert('Sign Up', 'Passwords do not match.');
            return;
        }

        let email = emailRef.current.trim();
        let password = passwordRef.current.trim();
        let username = usernameRef.current.trim();

        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    email,
                    password
                }
            }
        });

        if (error) {
            setLoading(false);
            Alert.alert('Sign Up', error.message);
            return;
        }

        const { error: profileError } = await supabase
            .from('users')
            .update({ username: username })
            .eq('id', data.user?.id)

        setLoading(false);

        if (profileError) {
            Alert.alert('Sign Up', 'Failed to save profile information.');
            return;
        }

        Alert.alert('Success', 'Account created successfully!');
        router.navigate('/LoginScreen');
    };

    return (
        <ImageBackground
            source={require('@/assets/images/backDrop.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <LinearGradient
                colors={['#8B4513', '#D2B48C', 'transparent']}
                start={{ x: 0.3, y: 0 }}
                end={{ x: 0.7, y: 0.6 }}
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
                    <Text style={styles.title}>Sign Up</Text>

                    {/* Username Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="person" size={20} color="black" style={styles.iconInside} />
                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#6e6e6e"
                            onChangeText={(value) => (usernameRef.current = value)}
                        />
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="mail" size={20} color="black" style={styles.iconInside} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#6e6e6e"
                            onChangeText={(value) => (emailRef.current = value)}
                        />
                    </View>

                    {/* Password Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="key" size={20} color="black" style={styles.iconInside} />
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#6e6e6e"
                            secureTextEntry
                            onChangeText={(value) => (passwordRef.current = value)}
                        />
                    </View>

                    {/* Confirm Password Input */}
                    <View style={styles.inputContainer}>
                        <Ionicons name="key" size={20} color="black" style={styles.iconInside} />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#6e6e6e"
                            secureTextEntry
                            onChangeText={(value) => (confirmPasswordRef.current = value)}
                        />
                    </View>

                    <TouchableOpacity onPress={onSubmit} style={styles.signUpButton} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.signUpButtonText}>SIGN UP</Text>
                        )}
                    </TouchableOpacity>
                </View>
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Already have an account?
                        <TouchableOpacity onPress={() => router.navigate('/LoginScreen')}>
                            <Text style={styles.loginLink}> Login</Text>
                        </TouchableOpacity>
                    </Text>
                </View>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backgroundImage: {
        flex: 1,
    },
    gradientOverlay: {
        ...StyleSheet.absoluteFillObject,
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
        marginVertical: 18,
        textAlign: 'center',
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
    signUpButton: {
        backgroundColor: Colors.button,
        borderRadius: 25,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        elevation: 3,
    },
    signUpButtonText: {
        color: '#FFF',
        fontWeight: '700',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    footerText: {
        fontSize: 16,
        color: 'lightgrey',
    },
    loginLink: {
        color: 'white',
        fontWeight: '600',
    },
});
