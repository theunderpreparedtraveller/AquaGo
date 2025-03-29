import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, ArrowLeft, MapPin, Phone, Mail, User as UserIcon } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function Profile() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Trevor Smith',
    email: 'trevor.does.work@gmail.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, San Francisco, CA 94105',
    photo: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400',
  });

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  const handlePhotoSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0].uri) {
        setProfileData(prev => ({
          ...prev,
          photo: result.assets[0].uri
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
        })
        .eq('email', profileData.email);

      if (error) throw error;

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const InfoRow = ({ icon: Icon, label, value, onChangeText }) => (
    <View style={styles.infoRow}>
      <Icon size={20} color="#666" style={styles.infoIcon} />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor="#666"
          />
        ) : (
          <Text style={styles.infoValue}>{value}</Text>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFA500" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => isEditing ? handleSave() : setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: profileData.photo }}
              style={styles.photo}
            />
            {isEditing && (
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={handlePhotoSelect}
              >
                <Camera size={24} color="#FFA500" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.name}>{profileData.name}</Text>
        </View>

        <View style={styles.infoSection}>
          <InfoRow
            icon={UserIcon}
            label="Full Name"
            value={profileData.name}
            onChangeText={(text) => setProfileData({ ...profileData, name: text })}
          />
          <InfoRow
            icon={Mail}
            label="Email"
            value={profileData.email}
            onChangeText={(text) => setProfileData({ ...profileData, email: text })}
          />
          <InfoRow
            icon={Phone}
            label="Phone"
            value={profileData.phone}
            onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
          />
          <InfoRow
            icon={MapPin}
            label="Address"
            value={profileData.address}
            onChangeText={(text) => setProfileData({ ...profileData, address: text })}
          />
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2b',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },
  editButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  editButtonText: {
    color: '#FFA500',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changePhotoButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#242430',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1a1f2b',
  },
  name: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },
  infoSection: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  infoIcon: {
    marginRight: 15,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
    padding: 0,
    margin: 0,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});