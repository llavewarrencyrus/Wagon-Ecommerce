import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Fontisto } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CurrentPasswordScreen = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const router = useRouter();

    const handleCurrentPasswordSubmit = async () => {
        // Basic validation
        if (!currentPassword) {
            Alert.alert('Error', 'Please enter your current password.');
            return;
        }

        try {
            // Get the current user session
            const { data: { user }, error } = await supabase.auth.getUser();

            if (error || !user) {
                Alert.alert('Error', 'User not found. Please log in again.');
                return;
            }

            if (!user.email) {
                Alert.alert('Error', 'User email not found. Please log in again.');
                return;
            }

            // Authenticate the user with the current password
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (loginError) {
                Alert.alert('Error', 'Current password is incorrect.');
                return;
            }

            // Navigate to Change Password screen if the current password is correct
            router.push('/ChangePasswordScreen');
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Enter Current Password to continue to change your password</Text>
            <View style={styles.input}>
                <Fontisto name='locked' size={24} style={{ marginVertical: 'auto', marginRight: 10 }} />
                <TextInput
                    style={{ width: '100%' }}
                    placeholder="Current Password"
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                />
            </View>
            <View style={styles.continueWrapper}>
                <TouchableOpacity style={styles.continueBtn} onPress={handleCurrentPasswordSubmit}>
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 17,
        textAlign: 'center',
        marginHorizontal: 'auto',
        marginVertical: 35
    },
    input: {
        height: 45,
        borderColor: 'gray',
        flexDirection: 'row',
        borderWidth: 1,
        paddingHorizontal: 10,
        marginVertical: 20,
    },
    continueWrapper: {
        position: 'absolute',
        bottom: 0,
        width: width
    },
    continueBtn: {
        marginHorizontal: 'auto',
        marginVertical: 40,
        paddingHorizontal: 80,
        paddingVertical: 10,
        backgroundColor: Colors.button,
        borderRadius: 10
    },
    continueBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default CurrentPasswordScreen;