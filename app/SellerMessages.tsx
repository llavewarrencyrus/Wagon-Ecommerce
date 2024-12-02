import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Alert,
  Pressable,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { SellerMessagesNavigationProp } from '@/types/types';

interface Message {
  messages_id: string;
  sender: string;
  receiver: string;
  message: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
}

export default function SellerMessages() {
  const router = useRouter();
  const navigation = useNavigation<SellerMessagesNavigationProp>();
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [senderInfo, setSenderInfo] = useState<{ [key: string]: User }>({});
  const [refreshing, setRefreshing] = useState(false); // State for pull-to-refresh
  const receiver = '95699985-ed4f-491b-9e38-a34c82503ba7';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/LoginScreen');
    } else {
      fetchMessages();
    }
  }, [isAuthenticated]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .neq('sender', receiver)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Could not fetch messages: ${error.message}`);
      }

      const latestMessages = getLatestMessagesBySender(data || []);
      setMessages(latestMessages);
      fetchSenderInfo(latestMessages);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch messages');
    }
  };

  const getLatestMessagesBySender = (messages: Message[]) => {
    const latestMessages: { [key: string]: Message } = {};
    messages.forEach((msg) => {
      if (!latestMessages[msg.sender]) {
        latestMessages[msg.sender] = msg;
      }
    });
    return Object.values(latestMessages);
  };

  const fetchSenderInfo = async (messages: Message[]) => {
    const senderIds = [...new Set(messages.map((msg) => msg.sender))];

    if (senderIds.length === 0) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .in('id', senderIds);

      if (error) {
        throw new Error(`Could not fetch sender info: ${error.message}`);
      }

      const senderData: { [key: string]: User } = {};
      data?.forEach((user: User) => {
        senderData[user.id] = user;
      });

      setSenderInfo(senderData);
    } catch (error) {
      console.log('Error fetching sender info:', error);
    }
  };

  const handlePress = (senderId: string) => {
    navigation.navigate('SellerChat', { senderId }); // Pass senderId to SellerChat
  };

  const formatDate = (dateString: string) => {
    const now = new Date();
    const messageDate = new Date(dateString);

    const isToday = now.toDateString() === messageDate.toDateString();

    const options: Intl.DateTimeFormatOptions = isToday
      ? { hour: '2-digit', minute: '2-digit' }
      : { year: 'numeric', month: '2-digit', day: '2-digit' };

    return messageDate.toLocaleDateString(undefined, options);
  };

  const onRefresh = async () => {
    setRefreshing(true); // Start refreshing animation
    await fetchMessages(); // Fetch messages again
    setRefreshing(false); // Stop refreshing animation
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const scaleValue = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => handlePress(item.sender)}
      >
        <Animated.View
          style={[
            styles.messageContainer,
            { transform: [{ scale: scaleValue }] },
          ]}
        >
          <View style={styles.messageRow}>
            <View style={styles.circleIcon}>
              <Text style={styles.circleText}>
                {senderInfo[item.sender]?.username?.[0] || '?'}
              </Text>
            </View>
            <View style={styles.messageContent}>
              <Text style={styles.username}>
                {senderInfo[item.sender]?.username || 'Loading...'}
              </Text>
              <Text style={styles.latestMessage}>
                {item.message}
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Chats</Text>
      </View>
      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.messages_id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressBackgroundColor="#f1f1f1" // Background color of the refresh control
            colors={['#FF6347']} // Color of the refresh spinner
            tintColor="#000000" // Color of the refresh spinner on iOS
            title="Pull to refresh" // Text while refreshing
            titleColor="#000000" // Text color of the pull-to-refresh message
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  listContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'brown',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: 'brown',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 2,
  },
  circleText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  messageContent: {
    flex: 1,
    flexShrink: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,
  },
  latestMessage: {
    marginTop: 4,
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
    maxWidth: '90%',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
});
