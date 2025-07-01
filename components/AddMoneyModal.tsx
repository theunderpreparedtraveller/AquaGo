import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, IndianRupee } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../lib/supabase';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function AddMoneyModal({ visible, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpiInput, setShowUpiInput] = useState(false);
  const [upiId, setUpiId] = useState('');

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const validateAmount = () => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return false;
    }
    if (numAmount > 50000) {
      Alert.alert('Amount Too High', 'Maximum amount allowed is ₹50,000');
      return false;
    }
    return true;
  };

  const validateUpiId = (id) => {
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    return upiRegex.test(id);
  };

  const handleAddMoney = async () => {
    if (!validateAmount()) return;

    if (!showUpiInput) {
      setShowUpiInput(true);
      return;
    }

    if (!validateUpiId(upiId)) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID');
      return;
    }

    setLoading(true);
    try {
      // Simulate UPI payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update wallet balance in Supabase
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) throw new Error('User not found');

      const { error } = await supabase.rpc('add_money_to_wallet', {
        p_user_id: user.user.id,
        p_amount: Number(amount)
      });

      if (error) throw error;

      Alert.alert('Success', 'Money added to wallet successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding money:', error);
      Alert.alert('Error', 'Failed to add money to wallet');
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>Add Money</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {!showUpiInput ? (
            <>
              <View style={styles.amountContainer}>
                <View style={styles.rupeeContainer}>
                  <IndianRupee size={24} color="#FFA500" />
                </View>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#666"
                  maxLength={5}
                />
              </View>

              <View style={styles.quickAmounts}>
                {QUICK_AMOUNTS.map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.quickAmount,
                      amount === value.toString() && styles.quickAmountSelected
                    ]}
                    onPress={() => handleQuickAmount(value)}
                  >
                    <Text style={[
                      styles.quickAmountText,
                      amount === value.toString() && styles.quickAmountTextSelected
                    ]}>₹{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <View style={styles.upiContainer}>
              <Text style={styles.upiLabel}>Enter UPI ID</Text>
              <TextInput
                style={styles.upiInput}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="yourname@upi"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.amountConfirm}>
                Amount to be added: ₹{amount}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.addButton, loading && styles.addButtonDisabled]}
            onPress={handleAddMoney}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.addButtonText}>
                {showUpiInput ? 'Pay Now' : 'Proceed to Pay'}
              </Text>
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
  logo: {
    fontSize: 24,
    fontFamily: 'Montserrat-Light',
  },
  modal: {
    backgroundColor: '#1a1f2b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  rupeeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAmount: {
    width: '30%',
    backgroundColor: '#242430',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  quickAmountSelected: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
  },
  quickAmountText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  quickAmountTextSelected: {
    color: '#FFA500',
    fontFamily: 'Montserrat-SemiBold',
  },
  upiContainer: {
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  upiLabel: {
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 10,
  },
  upiInput: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
    padding: 10,
    backgroundColor: '#1a1f2b',
    borderRadius: 8,
    marginBottom: 15,
  },
  amountConfirm: {
    color: '#FFA500',
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});