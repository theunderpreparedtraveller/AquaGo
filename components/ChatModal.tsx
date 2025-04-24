import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Send, X } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../lib/supabase';

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  deliveryId: string;
}

interface Message {
  id: string;
  message: string;
  is_supplier: boolean;
  created_at: string;
}

export default function ChatModal({ visible, onClose, deliveryId }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (visible) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [visible, deliveryId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_chat_messages', {
        p_delivery_id: deliveryId
      });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('[Chat Error]:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('chat_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `delivery_id=eq.${deliveryId}`
      }, (payload) => {
        console.log('New message:', payload);
        fetchMessages();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const { error } = await supabase.rpc('send_chat_message', {
        p_delivery_id: deliveryId,
        p_message: newMessage.trim()
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('[Send Message Error]:', error);
    } finally {
      setSending(false);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Chat with Supplier</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.messagesContainer}
            inverted
          >
            {loading ? (
              <ActivityIndicator color="#FFA500" style={styles.loading} />
            ) : messages.length === 0 ? (
              <Text style={styles.emptyText}>No messages yet</Text>
            ) : (
              messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.is_supplier ? styles.supplierMessage : styles.userMessage
                  ]}
                >
                  <Text style={styles.messageText}>{message.message}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(message.created_at).toLocaleTimeString()}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <Send size={20} color="#000000" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1a1f2b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#242430',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#242430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  loading: {
    marginVertical: 20,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
    marginVertical: 20,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFA500',
  },
  supplierMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#242430',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#242430',
  },
  input: {
    flex: 1,
    backgroundColor: '#242430',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
});