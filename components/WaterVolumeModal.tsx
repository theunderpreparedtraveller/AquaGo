import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../lib/supabase';
import DeliveryAddressModal from './DeliveryAddressModal';
import PaymentModal from './PaymentModal';
import OrderConfirmationModal from './OrderConfirmationModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface WaterVolumeModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedContainer: {
    id: string;
    name: string;
    available_volume: number;
    rates: Array<{
      volume: number;
      price: number;
    }>;
  } | null;
}

export default function WaterVolumeModal({ visible, onClose, onSuccess, selectedContainer }: WaterVolumeModalProps) {
  const [selectedVolume, setSelectedVolume] = useState<string>('');
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<any>(null);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (visible) {
      setSelectedVolume('');
      setSelectedPrice(0);
      setError(null);
      setSelectedAddress(null);
    }
  }, [visible]);

  const handleVolumeSelect = (volume: string, price: number) => {
    setSelectedVolume(volume);
    setSelectedPrice(price);
    setError(null);
    setShowAddressModal(true);
  };

  const handleAddressSelect = async (address: any) => {
    setSelectedAddress(address);
    setShowAddressModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (paymentMethod: string, paymentDetails?: any) => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedContainer || !selectedAddress) {
        throw new Error('Missing required information');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create point from coordinates
      const location = selectedAddress.location || '(0,0)';
      let container_selected_id = await AsyncStorage.getItem('container_selected_id'); 
      let container_id = JSON.parse(container_selected_id || '{}').container_id;
      let name = JSON.parse(container_selected_id || '{}').name
      let number = JSON.parse(container_selected_id || '{}').number
      console.log("container_selected_id2",container_selected_id)
      console.log(name)
      console.log(number)
      // Create delivery order
      const { data: orderId, error: orderError } = await supabase.rpc('create_water_delivery', {
        p_user_id: user.id,
        p_container_id: container_id,
        p_volume: parseInt(selectedVolume, 10),
        p_amount: selectedPrice,
        p_delivery_address: container_selected_id,
        p_delivery_location: location,
        p_payment_method: paymentMethod,
        p_payment_details: paymentDetails
      });

      if (orderError) throw orderError;

      setOrderId(orderId);
      setShowPaymentModal(false);
      setShowConfirmationModal(true);
    } catch (error) {
      console.error('[Order Error]:', error);
      setError(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmationModal(false);
    onSuccess();
    onClose();
  };

  if (!fontsLoaded || !selectedContainer) {
    return null;
  }

  return (
    <>
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
                <Text style={styles.title}>Select Water Volume</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
              >
                <View style={styles.containerInfo}>
                  <Text style={styles.containerName}>{selectedContainer.name}</Text>
                  <Text style={styles.availableVolume}>
                    Available: {selectedContainer.available_volume.toLocaleString()}L
                  </Text>
                </View>

                <View style={styles.volumeOptions}>
                  {selectedContainer.rates.map((rate, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.volumeOption,
                        selectedVolume === rate.volume.toString() && styles.volumeOptionSelected
                      ]}
                      onPress={() => handleVolumeSelect(rate.volume.toString(), rate.price)}
                    >
                      <Text style={[
                        styles.volumeText,
                        selectedVolume === rate.volume.toString() && styles.volumeTextSelected
                      ]}>
                        {rate.volume.toLocaleString()}L
                      </Text>
                      <Text style={[
                        styles.priceText,
                        selectedVolume === rate.volume.toString() && styles.priceTextSelected
                      ]}>
                        ₹{rate.price}
                      </Text>
                      <Text style={[
                        styles.rateText,
                        selectedVolume === rate.volume.toString() && styles.rateTextSelected
                      ]}>
                        (₹{(rate.price / rate.volume).toFixed(2)}/L)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <DeliveryAddressModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressSelect={handleAddressSelect}
      />

      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
        amount={selectedPrice}
      />

      {orderId && (
        <OrderConfirmationModal
          visible={showConfirmationModal}
          onClose={handleConfirmationClose}
          orderId={orderId}
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
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1a1f2b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  containerInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#242430',
    borderRadius: 12,
  },
  containerName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
  },
  availableVolume: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  volumeOptions: {
    marginBottom: 20,
  },
  volumeOption: {
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  volumeOptionSelected: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
  },
  volumeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  volumeTextSelected: {
    color: '#FFA500',
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginBottom: 2,
  },
  priceTextSelected: {
    color: '#FFA500',
  },
  rateText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  rateTextSelected: {
    color: 'rgba(255, 165, 0, 0.8)',
  },
  errorText: {
    color: '#FF3B30',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 15,
    textAlign: 'center',
  },
});