import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Button, Text, View, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
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
  profile_picture: string;
}

export default function Chat() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [receiverInfo, setReceiverInfo] = useState<User | null>(null);
  const receiver = '95699985-ed4f-491b-9e38-a34c82503ba7';
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/LoginScreen');
    } else if (user) {
      fetchMessages();
      fetchReceiverInfo();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    scrollToEnd();
  }, [messages]);

  const fetchReceiverInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, profile_picture')
        .eq('id', receiver)
        .single();

      if (error) {
        throw new Error(`Could not fetch receiver info: ${error.message}`);
      }
      setReceiverInfo(data || null);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch receiver info');
    }
  };

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender.eq.${user.id},receiver.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Could not fetch messages: ${error.message}`);
      }
      setMessages(data || []);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch messages');
    }
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
        .insert([{ sender: user.id, receiver, message }]);

      if (error) {
        throw new Error(`Could not send message: ${error.message}`);
      }
      setMessage('');
      fetchMessages(); // Refetch messages to include the newly sent message
    } catch (error) {
      Alert.alert('Error', 'Could not send message');
    }
  };

  const scrollToEnd = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          style={styles.messagesContainer}
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
        >
          {messages.map((msg, index) => (
            <View
              key={`${msg.id}-${index}`} // Unique key prop for each message
              style={[
                styles.messageContainer,
                msg.sender === user?.id ? styles.messageFromUser : styles.messageFromReceiver
              ]}
            >
              {msg.sender !== user?.id && receiverInfo && (
                <View style={styles.senderInfo}>
                  <View style={styles.senderIcon}>
                    <Text style={styles.senderIconText}>
                      {receiverInfo.username.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={styles.senderDetails}>
                    <Text style={styles.senderUsername}>{receiverInfo.username || 'Loading...'}</Text>
                  </View>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.sender === user?.id ? styles.messageFromUserBubble : styles.messageFromReceiverBubble
                ]}
              >
                <Text>{msg.message}</Text>
                <Text style={[
                  styles.timestamp,
                  msg.sender === user?.id ? styles.sellerTimestamp : styles.receiverTimestamp
                ]}>
                  {formatDate(msg.created_at)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  messagesContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    flexDirection: 'column',
    marginBottom: 10,
  },
  messageFromUser: {
    alignSelf: 'flex-end',
  },
  messageFromReceiver: {
    alignSelf: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  senderIcon: {
    width: 25,
    height: 25,
    borderRadius: 12,
    backgroundColor: 'brown',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  senderIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  senderDetails: {
    flexDirection: 'column',
  },
  senderUsername: {
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
  messageFromUserBubble: {
    backgroundColor: 'transparent',
    color: '#fff',
  },
  messageFromReceiverBubble: {
    backgroundColor: '#f1f1f1',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
