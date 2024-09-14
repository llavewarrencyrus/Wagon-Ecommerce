import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, TextInput, ActivityIndicator, Image, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../config/initSupabase';
import { useNavigation } from "expo-router";

const UpdateProduct = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [imageUris, setImageUris] = useState<string[]>([]); // State for multiple image URLs

    // Refs for form fields
    const nameRef = useRef('');
    const priceRef = useRef('');
    const quantityRef = useRef('');
    const colorRef = useRef('');
    const sizeRef = useRef('');
    const materialRef = useRef('');
    const lengthRef = useRef('');
    const widthRef = useRef('');
    const descriptionRef = useRef('');

    // Add product to database
    const addProducts = async (product: {
        product_name: string;
        product_image: string[]; // Array of image URLs
        product_price: string;
        product_quantity: string;
        product_color: string;
        product_size: string;
        product_material: string;
        product_length: string;
        product_width: string;
        product_description: string;
    }) => {
        const { data, error } = await supabase.from('products').insert([product]);

        if (error) {
            Alert.alert('Error', 'There was an error inserting the product: ' + error.message);
            setLoading(false);
            return;
        }

        Alert.alert('Success', 'Product added successfully!');
        setLoading(false);
        navigation.goBack(); // Navigate back after successful insert
    };

    const onSubmit = async () => {
        if (!nameRef.current || imageUris.length === 0 || !priceRef.current || !quantityRef.current || !colorRef.current || !sizeRef.current || !materialRef.current || !lengthRef.current || !widthRef.current || !descriptionRef.current) {
            Alert.alert('Creating', 'Please fill all the fields and upload at least one image!');
            return;
        }

        setLoading(true);

        const product = {
            product_name: nameRef.current.trim(),
            product_image: imageUris, // Use imageUris state here
            product_price: priceRef.current.trim(),
            product_quantity: quantityRef.current.trim(),
            product_color: colorRef.current.trim(),
            product_size: sizeRef.current.trim(),
            product_material: materialRef.current.trim(),
            product_length: lengthRef.current.trim(),
            product_width: widthRef.current.trim(),
            product_description: descriptionRef.current.trim(),
        };

        await addProducts(product);
    };

    const uploadImage = async () => {
        // Request permission to access image library
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'You need to grant access to the photo library.');
            return;
        }

        // Open image library
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 1,
            base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const img = result.assets[0];
            const base64Data = img.base64;

            if (!base64Data) {
                Alert.alert('No base64 data', 'The selected image has no base64 data.');
                return;
            }

            const fileName = `${Date.now()}.png`;
            const filePath = `public/${fileName}`;

            try {
                const { data, error } = await supabase.storage
                    .from('files')
                    .upload(filePath, decode(base64Data), {
                        contentType: 'image/png',
                    });

                if (error) {
                    Alert.alert('Upload failed', error.message);
                    return;
                }

                // Get public URL of the uploaded image
                const { data: urlData } = supabase.storage
                    .from('files')
                    .getPublicUrl(filePath);

                if (!urlData?.publicUrl) {
                    Alert.alert('Error', 'Failed to get image URL.');
                    return;
                }

                // Append the new image URL to the existing list of image URLs
                setImageUris((prevUris) => [...prevUris, urlData.publicUrl]);
                Alert.alert('Success', 'Image uploaded successfully!');
            } catch (err) {
                Alert.alert('Upload Error', 'Something went wrong during the upload.');
                console.error('Upload error:', err);
            }
        } else {
            Alert.alert('No Image Selected', 'Please select an image to upload.');
        }
    };

    return (
        <View style={styles.container}>
            <TextInput style={styles.textInput} placeholder="Product Name" onChangeText={(text) => (nameRef.current = text)} />
            <TextInput style={styles.textInput} placeholder="Product Price" onChangeText={(text) => (priceRef.current = text)} />
            <TextInput style={styles.textInput} placeholder="Quantity" onChangeText={(text) => (quantityRef.current = text)} />
            <TextInput style={styles.textInput} placeholder="Color" onChangeText={(text) => (colorRef.current = text)} />
            <TextInput style={styles.textInput} placeholder="Size" onChangeText={(text) => (sizeRef.current = text)} />
            <TextInput style={styles.textInput} placeholder="Material" onChangeText={(text) => (materialRef.current = text)} />
            <TextInput style={styles.textInput} placeholder="Length" onChangeText={(text) => (lengthRef.current = text)} />
            <TextInput style={styles.textInput} placeholder="Width" onChangeText={(text) => (widthRef.current = text)} />
            <TextInput style={styles.textInput} placeholder="Description" onChangeText={(text) => (descriptionRef.current = text)} />

            {imageUris.length > 0 && (
                <FlatList
                    data={imageUris}
                    renderItem={({ item }) => (
                        <Image key={item} source={{ uri: item }} style={styles.image} />
                    )}
                    keyExtractor={(item) => item}
                    horizontal
                />
            )}

            <TouchableOpacity onPress={uploadImage} style={styles.button}>
                <Text style={styles.buttonText}>Select Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={onSubmit} style={styles.submitButton}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Add Product</Text>}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16
    },
    textInput: {
        width: '95%',
        padding: 5,
        paddingLeft: 20,
        borderRadius: 25,
        backgroundColor: 'white',
        marginBottom: 10
    },
    button: {
        marginBottom: 10,
        backgroundColor: 'lightblue',
        padding: 10,
        borderRadius: 5
    },
    buttonText: {
        color: '#000'
    },
    submitButton: {
        marginTop: 20,
        backgroundColor: 'tomato',
        padding: 10,
        borderRadius: 5
    },
    submitButtonText: {
        color: '#fff'
    },
    image: {
        width: 100,
        height: 100,
        marginBottom: 10,
        borderRadius: 10,
        marginHorizontal: 5
    }
});

export default UpdateProduct;
