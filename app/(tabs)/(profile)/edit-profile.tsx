import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { MapPin, Phone, Mail, User as UserIcon } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../../../lib/supabase';
import { useTheme } from '../../../context/ThemeContext';


const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
export default function EditProfile() {
  const { isDarkMode, toggleTheme } = useTheme();
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }
  const bgColor = isDarkMode ? '#1a1f2b' : '#ffffff';
  const bgColorcard = isDarkMode ? '#242430' : '#F5F5F5';
  const fieldcolor = isDarkMode ? '#1a1f2B' : '#f5f5f5';
  const subtitleColor = isDarkMode ? '#666666' : '#757575';
  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      {loading ? (
        <Text style={styles.loadingText}>Loading profile...</Text>
      ) : (
        <>
          <View style={styles.section}>
          <Text style={[styles.logo, { color: textColor }]}>AquaGo</Text>

          <Text style={styles.sectionTitle}></Text>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={[styles.inputGroup, {color: textColor,backgroundColor:bgColorcard }]}>
              <UserIcon size={20} style={[styles.input, { color: textColor,backgroundColor:bgColorcard }]} />
              <TextInput
                style={[styles.input, { color: textColor,backgroundColor:bgColorcard }]}
                placeholder="Full Name"
                placeholderTextColor="#666"
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
              />
            </View>

            <View style={[styles.inputGroup, {color: textColor,backgroundColor:bgColorcard }]}>
              <Mail size={20} style={[styles.input, { color: textColor,backgroundColor:bgColorcard }]} />
              <TextInput
                style={[styles.input, { color: textColor,backgroundColor:bgColorcard }]}
                value={profile.email}
                editable={false}
              />
            </View>

            <View style={[styles.inputGroup, {color: textColor,backgroundColor:bgColorcard }]}>
              <Phone size={20} style={[styles.input, { color: textColor,backgroundColor:bgColorcard }]} />
              <TextInput
                style={[styles.input, { color: textColor,backgroundColor:bgColorcard }]}
                placeholder="Phone Number"
                
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={[styles.inputGroup, {color: textColor,backgroundColor:bgColorcard }]}>
              <MapPin size={20} style={[styles.input, { color: textColor,backgroundColor:bgColorcard }]} />
              <TextInput
                style={[styles.input, { color: textColor,backgroundColor:bgColorcard }]}
                placeholder="Address"
              
                value={profile.address}
                onChangeText={(text) => setProfile({ ...profile, address: text })}
                multiline
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2b',
    paddingTop: STATUSBAR_HEIGHT + 20,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Montserrat-Regular',
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Montserrat-Light',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 15,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    paddingVertical: 15,
    marginLeft: 10,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  saveButton: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginVertical: 20,
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