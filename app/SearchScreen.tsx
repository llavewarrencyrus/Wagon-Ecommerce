// SearchBar.tsx
import React, { useState, useEffect } from 'react';
import { ScrollView, View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, Dimensions, Pressable } from 'react-native';
import { useRouter} from 'expo-router';
import { searchKeywords } from '@/components/searchKeywords';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';


const SearchScreen: React.FC = () => {
  const { width } = Dimensions.get('window');
  const [query, setQuery] = useState<string>('');
  const [filteredKeywords, setFilteredKeywords] = useState<string[]>([]);
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);

  const router = useRouter();

  useEffect(() => {
    const loadRecentKeywords = async () => {
      try {
        const savedKeywords = await AsyncStorage.getItem('recentKeywords');
        if (savedKeywords) {
          setRecentKeywords(JSON.parse(savedKeywords));
        }
      } catch (error) {
        console.error('Failed to load recent keywords:', error);
      }
    };

    loadRecentKeywords();
  }, []);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (text) {
      const filtered = searchKeywords.filter(keyword =>
        keyword.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredKeywords(filtered);
    } else {
      setFilteredKeywords([]);
    }
  };

  const handleSelectKeyword = async (keyword: string) => {
    setQuery(keyword);
    setFilteredKeywords([]);
    try {
      const updatedKeywords = [keyword, ...recentKeywords.filter(k => k !== keyword)];
      setRecentKeywords(updatedKeywords);
      await AsyncStorage.setItem('recentKeywords', JSON.stringify(updatedKeywords));
    } catch (error) {
      console.error('Failed to save recent keywords:', error);
    }
    router.push(`../UnderConstruction`);
    //router.push(`../Result?keyword=${keyword}`);
  };

  const handleSubmitEditing = () => {
    if (query) {
      handleSelectKeyword(query);
    }
  };

  const handleClearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem('recentKeywords');
      setRecentKeywords([]);
    } catch (error) {
      console.error('Failed to clear recent keywords:', error);
    }
  };

  const renderHighlightedText = (item: string) => {
    const index = item.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) {
      return <Text>{item}</Text>;
    }

    const beforeMatch = item.slice(0, index);
    const match = item.slice(index, index + query.length);
    const afterMatch = item.slice(index + query.length);

    return (
      <Text style={styles.notMatch}>
        {beforeMatch}
        <Text style={styles.boldText}>{match}</Text>
        {afterMatch}
      </Text>
    );
  };

  return (
    <>
      <Stack.Screen options={{
        headerTitle: () =>
          <View style={{ width: width * 0.75 }}>
            <View style={styles.containerInp}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Search..."
                  value={query}
                  onChangeText={handleChangeText}
                  onSubmitEditing={handleSubmitEditing}
                />
                <Pressable onPress={handleSubmitEditing}>
                  <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                </Pressable>
              </View>
            </View>
          </View>,
        headerStyle: {
          backgroundColor: 'white',
        },
      }}>
      </Stack.Screen>
      <View>
        {filteredKeywords.length > 0 && (
          <FlatList
            data={filteredKeywords}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelectKeyword(item)}>
                <View style={styles.suggestionItem}>
                  {renderHighlightedText(item)}
                </View>
              </TouchableOpacity>
            )}
            style={styles.suggestionList}
          />
        )}
        {recentKeywords.length > 0 && (
          <View>
            <View style={{flexDirection:'row', justifyContent:'space-between', height: 50, paddingHorizontal:20}}>
              <Text style={styles.recent}>Recent Search:</Text>
              <TouchableOpacity onPress={handleClearRecentSearches} style={styles.clearButton}>
                <Ionicons name='trash-outline' size={20} color={Colors.secondary}/>
              </TouchableOpacity>
            </View>
            <View style={styles.recentItemContainer}>
                {recentKeywords.map((item, index) => (
                  <TouchableOpacity key={index} onPress={() => handleSelectKeyword(item)}>
                    <View style={styles.recentItem}>
                      <Text style={{color: '#fff'}}>{item}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>

            
          </View>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  suggestionList: {
    maxHeight: 500,
    backgroundColor: '#ffffff',
    zIndex: 99
  },
  suggestionItem: {
    padding: 16,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  containerInp: {
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
    color: '#000',

  },
  searchIcon: {
    backgroundColor: Colors.button,
    color: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000'
  },
  notMatch: {
    color: Colors.secondary
  },

  clearButton: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 'auto',
  },
  recent:{
    marginVertical: 'auto',
  },
  recentItem:{
    margin: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  recentItemContainer :{
    flexDirection:'row',
  }
});

export default SearchScreen;
