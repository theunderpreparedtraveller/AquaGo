import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Wallet, CreditCard, IndianRupee, ChevronRight } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../lib/supabase';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onPaymentComplete: (method: string, details?: any) => void;
  amount: number;
}

export default function PaymentModal({ visible, onClose, onPaymentComplete, amount }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [upiId, setUpiId] = useState('');
  const [showUpiInput, setShowUpiInput] = useState(false);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (visible) {
      fetchWalletBalance();
    }
  }, [visible]);

  const fetchWalletBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;
      setWalletBalance(wallet?.balance || 0);
    } catch (error) {
      console.error('[Wallet Error]:', error);
      setError('Failed to fetch wallet balance');
    }
  };

  const validateUpiId = (id: string) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(id);
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setError(null);
    if (method === 'upi') {
      setShowUpiInput(true);
    } else {
      setShowUpiInput(false);
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedMethod) {
        throw new Error('Please select a payment method');
      }

      if (selectedMethod === 'wallet' && walletBalance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      if (selectedMethod === 'upi') {
        if (!validateUpiId(upiId)) {
          throw new Error('Please enter a valid UPI ID');
        }
      }

      // Pass payment method and details to parent
      onPaymentComplete(selectedMethod, selectedMethod === 'upi' ? { upi_id: upiId } : undefined);
      onClose();
    } catch (error) {
      console.error('[Payment Error]:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Payment</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>Amount to Pay</Text>
                <Text style={styles.amount}>₹{amount.toFixed(2)}</Text>
              </View>

              <Text style={styles.sectionTitle}>Payment Methods</Text>

              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  selectedMethod === 'wallet' && styles.selectedMethod
                ]}
                onPress={() => handleMethodSelect('wallet')}
              >
                <View style={styles.methodIcon}>
                  <Wallet size={24} color="#FFA500" />
                </View>
                <View style={styles.methodDetails}>
                  <Text style={styles.methodTitle}>Wallet</Text>
                  <Text style={styles.methodBalance}>Balance: ₹{walletBalance.toFixed(2)}</Text>
                </View>
                <ChevronRight size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  selectedMethod === 'upi' && styles.selectedMethod
                ]}
                onPress={() => handleMethodSelect('upi')}
              >
                <View style={styles.methodIcon}>
                  <IndianRupee size={24} color="#FFA500" />
                </View>
                <View style={styles.methodDetails}>
                  <Text style={styles.methodTitle}>UPI</Text>
                  <Text style={styles.methodSubtitle}>Pay using any UPI app</Text>
                </View>
                <ChevronRight size={20} color="#666" />
              </TouchableOpacity>

              {showUpiInput && (
                <View style={styles.upiInputContainer}>
                  <Text style={styles.upiLabel}>Enter UPI ID</Text>
                  <TextInput
                    style={styles.upiInput}
                    value={upiId}
                    onChangeText={setUpiId}
                    placeholder="yourname@upi"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                  />
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.paymentMethod,
                  selectedMethod === 'cash' && styles.selectedMethod
                ]}
                onPress={() => handleMethodSelect('cash')}
              >
                <View style={styles.methodIcon}>
                  <CreditCard size={24} color="#FFA500" />
                </View>
                <View style={styles.methodDetails}>
                  <Text style={styles.methodTitle}>Cash</Text>
                  <Text style={styles.methodSubtitle}>Pay on delivery</Text>
                </View>
                <ChevronRight size={20} color="#666" />
              </TouchableOpacity>

              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.payButton,
                  (!selectedMethod || loading) && styles.payButtonDisabled
                ]}
                onPress={handlePayment}
                disabled={!selectedMethod || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.payButtonText}>
                    Pay ₹{amount.toFixed(2)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
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
  closeButtonText: {
    color: '#666',
    fontSize: 18,
    fontFamily: 'Montserrat-Medium',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  amountContainer: {
    backgroundColor: '#242430',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 5,
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontFamily: 'Montserrat-SemiBold',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 15,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  selectedMethod: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
  },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  methodDetails: {
    flex: 1,
  },
  methodTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  methodSubtitle: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  methodBalance: {
    color: '#FFA500',
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
  upiInputContainer: {
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  upiLabel: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 10,
  },
  upiInput: {
    backgroundColor: '#1a1f2b',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginTop: 15,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#242430',
  },
  payButton: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});