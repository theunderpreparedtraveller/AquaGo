import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { TriangleAlert as AlertTriangle, MapPin, User } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';

interface Alert {
  type: 'location' | 'profile';
  title: string;
  message: string;
  action: string;
  onPress: () => void;
}

export default function AlertsOverlay() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [checking, setChecking] = useState(true);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    checkAlerts();
    
    // Set up periodic checks
    const interval = setInterval(checkAlerts, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  const checkAlerts = async () => {
    try {
      const newAlerts: Alert[] = [];

      // Check location permission
      if (Platform.OS !== 'web') {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status !== 'granted') {
            newAlerts.push({
              type: 'location',
              title: 'Location Access Required',
              message: 'Please enable location services to find nearby water suppliers.',
              action: 'Enable Location',
              onPress: async () => {
                try {
                  await Location.requestForegroundPermissionsAsync();
                  checkAlerts();
                } catch (permError) {
                  console.error('Error requesting location permission:', permError);
                }
              }
            });
          }
        } catch (locationError) {
          console.error('Error checking location permission:', locationError);
        }
      }

      // Check profile completeness
      try {
        const { data, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
        } else if (data.user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('name, phone, address')
              .eq('id', data.user.id)
              .single();

            if (profileError) {
              console.error('Error fetching profile:', profileError);
            } else if (!profile?.name || !profile?.phone || !profile?.address) {
              newAlerts.push({
                type: 'profile',
                title: 'Complete Your Profile',
                message: 'Please complete your profile information for better service.',
                action: 'Update Profile',
                onPress: () => router.push('/edit-profile' as any)
              });
            }
          } catch (profileQueryError) {
            console.error('Error in profile query:', profileQueryError);
          }
        }
      } catch (authError) {
        console.error('Error in auth check:', authError);
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error checking alerts:', error);
    } finally {
      setChecking(false);
    }
  };

  if (!fontsLoaded || checking || alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {alerts.map((alert, index) => (
        <View key={index} style={styles.alertCard}>
          <View style={styles.alertIcon}>
            {alert.type === 'location' ? (
              <MapPin size={24} color="#FF3B30" />
            ) : (
              <User size={24} color="#FF3B30" />
            )}
          </View>
          <View style={styles.alertContent}>
            <View style={styles.alertHeader}>
              <AlertTriangle size={16} color="#FF3B30" />
              <Text style={styles.alertTitle}>{alert.title}</Text>
            </View>
            <Text style={styles.alertMessage}>{alert.message}</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={alert.onPress}
            >
              <Text style={styles.actionButtonText}>{alert.action}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: '#242430',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  alertTitle: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    marginLeft: 8,
  },
  alertMessage: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
});