import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { X, Droplets, IndianRupee, Calendar, MapPin } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

const QUICK_VOLUMES = [1000, 2000, 5000, 10000];
const BASE_RATE = 0.45; // Rate per liter

export default function WaterVolumeModal({ visible, onClose, onSuccess, location, address }) {
  const [volume, setVolume] = useState('');
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: wallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      setWalletBalance(wallet?.balance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleQuickVolume = (value) => {
    setVolume(value.toString());
  };

  const calculatePrice = (vol) => {
    return (parseFloat(vol) || 0) * BASE_RATE;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  const validateOrder = () => {
    const volumeNum = Number(volume);
    if (isNaN(volumeNum) || volumeNum < 1000) {
      Alert.alert('Invalid Volume', 'Minimum water volume is 1000 liters');
      return false;
    }

    const price = calculatePrice(volumeNum);
    if (price > walletBalance) {
      Alert.alert('Insufficient Balance', `Required: ₹${price.toFixed(2)}\nAvailable: ₹${walletBalance.toFixed(2)}`);
      return false;
    }

    if (scheduledDate < new Date()) {
      Alert.alert('Invalid Date', 'Please select a future date and time');
      return false;
    }

    return true;
  };

  const handleOrder = async () => {
    if (!validateOrder()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data, error } = await supabase.rpc('create_water_delivery', {
        p_user_id: user.id,
        p_volume: Number(volume),
        p_delivery_address: address,
        p_delivery_location: `(${location.longitude},${location.latitude})`,
        p_scheduled_for: scheduledDate.toISOString()
      });

      if (error) throw error;

      Alert.alert('Success', 'Water delivery ordered successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', error.message || 'Failed to create order');
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
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Order Water Tanker</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.volumeContainer}>
              <View style={styles.iconContainer}>
                <Droplets size={24} color="#FFA500" />
              </View>
              <TextInput
                style={styles.volumeInput}
                value={volume}
                onChangeText={setVolume}
                keyboardType="numeric"
                placeholder="Enter volume (liters)"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.quickVolumes}>
              {QUICK_VOLUMES.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.quickVolume,
                    volume === value.toString() && styles.quickVolumeSelected
                  ]}
                  onPress={() => handleQuickVolume(value)}
                >
                  <Text style={[
                    styles.quickVolumeText,
                    volume === value.toString() && styles.quickVolumeTextSelected
                  ]}>{value}L</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={24} color="#FFA500" />
              <Text style={styles.dateText}>
                {scheduledDate.toLocaleString()}
              </Text>
            </TouchableOpacity>

            <View style={styles.addressContainer}>
              <MapPin size={24} color="#FFA500" />
              <Text style={styles.addressText}>{address}</Text>
            </View>

            {Platform.OS === 'ios' && showDatePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="datetime"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={scheduledDate}
                mode="datetime"
                is24Hour={true}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total Price:</Text>
              <Text style={styles.priceAmount}>
                ₹{calculatePrice(volume).toFixed(2)}
              </Text>
              <Text style={styles.priceRate}>
                (₹{BASE_RATE}/liter)
              </Text>
            </View>

            <View style={styles.walletContainer}>
              <Text style={styles.walletLabel}>Wallet Balance:</Text>
              <Text style={styles.walletBalance}>₹{walletBalance.toFixed(2)}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.orderButton, loading && styles.orderButtonDisabled]}
            onPress={handleOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.orderButtonText}>Place Order</Text>
            )}
          </TouchableOpacity>
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
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  volumeInput: {
    flex: 1,
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },
  quickVolumes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickVolume: {
    width: '23%',
    backgroundColor: '#242430',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  quickVolumeSelected: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
  },
  quickVolumeText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  quickVolumeTextSelected: {
    color: '#FFA500',
    fontFamily: 'Montserrat-SemiBold',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  dateText: {
    marginLeft: 15,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  addressText: {
    flex: 1,
    marginLeft: 15,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  priceContainer: {
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  priceLabel: {
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    marginBottom: 5,
  },
  priceAmount: {
    color: '#FFA500',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 24,
    marginBottom: 5,
  },
  priceRate: {
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  walletContainer: {
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  walletLabel: {
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    marginBottom: 5,
  },
  walletBalance: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 20,
  },
  orderButton: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  orderButtonDisabled: {
    opacity: 0.7,
  },
  orderButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});