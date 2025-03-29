import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Search, MapPin, Sun, Moon, User } from 'lucide-react-native';
import { useFonts, Montserrat_300Light, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ProfileMenu from '../../components/ProfileMenu';

const { height } = Dimensions.get('window');

const MapView = Platform.select({
  web: () => {
    return function WebMap({ style, children }) {
      return (
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100%',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style 
        }}>
          <Text>Map View</Text>
          {children}
        </div>
      );
    };
  },
  default: () => {
    try {
      return require('react-native-maps').default;
    } catch (e) {
      return function FallbackMap() {
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Map not available</Text>
          </View>
        );
      };
    }
  },
})();

export default function Home() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { userEmail } = useAuth();
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const mapRef = useRef(null);
  const [suppliers] = useState([
    {
      id: 1,
      name: 'Metro Water Services',
      distance: '2083.9',
      availableTankers: 3,
      busyTankers: 1,
      rates: { small: 450, medium: 750, large: 1100 }
    },
    {
      id: 2,
      name: 'City Water Supply',
      distance: '2084.0',
      availableTankers: 5,
      busyTankers: 2,
      rates: { small: 500, medium: 800, large: 1200 }
    }
  ]);

  const [fontsLoaded] = useFonts({
    'Montserrat-Light': Montserrat_300Light,
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const profileMenu = () => {
    console.log('Current user email:', userEmail);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const result = await Location.geocodeAsync(searchQuery);
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        if (Platform.OS !== 'web' && mapRef.current) {
          mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
        }
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const goToCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert("Permission to access location was denied.");
        return;
      }

      let location = await Location.getLastKnownPositionAsync({ accuracy: Location.Accuracy.Balanced });

      if (!location) {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 3000,
        });
      }

      setLocation(location);
      console.log("Location updated");

      if (Platform.OS !== 'web' && mapRef.current) {
        mapRef.current?.animateToRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Failed to get location. Please check your GPS settings.");
    }
  };

  if (!fontsLoaded || !location) {
    return null;
  }

  const bgColor = isDarkMode ? '#1a1f2b' : '#ffffff';
  const cardBgColor = isDarkMode ? '#242430' : '#f5f5f5';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const subtitleColor = isDarkMode ? '#666666' : '#757575';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <Text style={[styles.logo, { color: textColor }]}>AquaGo</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: cardBgColor }]}
            onPress={() => {
              profileMenu();
              setShowProfileMenu(true);
            }}
          >
            <User size={24} color="#FFA500" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: cardBgColor }]}
            onPress={toggleTheme}
          >
            {isDarkMode ? (
              <Sun size={24} color="#FFA500" />
            ) : (
              <Moon size={24} color="#1a1f2b" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: cardBgColor }]}>
        <Search size={20} color={subtitleColor} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search location"
          placeholderTextColor={subtitleColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          onPress={goToCurrentLocation}
          activeOpacity={0.8}
        >
          <MapPin size={24} color="#FFA500" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={Platform.OS === 'web' ? null : mapRef}
          style={styles.map}
          {...(Platform.OS !== 'web' ? {
            provider: 'google',
            initialRegion: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }
          } : {})}
        />
      </View>

      <View style={[styles.bottomSheet, { backgroundColor: bgColor }]}>
        <View style={styles.bottomSheetHeader}>
          <View style={[styles.bottomSheetHandle, { backgroundColor: subtitleColor }]} />
        </View>
        <ScrollView style={styles.suppliersContainer}>
          <Text style={[styles.suppliersTitle, { color: textColor }]}>
            Nearby Water Suppliers
          </Text>
          <Text style={[styles.suppliersSubtitle, { color: subtitleColor }]}>
            Showing suppliers near your location
          </Text>

          {suppliers.map((supplier) => (
            <View key={supplier.id} style={[styles.supplierCard, { backgroundColor: cardBgColor }]}>
              <View style={styles.supplierHeader}>
                <Text style={[styles.supplierName, { color: textColor }]}>
                  {supplier.name}
                </Text>
                <View style={styles.dropIcon} />
              </View>
              
              <View style={styles.supplierInfo}>
                <Text style={[styles.distanceText, { color: subtitleColor }]}>
                  📍 {supplier.distance} km away
                </Text>
                <Text style={[styles.tankersText, { color: subtitleColor }]}>
                  Available Tankers: {supplier.availableTankers}
                </Text>
              </View>

              <Text style={[styles.ratesTitle, { color: textColor }]}>
                Rates:
              </Text>
              <View style={styles.ratesContainer}>
                <TouchableOpacity style={styles.rateButton}>
                  <Text style={styles.rateButtonText}>Small</Text>
                  <Text style={styles.ratePrice}>₹{supplier.rates.small}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.rateButton}>
                  <Text style={styles.rateButtonText}>Medium</Text>
                  <Text style={styles.ratePrice}>₹{supplier.rates.medium}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.rateButton}>
                  <Text style={styles.rateButtonText}>Large</Text>
                  <Text style={styles.ratePrice}>₹{supplier.rates.large}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <ProfileMenu 
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  inputWrapper: {
    flex: 1, 
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontFamily: 'Montserrat-Regular',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Montserrat-Light',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontFamily: 'Montserrat-Regular',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  suppliersContainer: {
    flex: 1,
    padding: 15,
  },
  suppliersTitle: {
    fontSize: 24,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 5,
  },
  suppliersSubtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 20,
  },
  supplierCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  supplierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  supplierName: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
  },
  dropIcon: {
    width: 8,
    height: 8,
    backgroundColor: '#FFA500',
    borderRadius: 4,
  },
  supplierInfo: {
    marginBottom: 15,
  },
  distanceText: {
    fontFamily: 'Montserrat-Regular',
    marginBottom: 5,
  },
  tankersText: {
    fontFamily: 'Montserrat-Regular',
  },
  ratesTitle: {
    fontFamily: 'Montserrat-Medium',
    marginBottom: 10,
  },
  ratesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rateButton: {
    backgroundColor: '#FFA500',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  rateButtonText: {
    color: '#000000',
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
  },
  ratePrice: {
    color: '#000000',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    marginTop: 2,
  },
});