import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Check, X, TriangleAlert as AlertTriangle, Phone, MessageSquare } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../lib/supabase';
import ChatModal from './ChatModal';

interface OrderConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
}

export default function OrderConfirmationModal({ visible, onClose, orderId }: OrderConfirmationModalProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [supplierContact, setSupplierContact] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible && !cancelled && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [visible, timeLeft, cancelled]);

  useEffect(() => {
    if (visible && orderId) {
      fetchSupplierContact();
    }
  }, [visible, orderId]);

  const fetchSupplierContact = async () => {
    try {
      const { data, error } = await supabase
        .from('water_containers')
        .select('contact_number')
        .single();

      if (error) throw error;
      if (data) {
        setSupplierContact(data.contact_number);
      }
    } catch (error) {
      console.error('Error fetching supplier contact:', error);
    }
  };

  const handleCancel = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: cancelError } = await supabase.rpc('cancel_water_delivery', {
        p_order_id: orderId
      });

      if (cancelError) throw cancelError;

      setCancelled(true);
    } catch (error) {
      console.error('[Cancel Error]:', error);
      setError(error instanceof Error ? error.message : 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const handleCall = () => {
    if (!supplierContact) return;

    const telUrl = `tel:${supplierContact}`;
    Linking.canOpenURL(telUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(telUrl);
        }
        console.log('Phone calls not supported');
      })
      .catch(err => console.error('Error opening phone app:', err));
  };

  if (!fontsLoaded) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <View style={styles.content}>
                <View style={[
                  styles.iconContainer,
                  cancelled ? styles.iconContainerCancelled : styles.iconContainerSuccess
                ]}>
                  {cancelled ? (
                    <X size={40} color="#FF3B30" />
                  ) : (
                    <Check size={40} color="#4CAF50" />
                  )}
                </View>

                <Text style={styles.title}>
                  {cancelled ? 'Order Cancelled' : 'Order Confirmed'}
                </Text>

                <Text style={styles.message}>
                  {cancelled
                    ? 'Your order has been cancelled successfully. Any payment will be refunded to your original payment method.'
                    : 'Your order has been placed successfully! Our delivery partner will contact you shortly.'}
                </Text>

                {!cancelled && (
                  <>
                    {timeLeft > 0 && (
                      <View style={styles.cancelSection}>
                        <View style={styles.timerContainer}>
                          <AlertTriangle size={20} color="#FFA500" />
                          <Text style={styles.timerText}>
                            Cancel within {timeLeft} seconds
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.cancelButton, loading && styles.cancelButtonDisabled]}
                          onPress={handleCancel}
                          disabled={loading}
                        >
                          {loading ? (
                            <ActivityIndicator color="#FF3B30" />
                          ) : (
                            <Text style={styles.cancelButtonText}>Cancel Order</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={styles.contactSection}>
                      <TouchableOpacity
                        style={styles.contactButton}
                        onPress={handleCall}
                        disabled={!supplierContact}
                      >
                        <Phone size={20} color="#FFA500" />
                        <Text style={styles.contactButtonText}>Call Supplier</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => setShowChat(true)}
                      >
                        <MessageSquare size={20} color="#FFA500" />
                        <Text style={styles.contactButtonText}>Chat</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {showChat && (
        <ChatModal
          visible={showChat}
          onClose={() => setShowChat(false)}
          deliveryId={orderId}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1a1f2b',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
  },
  content: {
    padding: 30,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainerSuccess: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  iconContainerCancelled: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  cancelSection: {
    width: '100%',
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  timerText: {
    color: '#FFA500',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
  contactSection: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#FFA500',
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    marginLeft: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});