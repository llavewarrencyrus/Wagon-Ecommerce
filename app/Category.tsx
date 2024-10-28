import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Dimensions, Pressable, Image,TouchableOpacity } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';

import NetworkIssue from '@/components/NetworkIssue';
import { useNetwork } from '@/components/NetworkContext';

import { getCategoryList } from '@/data/data';
import { Colors } from '@/constants/Colors';
import DummySearch from '@/components/DummySearch';
import Loading from '@/components/Loading';

const { width } = Dimensions.get('window');


const Tab = createMaterialTopTabNavigator();


const CategoryScreen = () => {
  const { isConnected, refreshNetworkStatus } = useNetwork();

  if (!isConnected) {
    return <NetworkIssue onRetry={refreshNetworkStatus} />;
  }

  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchMainCategories = async () => {
      const categories = await getCategoryList(null);
      if (categories) {
        setMainCategories(categories);
      }
      setLoading(false);
    };
    fetchMainCategories();
  }, []);

  return (
    <>
      {!loading ? (
      <Tab.Navigator
        screenOptions={{
          tabBarScrollEnabled: true,
          tabBarStyle: styles.tabBar,
          tabBarIndicatorStyle: styles.indicator,
          tabBarItemStyle: styles.tab,
          tabBarActiveTintColor: Colors.selectHighlight,
          tabBarInactiveTintColor: Colors.link,
        }}
      >
        {mainCategories.map((category: any) => (
          <Tab.Screen
            key={category.id}
            name={category.category}
            options={{
              tabBarLabel: ({ focused }) => (
                <Text style={[styles.label, focused && styles.labelFocused]}>
                  {category.category}
                </Text>
              ),
            }}
            children={() => <SubcategoryScreen parentId={category.id} mainCategory={category.category} />}
          />
        ))}
      </Tab.Navigator>):(<Loading/>)}
    </>
  );
};

const SubcategoryScreen = ({ parentId, mainCategory }: {parentId: number, mainCategory: string}) => {
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetched, setIsFetched] = useState(false); 
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (!isFetched) {
        const fetchSubcategories = async () => {
          setLoading(true);
          const categories = await getCategoryList(parentId);
          if (categories) {
            setSubcategories(categories);
          }
          setLoading(false);
          setIsFetched(true); 
        };
        fetchSubcategories();
      }
    }, [parentId, isFetched]) 
  );

  if (loading && !isFetched) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.loadingIndicator} />
      </View>
    );
  }

  const handleOnPress = (subcategory: any) => {
    router.push(`../ResultScreen?category=${mainCategory}&keyword=${subcategory.category}`);
  };

  return (
    <View style={styles.subcategoryContainer}>
      <FlatList
        data={subcategories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable style={styles.item} onPress={() => handleOnPress(item)}>
            <View style={{ flexDirection:'column'}}>
              <Image source={{uri: item.image}} style={{flex: 1, width: 70,height: 70,resizeMode: 'contain', margin:'auto'}}/>
              <Text style={{margin:'auto', fontSize:16, marginBottom:10}}>{item.category}</Text>
            </View>
          </Pressable>
        )}
        numColumns={2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
  },
  indicator: {
    backgroundColor: Colors.selectHighlight,
  },
  label: {
    fontSize: 16,
    color: Colors.link,
    fontWeight: '200',
  },
  labelFocused: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.selectHighlight, 
  },
  subcategoryContainer: {
    flex: 1,
    padding: 4,
  },
  tab: {
    width: 'auto',
  },
  item: {
    width: (width / 2) - 16,
    height: (width / 2) - 16,
    margin: 'auto',
    marginVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 0.9,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryScreen;
