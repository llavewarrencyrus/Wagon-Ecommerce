import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { AntDesign, Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

type StrengthLevel = 'empty' | 'weak' | 'fair' | 'strong';

export default function SignupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ redirect?: string }>();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'username' | 'email' | 'password' | 'confirm' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const getPasswordStrength = (pass: string): { level: StrengthLevel; score: number; label: string; color: string } => {
    if (!pass) return { level: 'empty', score: 0, label: '', color: '#e5e7eb' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score === 1) return { level: 'weak', score: 1, label: 'Weak', color: '#ef4444' };
    if (score === 2) return { level: 'fair', score: 2, label: 'Good', color: '#f59e0b' };
    return { level: 'strong', score: 3, label: 'Strong', color: '#10b981' };
  };

  const passwordStrength = getPasswordStrength(password);
  const isMatch = confirmPassword.length > 0 && password === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const onSubmit = async () => {
    setErrorMessage(null);

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (trimmedUsername.length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (trimmedPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create account with Supabase Auth (safe metadata only)
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            username: trimmedUsername,
          },
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMessage('An account with this email already exists. Please sign in.');
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      if (data?.user) {
        const userId = data.user.id;

        // 2. Initialize public profile row in users table
        const { error: profileError } = await supabase.from('users').upsert({
          id: userId,
          email: trimmedEmail,
          username: trimmedUsername,
        });

        if (profileError) {
          console.warn('Profile sync notice:', profileError.message);
        }

        // 3. If session established immediately, log user in
        if (data.session) {
          await login({ id: userId, email: trimmedEmail });
          Alert.alert('Welcome to Wagon!', `Account created successfully. Welcome, ${trimmedUsername}!`);
          if (params.redirect) {
            router.replace(params.redirect as any);
          } else {
            router.replace('/(tabs)');
          }
        } else {
          Alert.alert(
            'Account Created',
            'Your account has been created. Please check your email to verify your address, then sign in.',
            [
              {
                text: 'Go to Login',
                onPress: () => router.replace('/LoginScreen'),
              },
            ]
          );
        }
      }
    } catch (err) {
      console.error('Signup Exception: ', err);
      setErrorMessage('An unexpected error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/backDrop.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(35, 18, 11, 0.75)', 'rgba(80, 42, 22, 0.6)', 'rgba(20, 10, 6, 0.85)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.gradientOverlay}
      />

      <Stack.Screen
        options={{
          headerTitle: '',
          headerTransparent: true,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }}
              style={styles.backBtn}
              activeOpacity={0.8}
            >
              <AntDesign name="arrowleft" size={20} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.brandIconCircle}>
              <Ionicons name="cart" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.brandTitle}>WAGON</Text>
            <Text style={styles.brandSubtitle}>Create your shopping account in seconds</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>
            <Text style={styles.cardSubtitle}>Join Wagon for exclusive deals and personalized feeds</Text>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#dc2626" style={{ marginRight: 6 }} />
                <Text style={styles.errorBannerText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Username Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={[styles.inputContainer, focusedInput === 'username' && styles.inputFocused]}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={focusedInput === 'username' ? Colors.primary : '#9ca3af'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. alex_wagon"
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedInput('username')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={focusedInput === 'email' ? Colors.primary : '#9ca3af'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={focusedInput === 'password' ? Colors.primary : '#9ca3af'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} activeOpacity={0.7}>
                  <Ionicons
                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarsRow}>
                    <View
                      style={[
                        styles.strengthBar,
                        passwordStrength.score >= 1 && { backgroundColor: passwordStrength.color },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthBar,
                        passwordStrength.score >= 2 && { backgroundColor: passwordStrength.color },
                      ]}
                    />
                    <View
                      style={[
                        styles.strengthBar,
                        passwordStrength.score >= 3 && { backgroundColor: passwordStrength.color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                    Strength: {passwordStrength.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedInput === 'confirm' && styles.inputFocused,
                  isMismatch && styles.inputError,
                  isMatch && styles.inputSuccess,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={
                    isMatch
                      ? '#10b981'
                      : isMismatch
                      ? '#ef4444'
                      : focusedInput === 'confirm'
                      ? Colors.primary
                      : '#9ca3af'
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!isConfirmPasswordVisible}
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('confirm')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity
                  onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              </View>

              {/* Match Feedback */}
              {isMismatch ? (
                <Text style={styles.mismatchText}>Passwords do not match</Text>
              ) : isMatch ? (
                <Text style={styles.matchText}>✓ Passwords match</Text>
              ) : null}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={onSubmit}
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.signUpButtonText}>Creating Account...</Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.signUpButtonText}>Create Account</Text>
                  <Feather name="user-plus" size={18} color="#fff" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* Switch to Login */}
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/LoginScreen', params: params.redirect ? { redirect: params.redirect } : {} })}
                activeOpacity={0.7}
              >
                <Text style={styles.loginLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  backBtn: {
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  brandTitle: {
    fontWeight: '900',
    fontSize: 30,
    letterSpacing: 6,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#f3ece7',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.title,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.subtitle,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  inputSuccess: {
    borderColor: '#10b981',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    height: '100%',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    marginRight: 12,
  },
  strengthBar: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  mismatchText: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '500',
    paddingLeft: 4,
  },
  matchText: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '600',
    paddingLeft: 4,
  },
  signUpButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 16,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  signUpButtonDisabled: {
    opacity: 0.7,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  loginPromptText: {
    fontSize: 13,
    color: '#6b7280',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});
