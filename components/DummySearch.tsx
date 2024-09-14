import React from "react";
import { Pressable, TextInput, View, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons'; // Import icon library
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

const DummySearchBar = () => {
  const router = useRouter();

  const goToSearchScreen = () => {
    router.push(`../SearchScreen`);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={goToSearchScreen} style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search..."
          editable={false}
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
    color: Colors.secondary,

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
