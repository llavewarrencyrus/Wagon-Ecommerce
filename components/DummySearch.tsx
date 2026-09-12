import React, { useState } from "react";
import { Pressable, TextInput, View, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { DummySearch } from "@/types/types";
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const DummySearchBar: React.FC<DummySearch> = ({ value }) => {
  const router = useRouter();
  const navigation = useNavigation();

  const goToSearchScreen = () => {
    const encoded = value ? encodeURIComponent(value) : '';
    router.push(`/SearchScreen?value=${encoded}`);
  };

  

  return (
    <View style={styles.container}>
      <Pressable onPress={goToSearchScreen} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search..."
          editable={false}
          value={value}
        />
        <Ionicons name="search" size={20} style={styles.searchIcon} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  input: {
    height: 40,
    flex: 1,
    color: 'black',
  },
  searchIcon: {
    backgroundColor: Colors.button,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
});

export default DummySearchBar;
