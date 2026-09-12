import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { searchKeywords } from '@/components/searchKeywords';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');

const TRENDING_SEARCHES = [
  'Oversized Hoodie',
  'Wireless Headphones',
  'Canvas Tote Bag',
  'Leather Sneakers',
  'Aroma Diffuser',
  'Heritage Watch',
  'Streetwear',
  'French Terry',
  'Accessories',
];

const SearchScreen: React.FC = () => {
  const params = useLocalSearchParams<{ value?: string }>();
  const initialValue = typeof params.value === 'string' && params.value !== 'undefined' ? params.value : '';

  const [query, setQuery] = useState<string>(initialValue);
  const [filteredKeywords, setFilteredKeywords] = useState<string[]>([]);
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);
  const searchInputRef = useRef<TextInput | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();
  const isFocused = useIsFocused();

  useEffect(() => {
    loadRecentKeywords();
  }, []);

  const loadRecentKeywords = async () => {
    try {
      const saved = await AsyncStorage.getItem('recentKeywords');
      if (saved) {
        setRecentKeywords(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load recent keywords:', error);
    }
  };

  useEffect(() => {
    if (searchInputRef.current && isFocused) {
      searchInputRef.current.focus();
    }
  }, [isFocused]);

  useEffect(() => {
    if (params.value && params.value !== 'undefined') {
      setQuery(params.value);
    }
  }, [params.value]);

  const handleChangeText = (text: string) => {
    setQuery(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (text.trim().length > 0) {
        const queryLower = text.toLowerCase().trim();
        const allPool = Array.from(new Set([...searchKeywords, ...TRENDING_SEARCHES]));
        const filtered = allPool.filter((k) => k.toLowerCase().includes(queryLower));
        setFilteredKeywords(filtered.slice(0, 8));
      } else {
        setFilteredKeywords([]);
      }
    }, 200);
  };

  const handleSelectKeyword = async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;

    try {
      const updated = [trimmed, ...recentKeywords.filter((k) => k.toLowerCase() !== trimmed.toLowerCase())].slice(0, 15);
      setRecentKeywords(updated);
      await AsyncStorage.setItem('recentKeywords', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent keyword:', error);
    }

    setFilteredKeywords([]);
    router.push(`/ResultScreen?keyword=${encodeURIComponent(trimmed)}`);
  };

  const handleDeleteRecentKeyword = async (keyword: string) => {
    try {
      const updated = recentKeywords.filter((k) => k !== keyword);
      setRecentKeywords(updated);
      await AsyncStorage.setItem('recentKeywords', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to delete recent keyword:', error);
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
      return <Text style={styles.suggestionText}>{item}</Text>;
    }

    const before = item.slice(0, index);
    const match = item.slice(index, index + query.length);
    const after = item.slice(index + query.length);

    return (
      <Text style={styles.suggestionText}>
        {before}
        <Text style={styles.boldMatch}>{match}</Text>
        {after}
      </Text>
    );
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerInputWrap}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color="#888" style={{ marginLeft: 6 }} />
                <TextInput
                  ref={searchInputRef}
                  style={styles.input}
                  placeholder="Search products, brands, styles..."
                  placeholderTextColor="#999"
                  value={query}
                  onChangeText={handleChangeText}
                  onSubmitEditing={() => handleSelectKeyword(query)}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => handleChangeText('')} style={styles.clearInputBtn}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ),
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Real-time Autocomplete Suggestions Dropdown */}
        {filteredKeywords.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {filteredKeywords.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.suggestionRow}
                onPress={() => handleSelectKeyword(item)}
              >
                <Ionicons name="search-outline" size={16} color="#aaa" style={{ marginRight: 10 }} />
                {renderHighlightedText(item)}
                <Feather name="arrow-up-left" size={16} color="#bbb" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 1. Recent Searches with 1-Tap Remove */}
        {recentKeywords.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons name="history" size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Recent Searches</Text>
              </View>
              <TouchableOpacity onPress={handleClearRecentSearches}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipsWrap}>
              {recentKeywords.map((item, index) => (
                <View key={index} style={styles.recentChip}>
                  <TouchableOpacity onPress={() => handleSelectKeyword(item)}>
                    <Text style={styles.recentChipText}>{item}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteRecentKeyword(item)}
                    style={styles.chipDeleteBtn}
                  >
                    <Ionicons name="close" size={13} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 2. Trending & Discover Suggestions */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flame-outline" size={18} color="#e11d48" />
              <Text style={styles.sectionTitle}>Trending Searches</Text>
            </View>
          </View>

          <View style={styles.chipsWrap}>
            {TRENDING_SEARCHES.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.trendingChip}
                onPress={() => handleSelectKeyword(item)}
              >
                <Text style={styles.trendingChipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerInputWrap: {
    width: width * 0.78,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 22,
    paddingHorizontal: 8,
    height: 38,
  },
  input: {
    flex: 1,
    height: 38,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  clearInputBtn: {
    padding: 4,
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  suggestionText: {
    fontSize: 14,
    color: '#4b5563',
  },
  boldMatch: {
    fontWeight: 'bold',
    color: Colors.primary,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.title,
    marginLeft: 6,
  },
  clearAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 8,
  },
  recentChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  chipDeleteBtn: {
    padding: 4,
    marginLeft: 4,
  },
  trendingChip: {
    backgroundColor: '#faf6f4',
    borderWidth: 1,
    borderColor: '#e8ded8',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    marginRight: 8,
    marginBottom: 8,
  },
  trendingChipText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
});
