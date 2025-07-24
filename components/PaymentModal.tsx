import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  Alert,
  Linking,
} from 'react-native';
import { Wallet, CreditCard, IndianRupee, ChevronRight } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../lib/supabase';
import PaymentWebView from './webviewcomponent';
import { WebView } from 'react-native-webview';


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
  const [webviewVisible, setWebviewVisible] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [upiId, setUpiId] = useState('');
  const [linkId, setlinkId] = useState('');
  const [showUpiInput, setShowUpiInput] = useState(false);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });
/*
  useEffect(() => {
    if (visible) {
      //fetchWalletBalance();
    }
  }, [visible]);
*/
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
      //setError('Failed to fetch wallet balance');
    }
  };

  const validateUpiId = (id: string) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(id);
  };

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setError(null);
    setShowUpiInput(method === 'upi');
  };
  const confirmPayment = async () => {
    const baseUrl = 'http://206.189.140.183:3000/api/confirmorder'
    const query = `link_id=${encodeURIComponent(linkId)}`;
    const url = `${baseUrl}?${query}`;
    console.log(url)
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status == "success"){
        onPaymentComplete('upi', { upi_id: upiId });
        onClose();
      }
      else{
        Alert.alert('Payment failed');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
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
        const amt  = amount.toFixed(2)
        console.log(amt)
        /*
        if (amt == "500.00"){
            setPaymentUrl("https://payments-test.cashfree.com/links/G8rbb6e3gtv0");
            setWebviewVisible(true);
        }
        if (amt == "900.00"){
          setPaymentUrl("https://payments-test.cashfree.com/links/Y8rbb928jl2g");
          setWebviewVisible(true);
        }
        if (amt == "2000.00"){
          setPaymentUrl("https://payments-test.cashfree.com/links/I8rbbb0vnl2g");
          setWebviewVisible(true);
        }
        */
        
        const value = await AsyncStorage.getItem("userdata");
        const value_json = JSON.parse(value)
        const phone = value_json.phone
        const linkId = Math.floor(Math.random() * 100000);
        const linkIdstr = linkId.toString()
        setlinkId(linkIdstr)
        const baseUrl = 'http://206.189.140.183:3000/api/order';
        const query = `link_id=${encodeURIComponent(linkId)}&link_amount=${amt}&customer_phone=${phone}`;
        const url = `${baseUrl}?${query}`;
        console.log(url)
        try {
          const response = await fetch(url);
          const data = await response.json();

          console.log('Response:', data);
          const url1 = data.link_url
          const link_id = data.link_id
          setlinkId(link_id)
          if (url1) {
            setPaymentUrl(url1);
            setWebviewVisible(true);
            console.log("Payment complete")
          }

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }

      // Handle wallet/cash
      //onPaymentComplete(selectedMethod);
      //onClose();
    } catch (error) {
      console.error('[Payment Error]:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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



                <TouchableOpacity style={[styles.paymentMethod, selectedMethod === 'upi' && styles.selectedMethod]} onPress={() => handleMethodSelect('upi')}>
                  <View style={styles.methodIcon}><IndianRupee size={24} color="#FFA500" /></View>
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


                {error && <Text style={styles.errorText}>{error}</Text>}
              </ScrollView>
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.payButton, (!selectedMethod || loading) && styles.payButtonDisabled]}
                  onPress={handlePayment}
                  disabled={!selectedMethod || loading}
                >
                  {loading ? <ActivityIndicator color="#000000" /> : <Text style={styles.payButtonText}>Pay ₹{amount.toFixed(2)}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={webviewVisible} animationType="slide">
  <SafeAreaView style={{ flex: 1 }}>
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: paymentUrl }}
        startInLoadingState
        javaScriptEnabled
      />
      <TouchableOpacity
        style={{
          padding: 16,
          backgroundColor: '#FFA500',
          alignItems: 'center'
        }}
        onPress={() => {
          //setWebviewVisible(false); // hide webview
          //onPaymentComplete('upi', { upi_id: upiId });
          //onClose();
          confirmPayment();
        }}
      >
        <Text style={{ color: '#000', fontWeight: 'bold' }}>Payment Completed</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
</Modal>
    </>
  );
}

// styles object remains unchanged (from your code)
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