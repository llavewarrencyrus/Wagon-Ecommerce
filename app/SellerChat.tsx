import React, { useEffect, useState } from 'react';
import { useRoute } from '@react-navigation/native'; // Import useRoute
import { StyleSheet, Button, Text, View, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthContext';
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
}

export default function SellerChat() {
  const route = useRoute();
  const { senderId } = route.params as { senderId: string }; // Get senderId from params
  const { isAuthenticated, user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [senderInfo, setSenderInfo] = useState<{ [key: string]: User }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      // Handle unauthenticated user
      return;
    }
    fetchMessages();
  }, [isAuthenticated, senderId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender.eq.${senderId},receiver.eq.${senderId}`)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Could not fetch messages: ${error.message}`);
      }

      setMessages(data || []);
      fetchSenderInfo(data || []);
    } catch (error) {
      Alert.alert('Error', `Could not fetch messages1: `);
    }
  };

  const fetchSenderInfo = async (messages: Message[]) => {
    const senderIds = [...new Set(messages.map((msg) => msg.sender))];

    const promises = senderIds.map(async (id) => {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', id)
        .single();

      if (error) {
        console.log(`Error fetching sender info for ID ${id}: ${error.message}`);
        return null;
      }

      return { id: data.id, username: data.username };
    });

    const users = await Promise.all(promises);
    const senderData: { [key: string]: User } = {};
    users.forEach((user) => {
      if (user) {
        senderData[user.id] = user;
      }
    });

    setSenderInfo(senderData);
  };

  const handleSendMessage = async () => {
    if (message.trim() === '') {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to send messages');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ sender: user.id, receiver: senderId, message }]);

      if (error) {
        throw new Error(`Could not send message: ${error.message}`);
      }
      setMessage('');
      fetchMessages(); // Refetch messages to include the newly sent message
    } catch (error) {
      Alert.alert('Error', `Could not send message2: `);
    }
  };

  const formatDate = (dateString: string) => {
    const messageDate = new Date(dateString);
  
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    };
  
    return messageDate.toLocaleString(undefined, options);
  };
  
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.messagesWrapper}>
        <ScrollView contentContainerStyle={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <View
              key={`${msg.id}-${index}`} // unique key is directly assigned to the View element
              style={[
                styles.messageContainer,
                msg.sender === user?.id ? styles.sellerMessageContainer : styles.receiverMessageContainer
              ]}
            >
              {msg.sender !== user?.id && (
                <View style={styles.senderInfo}>
                  <View style={styles.circleIcon}>
                    <Text style={styles.circleText}>{senderInfo[msg.sender]?.username[0] || '?'}</Text>
                  </View>
                  <View style={styles.senderDetails}>
                    <Text style={styles.username}>{senderInfo[msg.sender]?.username || 'Loading...'}</Text>
                  </View>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.sender === user?.id ? styles.sellerMessageBubble : styles.receiverMessageBubble
                ]}
              >
                <Text>{msg.message}</Text>
                <Text
                  style={[
                    styles.timestamp,
                    msg.sender === user?.id ? styles.sellerTimestamp : styles.receiverTimestamp
                  ]}
                >
                  {formatDate(msg.created_at)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={message}
          onChangeText={setMessage}
        />
         <TouchableOpacity onPress={handleSendMessage}>
            <Ionicons name='send' size={30} color={'brown'}/>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    flexDirection: 'column',
  },
  messagesWrapper: {
    flex: 1,
  },
  messagesContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    marginBottom: 10,
    flexDirection: 'column', // Ensure that the message and sender info are aligned in a column
  },
  sellerMessageContainer: {
    alignSelf: 'flex-end',
  },
  receiverMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  circleIcon: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'brown',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  circleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  senderDetails: {
    flexDirection: 'column',
  },
  username: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sellerMessageBubble: {
    backgroundColor: 'transparent',
    color: '#fff',
  },
  receiverMessageBubble: {
    backgroundColor: '#f1f1f1',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginRight: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  sellerTimestamp: {
    textAlign: 'right',
  },
  receiverTimestamp: {
    textAlign: 'right',
  },
});
