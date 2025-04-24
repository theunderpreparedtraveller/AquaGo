import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MapPin, Chrome as Home, Building2, Plus, ChevronRight } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../lib/supabase';
import AddAddressModal from './AddAddressModal';

interface Address {
  id: string;
  title: string;
  address: string;
  is_default: boolean;
}

interface DeliveryAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onAddressSelect: (address: Address) => void;
}

export default function DeliveryAddressModal({ visible, onClose, onAddressSelect }: DeliveryAddressModalProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddAddress, setShowAddAddress] = useState(false);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (visible) {
      fetchAddresses();
    }
  }, [visible]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data);
    } catch (error) {
      console.error('[Address Error]:', error);
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSuccess = () => {
    setShowAddAddress(false);
    fetchAddresses();
  };

  if (!fontsLoaded) return null;

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
                <Text style={styles.title}>Select Delivery Address</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                <TouchableOpacity 
                  style={styles.addAddressButton}
                  onPress={() => setShowAddAddress(true)}
                >
                  <View style={styles.addAddressIcon}>
                    <Plus size={24} color="#FFA500" />
                  </View>
                  <Text style={styles.addAddressText}>Add New Address</Text>
                  <ChevronRight size={20} color="#666" />
                </TouchableOpacity>

                <View style={styles.addressList}>
                  {loading ? (
                    <Text style={styles.messageText}>Loading addresses...</Text>
                  ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : addresses.length === 0 ? (
                    <Text style={styles.messageText}>No saved addresses</Text>
                  ) : (
                    addresses.map((address) => (
                      <TouchableOpacity
                        key={address.id}
                        style={styles.addressItem}
                        onPress={() => onAddressSelect(address)}
                      >
                        <View style={styles.addressIcon}>
                          {address.title.toLowerCase() === 'home' ? (
                            <Home size={24} color="#FFA500" />
                          ) : address.title.toLowerCase() === 'office' ? (
                            <Building2 size={24} color="#FFA500" />
                          ) : (
                            <MapPin size={24} color="#FFA500" />
                          )}
                        </View>
                        <View style={styles.addressDetails}>
                          <View style={styles.addressHeader}>
                            <Text style={styles.addressTitle}>{address.title}</Text>
                            {address.is_default && (
                              <View style={styles.defaultBadge}>
                                <Text style={styles.defaultText}>Default</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.addressText}>{address.address}</Text>
                        </View>
                        <ChevronRight size={20} color="#666" />
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <AddAddressModal
        visible={showAddAddress}
        onClose={() => setShowAddAddress(false)}
        onSuccess={handleAddressSuccess}
      />
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
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  addAddressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  addAddressText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
  addressList: {
    flex: 1,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  addressDetails: {
    flex: 1,
    marginRight: 10,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  addressTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    marginRight: 10,
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#FFA500',
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
  },
  addressText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  messageText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginTop: 20,
  },
});