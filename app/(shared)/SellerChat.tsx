import React, { useEffect, useState, useRef } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CustomAlertModal, { ModalButton } from '@/components/common/CustomAlertModal';
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
}

export default function SellerChat() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as { senderId: string; initialMessage?: string };
  const senderId = params?.senderId;

  const { isAuthenticated, user } = useAuth();
  const [message, setMessage] = useState(params?.initialMessage || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [partnerInfo, setPartnerInfo] = useState<User | null>(null);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: ModalButton[];
  }>({ visible: false, title: "", message: "" });

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !senderId) return;

    fetchMessages();
    fetchPartnerInfo();

    // Supabase Realtime Channel for active conversation
    const channel = supabase
      .channel(`seller-chat-${senderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender === user.id && newMsg.receiver === senderId) ||
            (newMsg.sender === senderId && newMsg.receiver === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user, senderId]);

  const fetchPartnerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .eq('id', senderId)
        .single();

      if (!error && data) {
        setPartnerInfo(data);
        navigation.setOptions({ title: data.username || 'Customer' });
      }
    } catch (e) {
      console.error('Error fetching partner info:', e);
    }
  };

  const fetchMessages = async () => {
    if (!user?.id || !senderId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender.eq.${user.id},receiver.eq.${senderId}),and(sender.eq.${senderId},receiver.eq.${user.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();
    } catch (error: any) {
      console.error('Could not fetch messages:', error.message);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (message.trim() === '' || !user?.id || !senderId) return;

    const textToSend = message.trim();
    setMessage('');
    setSending(true);

    try {
      const { error } = await supabase.from('messages').insert([
        {
          sender: user.id,
          receiver: senderId,
          message: textToSend,
        },
      ]);

      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      setAlertModal({
        visible: true,
        title: 'Send Error',
        message: error.message || 'Could not send message.',
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const messageDate = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
    };
    return messageDate.toLocaleTimeString(undefined, options);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((msg, index) => {
            const isMine = msg.sender === user?.id;
            return (
              <View
                key={`${msg.id || index}`}
                style={[
                  styles.messageRow,
                  isMine ? styles.myMessageRow : styles.partnerMessageRow,
                ]}
              >
                {!isMine && (
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarText}>
                      {partnerInfo?.username ? partnerInfo.username.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    isMine ? styles.myMessageBubble : styles.partnerMessageBubble,
                  ]}
                >
                  <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                    {msg.message}
                  </Text>
                  <Text style={[styles.timestamp, isMine && styles.myTimestamp]}>
                    {formatDate(msg.created_at)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a reply to customer..."
            placeholderTextColor="#888"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!message.trim() || sending) && { opacity: 0.5 }]}
            onPress={handleSendMessage}
            disabled={!message.trim() || sending}
          >
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CustomAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        buttons={alertModal.buttons}
        onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  partnerMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5C3A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#5C3A2E',
    borderBottomRightRadius: 4,
  },
  partnerMessageBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#ECECEC',
  },
  messageText: {
    fontSize: 14,
    color: '#222',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFF',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: '#D4C0B5',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    backgroundColor: '#F9F9F9',
    fontSize: 14,
    color: '#333',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5C3A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
