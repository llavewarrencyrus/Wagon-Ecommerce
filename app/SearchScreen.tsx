import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, Dimensions, Pressable } from 'react-native';

import { useRouter, Stack } from 'expo-router';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { searchKeywords } from '@/components/searchKeywords';
import { Colors } from '@/constants/Colors';
import { SearchScreenProp } from '@/types/types';

const SearchScreen: React.FC = () => {
  const { width } = Dimensions.get('window');
  const [query, setQuery] = useState<string | ''>('');
  const [filteredKeywords, setFilteredKeywords] = useState<string[]>([]);
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);
  const searchInputRef = useRef<TextInput | null>(null);

  const [showAll, setShowAll] = useState(false);
  const [discoverAll, setDiscoverAll] = useState(false);

  const onPageLayout = useCallback(() => searchInputRef.current?.focus(), []);

  const [clear, setClear] = useState(false);

  const route = useRoute<SearchScreenProp>();
  const { value } = route.params;

  const router = useRouter();
  const isFocused = useIsFocused();

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

  useEffect(() => {
    if (searchInputRef.current && isFocused) {
      searchInputRef.current.focus();
    }
  }, [isFocused]);

  useEffect(() => {
    if (value !== undefined && value !== 'undefined') {
      setQuery(value);
    } else {
      setClear(true);
    }
  }, [value]);

  const suggestSearch = [
    'Summer Dresses', 'Casual Wear', 'Athleisure', 'Formal Attire', 'Winter Jackets', 'Puff Sleeve Midi Dress', 'Slim Fit Jeans', 'Graphic Tees', 'Leather Jackets', 'Maxi Skirts', 'Cozy Sweaters', 'Beachwear', 'Raincoats', 'Party Outfits', 'Swimwear', 'Sneakers'
  ]

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
    router.navigate(`../ResultScreen?keyword=${keyword}`);
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

  const handleToggleShowAll = () => {
    setShowAll(!showAll);
  };

  const handleToggleDiscoverAll = () => {
    setDiscoverAll(!discoverAll);
  };

  const handleOnFocus = () => {
    if (clear) {
      searchInputRef.current?.clear();
      setQuery('');
    }
  }

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
          <View onLayout={onPageLayout} style={{ width: width * 0.75 }}>
            <View style={styles.containerInp}>
              <View style={styles.inputContainer}>
                <TextInput
                  ref={searchInputRef}
                  autoFocus={true}
                  style={styles.input}
                  placeholder="Search..."
                  value={query}
                  onChangeText={handleChangeText}
                  onSubmitEditing={handleSubmitEditing}
                  cursorColor={Colors.text}
                  onFocus={handleOnFocus}
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
          <View style={{paddingTop: 10}}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 3 }}>
              <Text style={styles.recent}>Recently Searched</Text>
              <TouchableOpacity onPress={handleClearRecentSearches} style={styles.clearButton}>
                <Ionicons name='trash-outline' size={20} color={Colors.secondary} style={{ position: 'absolute', right: 10 }} />
              </TouchableOpacity>
            </View>

            <View style={styles.recentItemContainer}>
              {(showAll ? recentKeywords : recentKeywords.slice(0, 10)).map((item, index) => (
                <TouchableOpacity key={index} onPress={() => handleSelectKeyword(item)}>
                  <View style={styles.recentItem}>
                    <Text style={{ color: '#fff' }}>{item}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {recentKeywords.length > 10 && (
                <TouchableOpacity onPress={handleToggleShowAll} style={styles.showMoreButton}>
                  <Text style={{ color: Colors.primary }}>
                    {showAll ? <>Less <AntDesign name="up" size={12} color={Colors.button}/></> : <>More <AntDesign name="down" size={12} color={Colors.button}/></>}
                  </Text>
                </TouchableOpacity>
              )}
            </View>


          </View>
        )}
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 3 }}>
            <Text style={styles.recent}>Discover</Text>
          </View>
          <View style={styles.recentItemContainer}>
            {(discoverAll ? suggestSearch : suggestSearch.slice(0, 10)).map((item, index) => (
              <TouchableOpacity key={index} onPress={() => handleSelectKeyword(item)}>
                <View style={styles.recentItem}>
                  <Text style={{ color: '#fff' }}>{item}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {suggestSearch.length > 10 && (
                <TouchableOpacity onPress={handleToggleDiscoverAll} style={styles.showMoreButton}>
                  <Text style={{ color: Colors.primary }}>
                    {discoverAll ? <>Less <AntDesign name="up" size={12} color={Colors.button}/></> : <>More <AntDesign name="down" size={12} color={Colors.button}/></>}
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        </View>
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
  recent: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: 'bold'
  },
  recentItem: {
    margin: 3,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: Colors.selectHighlight,
  },
  recentItemContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  showMoreButton: {
    justifyContent:'center',
    marginHorizontal: 10
  }
});

export default SearchScreen;
