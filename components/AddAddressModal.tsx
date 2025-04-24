import { useState } from 'react';
import {
  StyleSheet,
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MapPin, Navigation, X, Search } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

interface AddAddressModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAddressModal({ visible, onClose, onSuccess }: AddAddressModalProps) {
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCoordinates({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Get address from coordinates
      const [result] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (result) {
        const formattedAddress = [
          result.street,
          result.district,
          result.city,
          result.region,
          result.postalCode,
        ]
          .filter(Boolean)
          .join(', ');
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error('[Location Error]:', error);
      setError('Failed to get current location');
    } finally {
      setLoading(false);
    }
  };

  const searchAddress = async () => {
    try {
      setLoading(true);
      setError(null);

      const results = await Location.geocodeAsync(address);
      if (results.length > 0) {
        setCoordinates({
          latitude: results[0].latitude,
          longitude: results[0].longitude,
        });
      } else {
        setError('Address not found');
      }
    } catch (error) {
      console.error('[Geocoding Error]:', error);
      setError('Failed to find address');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!title.trim()) {
        setError('Please enter a title for this address');
        return;
      }

      if (!address.trim()) {
        setError('Please enter an address');
        return;
      }

      if (!coordinates) {
        setError('Please select a valid location');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error: saveError } = await supabase.rpc('add_user_address', {
        p_user_id: user.id,
        p_title: title,
        p_address: address,
        p_latitude: coordinates.latitude,
        p_longitude: coordinates.longitude,
        p_is_default: false
      });

      if (saveError) throw saveError;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('[Save Address Error]:', error);
      setError('Failed to save address');
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
            <Text style={styles.title}>Add New Address</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Home, Office, etc."
                placeholderTextColor="#666"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address</Text>
              <View style={styles.addressInputContainer}>
                <TextInput
                  style={styles.addressInput}
                  placeholder="Enter your address"
                  placeholderTextColor="#666"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={searchAddress}
                  disabled={loading || !address.trim()}
                >
                  <Search size={20} color="#FFA500" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={loading}
            >
              <Navigation size={24} color="#FFA500" />
              <Text style={styles.locationButtonText}>
                Use Current Location
              </Text>
            </TouchableOpacity>

            {coordinates && (
              <View style={styles.coordinatesContainer}>
                <MapPin size={20} color="#FFA500" />
                <Text style={styles.coordinatesText}>
                  Location selected: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                </Text>
              </View>
            )}

            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.saveButtonText}>Save Address</Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    borderRadius: 12,
    paddingRight: 10,
  },
  addressInput: {
    flex: 1,
    padding: 15,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  locationButtonText: {
    color: '#FFA500',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginLeft: 10,
  },
  coordinatesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  coordinatesText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    marginLeft: 10,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginBottom: 15,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#242430',
  },
  saveButton: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});