import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { SellerMessagesNavigationProp } from '@/types/types';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  sender: string;
  receiver: string;
  message: string;
  created_at: string;
}

interface User {
  id: string;
  username: string;
  profile_picture?: string;
}

export default function SellerMessages() {
  const router = useRouter();
  const navigation = useNavigation<SellerMessagesNavigationProp>();
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [senderInfo, setSenderInfo] = useState<{ [key: string]: User }>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/LoginScreen');
    } else if (user?.id) {
      fetchMessages();

      // Realtime listener for incoming messages
      const channel = supabase
        .channel('seller-messages-list')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver=eq.${user.id}`,
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isAuthenticated, user]);

  const fetchMessages = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`receiver.eq.${user.id},sender.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Could not fetch messages: ${error.message}`);
      }

      const latestConversations = getLatestMessagesByConversation(data || [], user.id);
      setMessages(latestConversations);
      fetchSenderInfo(latestConversations, user.id);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const getLatestMessagesByConversation = (allMessages: Message[], currentUserId: string) => {
    const conversationMap: { [partnerId: string]: Message } = {};

    allMessages.forEach((msg) => {
      const partnerId = msg.sender === currentUserId ? msg.receiver : msg.sender;
      if (!conversationMap[partnerId]) {
        conversationMap[partnerId] = msg;
      }
    });

    return Object.values(conversationMap);
  };

  const fetchSenderInfo = async (conversationList: Message[], currentUserId: string) => {
    const partnerIds = [
      ...new Set(
        conversationList.map((msg) => (msg.sender === currentUserId ? msg.receiver : msg.sender))
      ),
    ];

    if (partnerIds.length === 0) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, profile_picture')
        .in('id', partnerIds);

      if (error) {
        throw new Error(`Could not fetch user info: ${error.message}`);
      }

      const infoMap: { [key: string]: User } = {};
      data?.forEach((u: User) => {
        infoMap[u.id] = u;
      });

      setSenderInfo(infoMap);
    } catch (error) {
      console.log('Error fetching sender info:', error);
    }
  };

  const handlePress = (partnerId: string) => {
    navigation.navigate('SellerChat', { senderId: partnerId });
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
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const currentUserId = user?.id || '';
    const partnerId = item.sender === currentUserId ? item.receiver : item.sender;
    const partner = senderInfo[partnerId];
    const isOutgoing = item.sender === currentUserId;

    return (
      <Pressable onPress={() => handlePress(partnerId)}>
        <View style={styles.messageContainer}>
          <View style={styles.messageRow}>
            <View style={styles.circleIcon}>
              <Text style={styles.circleText}>
                {partner?.username ? partner.username.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <View style={styles.messageContent}>
              <Text style={styles.username}>{partner?.username || 'Customer'}</Text>
              <Text style={styles.latestMessage} numberOfLines={1}>
                {isOutgoing ? 'You: ' : ''}
                {item.message}
              </Text>
            </View>
            <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Customer Inquiries</Text>
        <Text style={styles.headerSub}>Live chats with buyers</Text>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5C3A2E']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="chatbubbles-outline" size={56} color="#C4B0A3" />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              When prospective buyers inquire about your products, their chats will appear here in real time.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E1E17',
  },
  headerSub: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  listContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5C3A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  circleText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageContent: {
    flex: 1,
    marginRight: 8,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E1E17',
  },
  latestMessage: {
    marginTop: 3,
    color: '#666',
    fontSize: 13,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
