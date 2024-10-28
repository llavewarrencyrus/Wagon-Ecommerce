import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Modal, Dimensions, Image } from 'react-native';
import { Fontisto, Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';
import { ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const ChangePasswordScreen = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const router = useRouter();

    const validateAndShowModal = () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'New password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        setModalVisible(true);
    };

    const handleChangePassword = async () => {
        setLoading(true);
        try {
            const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
            if (updateError) {
                Alert.alert('Error', 'Failed to change password. Please try again later.');
                return;
            }
            Alert.alert('Success', 'Your password has been changed successfully.');
            setNewPassword('');
            setConfirmPassword('');

            router.navigate('../Account');
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
            setModalVisible(false);
        }
    };

    return (
        <View style={styles.container}>
            <Image source={require('@/assets/images/password.png')} style={{ width: width * 0.6, height: width * 0.6, resizeMode: 'contain', marginHorizontal: 'auto', marginVertical: 30 }} />
            <View style={styles.inputContainer}>
                <Fontisto name='locked' size={24} style={{ marginRight: 10 }} />
                <TextInput
                    style={styles.input}
                    placeholder="New Password"
                    secureTextEntry={!isPasswordVisible}
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Ionicons name={isPasswordVisible ? 'eye' : 'eye-off'} size={20} color="black" />
                </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
                <Fontisto name='locked' size={24} style={{ marginRight: 10 }} />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm New Password"
                    secureTextEntry={!isConfirmPasswordVisible}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                    <Ionicons name={isConfirmPasswordVisible ? 'eye' : 'eye-off'} size={20} color="black" />
                </TouchableOpacity>
            </View>
            <View style={styles.continueWrapper}>
                <TouchableOpacity style={styles.continueBtn} onPress={validateAndShowModal}>
                    <Text style={styles.continueBtnText}>Change Password</Text>
                </TouchableOpacity>
            </View>
            <Modal transparent={true} animationType="fade" visible={modalVisible}>
                <View style={styles.overlay}>
                    <View style={styles.modalContainer}>
                        {loading ? (<ActivityIndicator size="large" color={Colors.primary} style={{ margin: 'auto' }} />) : (
                            <>
                                <Text style={styles.modalTitle}>Confirm Password Change</Text>
                                <Text style={styles.modalMessage}>Are you sure you want to change your password?</Text>
                                <View style={styles.modalButtonContainer}>
                                    <TouchableOpacity style={styles.confirmButton} onPress={handleChangePassword}>
                                        <Text style={styles.buttonText}>Yes, Change</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )};
                    </View>
                </View>
            </Modal>
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
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    inputContainer: {
        height: 45,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'gray',
        paddingHorizontal: 10,
        marginVertical: 10,
    },
    input: {
        flex: 1,
        height: 50,
        color: '#333',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        padding: 20,
        height: 183,
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    confirmButton: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
        marginRight: 5,
    },
    cancelButton: {
        backgroundColor: 'gray',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
        marginLeft: 5,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
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

export default ChangePasswordScreen;
