import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, TextInput, ActivityIndicator, Image, FlatList, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../config/initSupabase';
import { useNavigation } from "expo-router";
import * as Progress from 'react-native-progress';
import Ionicons from '@expo/vector-icons/Ionicons';

const AddProduct = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [imageUris, setImageUris] = useState<string[]>([]); 
    const [step, setStep] = useState(1); 
    const [progress, setProgress] = useState(0.33); 

    // Discount state (boolean)
    const [isDiscounted, setIsDiscounted] = useState<boolean | null>(null); // null means no selection

    // Multi-select states
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [tempColor, setTempColor] = useState('');
    const [showCustomColor, setShowCustomColor] = useState(false); // Control visibility of custom material input
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [tempMaterial, setTempMaterial] = useState('');
    const [showCustomMaterial, setShowCustomMaterial] = useState(false); // Control visibility of custom material input

    //States for form fields
    const [nameState, setNameState] = useState('');
    const [priceState, setPriceState] = useState('');
    const [quantityState, setQuantityState] = useState('');
    const [descriptionState, setDescriptionState] = useState('');

    // Data arrays
    const categories = ['Sleepwear', 'Party Wear', 'Baby Wears', 'Sport Wears', 'Formal Attire', 'Casual Attire', 'Male Closet', 'Women Closet'];
    const types = ['Shirt', 'Dress', 'Gown', 'Pants', 'Shorts', 'Blouse', 'Pajama', 'Coat', 'Leggings', 'Jacket'];
    const colors = ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Gray', 'Pink'];
    const sizes = ['XXS', 'XS', 'Small', 'Medium', 'Large', 'XL', 'XXL', 'XXXL', 'XXXXL'];
    const materials = ['Cotton', 'Silk', 'Leather', 'Linen', 'Wool', 'Fur', 'Hemp', 'Elastane', 'Sateen'];

    // Toggles selection for a given item
    const toggleSelection = (item: string, setState: React.Dispatch<React.SetStateAction<string[]>>, state: string[]) => {
        setState((prev) => 
            prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
        );
    };

    // Navigation through steps
    const nextStep = () => {
        if (step < 3) {
            setStep(step + 1);
            setProgress(progress + 0.33);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
            setProgress(progress - 0.33);
        }
    };

    const addProducts = async () => {
        if (!nameState || !priceState || !quantityState || !isDiscounted || selectedCategories.length === 0 || selectedTypes.length === 0 || selectedColors.length === 0 || selectedSizes.length === 0 || selectedMaterials.length === 0 || !descriptionState || imageUris.length === 0) {
            Alert.alert('Creating', 'Please fill all the fields and upload at least one image!');
            return;
        }

        // Ensure price and quantity are greater than zero
        const price = parseFloat(priceState); //price is parsed as a float to handle decimal values
        const quantity = parseInt(quantityState); //quantity is parsed as an integer to ensure correct input handling.

        if (price <= 0) {
            Alert.alert('Invalid Input', 'Product price must be greater than 0.');
            return;
        }

        if (quantity <= 0) {
            Alert.alert('Invalid Input', 'Product quantity must be greater than 0.');
            return;
        }

    
        setLoading(true);
    
        const product = {
            product_name: nameState.trim(),
            product_image: imageUris, 
            product_price: price.toFixed(2),
            product_quantity: quantity,
            product_discount: isDiscounted, // Now boolean or null
            // Format arrays as PostgreSQL array literals
            product_category: `{${selectedCategories.join(',')}}`,
            product_type: `{${selectedTypes.join(',')}}`,
            product_color: `{${selectedColors.join(',')}}`,
            product_size: `{${selectedSizes.join(',')}}`,
            product_material: `{${selectedMaterials.join(',')}}`,
            product_description: descriptionState.trim(),
        };
    
        const { data, error } = await supabase.from('products').insert([product]);
    
        if (error) {
            Alert.alert('Error', 'There was an error inserting the product: ' + error.message);
            setLoading(false);
            return;
        }
    
        Alert.alert('Success', 'Product added successfully!');
        setLoading(false);
        navigation.goBack();
    };
    

    const uploadImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'You need to grant access to the photo library.');
            return;
        }

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

                const { data: urlData } = supabase.storage
                    .from('files')
                    .getPublicUrl(filePath);

                if (!urlData?.publicUrl) {
                    Alert.alert('Error', 'Failed to get image URL.');
                    return;
                }

                setImageUris((prevUris) => [...prevUris, urlData.publicUrl]);
                Alert.alert('Success', 'Image added successfully!');
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
            {/* Progress Bar */}
            <Progress.Bar progress={progress} width={null} color={'#fabb00'} style={styles.progressBar} />

            {/* Step 1 - Basic Info */}
            {step === 1 && (
                <>
                <ScrollView>
                    <Text>Product Name:</Text>
                    <TextInput style={styles.textInput} placeholder="Product Name" onChangeText={ text => setNameState(text) } value={nameState} /> 
                    <Text>Product Price:</Text>
                    <TextInput style={styles.textInput} placeholder="Product Price" onChangeText={ text => setPriceState(text) } keyboardType="numeric" value={priceState} />
                    <Text>Quantity:</Text>
                    <TextInput style={styles.textInput} placeholder="Quantity" onChangeText={ text => setQuantityState(text) } keyboardType="numeric" value={quantityState} />
                    
                    <Text>Is The Product Discounted?</Text>
                    <View style={styles.discountContainer}>
                        <TouchableOpacity
                            onPress={() => setIsDiscounted(true)}
                            style={isDiscounted === true ? styles.selectedButton : styles.unselectedButton}
                        >
                            <Text style={styles.buttonText}>Yes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setIsDiscounted(false)}
                            style={isDiscounted === false ? styles.selectedButton : styles.unselectedButton}
                        >
                            <Text style={styles.buttonText}>No</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={nextStep} style={styles.firstButton}>
                        <Text style={styles.buttonText}>Next</Text>
                    </TouchableOpacity>
                </ScrollView>
                </>
            )}

            {/* Step 2 - Categories, Types, Colors, Sizes */}
            {step === 2 && (
                <>
                <ScrollView>
                    <Text style={styles.arrayLabels}>Select Categories:</Text>
                    <View style={styles.multiSelectContainer}>
                        <ScrollView horizontal>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    onPress={() => toggleSelection(category, setSelectedCategories, selectedCategories)}
                                    style={selectedCategories.includes(category) ? styles.selectedItem : styles.unselectedItem}
                                >
                                    <Text>{category}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <Text style={styles.arrayLabels}>Select Types:</Text>
                    <View style={styles.multiSelectContainer}>
                        <ScrollView horizontal>
                            {types.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => toggleSelection(type, setSelectedTypes, selectedTypes)}
                                    style={selectedTypes.includes(type) ? styles.selectedItem : styles.unselectedItem}
                                >
                                    <Text>{type}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <Text style={styles.arrayLabels}>Select Colors:</Text>
                    <View style={styles.multiSelectContainer}>
                        <ScrollView horizontal>
                            {colors.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    onPress={() => toggleSelection(color, setSelectedColors, selectedColors)}
                                    style={selectedColors.includes(color) ? styles.selectedItem : styles.unselectedItem}
                                >
                                    <Text>{color}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Button to show/hide the custom color input */}
                    <TouchableOpacity onPress={() => setShowCustomColor(!showCustomColor)} style={styles.customMaterialToggle} >
                        <View style={{flex: 1, flexDirection: 'row',}}>
                            <Ionicons name={'menu-outline'} size={20} color={'black'} />
                            <Text style={{fontSize: 15,}}>{showCustomColor ? 'Hide Custom Color' : 'Add Custom Color'}</Text>
                        </View>
                    </TouchableOpacity>
                    
                    {/* Show custom input only if showCustomColor is true */}
                    {showCustomColor && (
                        <View style={styles.customInputWrap}>
                            <TextInput
                                style={styles.customInput}
                                placeholder="Custom Color"
                                onChangeText={(text) => setTempColor(text)}
                                value={tempColor}
                            />
                            <TouchableOpacity
                                onPress={() => {
                                    if (tempColor) {
                                        setSelectedColors((prev) => [...prev, tempColor.trim()]);
                                        setTempColor(''); // Clear the input field after adding
                                    }
                                }}
                                style={styles.customButton}
                            >
                                <Text>Add Material</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.materialList}>
                        {selectedColors.map((color, index) => (
                            <Text key={index}>{color}</Text>
                        ))}
                    </View>

                    <Text style={styles.arrayLabels}>Select Sizes:</Text>
                    <View style={styles.multiSelectContainer}>
                        <ScrollView horizontal>
                            {sizes.map((size) => (
                                <TouchableOpacity
                                    key={size}
                                    onPress={() => toggleSelection(size, setSelectedSizes, selectedSizes)}
                                    style={selectedSizes.includes(size) ? styles.selectedItem : styles.unselectedItem}
                                >
                                    <Text>{size}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.customWrap}>        
                        <Text style={styles.arrayLabels}>Select Materials:</Text>
                        <View style={styles.multiSelectContainer}>
                            <ScrollView horizontal>
                                {materials.map((material) => (
                                    <TouchableOpacity
                                        key={material}
                                        onPress={() => toggleSelection(material, setSelectedMaterials, selectedMaterials)}
                                        style={selectedMaterials.includes(material) ? styles.selectedItem : styles.unselectedItem}
                                    >
                                        <Text>{material}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Button to show/hide the custom material input */}
                        <TouchableOpacity onPress={() => setShowCustomMaterial(!showCustomMaterial)} style={styles.customMaterialToggle} >
                            <View style={{flex: 1, flexDirection: 'row',}}>
                                <Ionicons name={'menu-outline'} size={20} color={'black'} />
                                <Text style={{fontSize: 15,}}>{showCustomMaterial ? 'Hide Custom Material' : 'Add Custom Material'}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Show custom input only if showCustomMaterial is true */}
                        {showCustomMaterial && (
                            <View style={styles.customInputWrap}>
                                <TextInput
                                    style={styles.customInput}
                                    placeholder="Custom Material"
                                    onChangeText={(text) => setTempMaterial(text)}
                                    value={tempMaterial}
                                />
                                <TouchableOpacity
                                    onPress={() => {
                                        if (tempMaterial) {
                                            setSelectedMaterials((prev) => [...prev, tempMaterial.trim()]);
                                            setTempMaterial(''); // Clear the input field after adding
                                        }
                                    }}
                                    style={styles.customButton}
                                >
                                    <Text>Add Material</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Display the list of selected materials */}
                        <View style={styles.materialList}>
                            {selectedMaterials.map((material, index) => (
                                <Text key={index}>{material}</Text>
                            ))}
                        </View>
                    </View>

                    <View style={styles.buttonWrap}>
                        <TouchableOpacity onPress={prevStep} style={styles.button}>
                            <Text style={styles.buttonText}>Previous</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={nextStep} style={styles.button}>
                            <Text style={styles.buttonText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                    </ScrollView>
                </>
            )}

            {/* Step 3 - Materials, Description, and Image */}
            {step === 3 && (
                <>
                <ScrollView>
                    <Text>Description:</Text>
                    <TextInput 
                        style={styles.textInput} 
                        multiline={true} 
                        numberOfLines={15} 
                        placeholder="Enter product description here..."
                        placeholderTextColor="#888"
                        textAlignVertical="top" // Ensure text starts at the top of the input box
                        onChangeText={text => setDescriptionState(text)} 
                        value={descriptionState}/>

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

                    <TouchableOpacity onPress={uploadImage} style={styles.imgButton}>
                        <Text style={styles.imgButtonText}>Select Image</Text>
                    </TouchableOpacity>

                    <View style={styles.finalButtonWrap}>
                        <TouchableOpacity onPress={prevStep} style={styles.button}>
                            <Text style={styles.buttonText}>Previous</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={addProducts} style={styles.submitButton}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Add Product</Text>}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
        marginVertical: 20,
    },
    progressBar: {
        marginBottom: 20,
        backgroundColor: '#fff4ad',
    },
    textInput: {
        width: '100%',
        padding: 10,
        borderRadius: 5,
        backgroundColor: 'white',
        marginBottom: 20,
        marginTop: 8,
    },
    arrayLabels: {
        marginBottom: 8,
        marginTop: 10,
    },
    buttonWrap: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 30,
    },
    finalButtonWrap: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 30,
    },
    button: {
        backgroundColor: '#fabb00',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        width: '45%',
    },
    selectedButton: {
        backgroundColor: '#fcdb00',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 8,
        width: '45%',
    },
    unselectedButton: {
        backgroundColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 8,
        width: '45%',
    },
    discountContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    imgButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#fabb00',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginRight: 8,
    },
    buttonText: {
        color: 'black',
    },
    imgButtonText: {
        color: 'black',
    },
    submitButton: {
        backgroundColor: 'tomato',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        width: '45%',
    },
    submitButtonText: {
        color: '#fff',
    },
    image: {
        width: 100,
        height: 100,
        marginBottom: 10,
        borderRadius: 10,
        marginHorizontal: 5,
    },
    multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: '#fff4ad',
        padding: 5,
        marginBottom: 10,
    },
    selectedItem: {
        backgroundColor: '#fcdb00',
        padding: 10,
        margin: 5,
        borderRadius: 5,
    },
    unselectedItem: {
        backgroundColor: '#ccc',
        padding: 10,
        margin: 5,
        borderRadius: 5,
    },
    addButton: {
        backgroundColor: '#fabb00',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 8,
    },
    firstButton: {
        backgroundColor: '#fabb00',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 8,
    },
    materialList: {
        marginTop: 10,
        flex: 1,
        flexDirection: 'row',
    },
    customWrap: {
        borderWidth: 0,
    },
    customInputWrap: {
        flex: 1,
        flexDirection: 'row',
    },
    customInput: {
        width: '65%',
        padding: 10,
        borderRadius: 5,
        backgroundColor: 'white',
    },
    customButton: {
        width: '35%',
        backgroundColor: '#fabb00',
        padding: 10,
        alignItems: 'center',
    },
    customMaterialToggle: {
        backgroundColor: 'transparent',
        alignItems: 'center',
        marginVertical: 5,
        marginBottom: 12,
    },
    
});

export default AddProduct;
