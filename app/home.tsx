import { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Platform,
  BackHandler,
} from 'react-native';
import * as Location from 'expo-location';
import { Search, MapPin, Sun, Moon, User } from 'lucide-react-native';
import { useFonts, Montserrat_300Light, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import SearchOverlay from '../components/SearchOverlay';

const { height } = Dimensions.get('window');

const MapView = Platform.select({
  web: () => {
    return function WebMap({ style, currentLocation, selectedLocation }) {
      const [mapUrl, setMapUrl] = useState('https://www.openstreetmap.org/export/embed.html?bbox=77.5746,12.9516,77.6146,12.9916&amp;layer=mapnik');

      useEffect(() => {
        if (selectedLocation) {
          const { latitude, longitude } = selectedLocation;
          setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.02},${latitude-0.02},${longitude+0.02},${latitude+0.02}&amp;layer=mapnik`);
        } else if (currentLocation) {
          const { latitude, longitude } = currentLocation.coords;
          setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.02},${latitude-0.02},${longitude+0.02},${latitude+0.02}&amp;layer=mapnik`);
        }
      }, [currentLocation, selectedLocation]);

      return (
        <View style={[style, { overflow: 'hidden' }]}>
          <iframe
            title="location-map"
            src={mapUrl}
            style={{
              border: 0,
              height: '100%',
              width: '100%',
            }}
          />
        </View>
      );
    };
  },
  default: () => {
    try {
      const Map = require('react-native-maps').default;
      return function NativeMap({ style, currentLocation, selectedLocation }) {
        if (!Map) return null;
        
        const region = selectedLocation ? {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        } : currentLocation ? {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        } : {
          latitude: 12.9716,
          longitude: 77.5946,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        
        return (
          <Map
            style={style}
            region={region}
          />
        );
      };
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
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [location, setLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const mapRef = useRef(null);

  const [suppliers] = useState([
    {
      id: 1,
      name: 'Metro Water Services',
      distance: '2083.9',
      availableTankers: 3,
      busyTankers: 1,
      rates: [
        { liters: 1000, price: 450, label: '1000L' },
        { liters: 2000, price: 750, label: '2000L' },
        { liters: 5000, price: 1100, label: '5000L' }
      ]
    },
    {
      id: 2,
      name: 'City Water Supply',
      distance: '2084.0',
      availableTankers: 5,
      busyTankers: 2,
      rates: [
        { liters: 1000, price: 500, label: '1000L' },
        { liters: 2000, price: 800, label: '2000L' },
        { liters: 5000, price: 1200, label: '5000L' }
      ]
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

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showSearchOverlay) {
        setShowSearchOverlay(false);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showSearchOverlay]);

  const handleLocationSelect = async (suggestion) => {
    if (suggestion.type === 'current') {
      goToCurrentLocation();
    } else if (suggestion.coordinates) {
      setSelectedLocation(suggestion.coordinates);
      setSearchQuery(suggestion.title);
    } else {
      try {
        const results = await Location.geocodeAsync(suggestion.address || suggestion.title);
        if (results.length > 0) {
          const { latitude, longitude } = results[0];
          setSelectedLocation({ latitude, longitude });
          setSearchQuery(suggestion.title);
        }
      } catch (error) {
        console.error('Error geocoding address:', error);
      }
    }
    setShowSearchOverlay(false);
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
      setSelectedLocation(null);
      setSearchQuery('Current Location');
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
            onPress={() => router.push('/profile')}
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

      <TouchableOpacity 
        style={[styles.searchContainer, { backgroundColor: cardBgColor }]}
        onPress={() => setShowSearchOverlay(true)}
      >
        <Search size={20} color={subtitleColor} style={styles.searchIcon} />
        <Text style={[styles.searchPlaceholder, { color: subtitleColor }]}>
          {searchQuery || 'Search location'}
        </Text>
        <MapPin size={24} color="#FFA500" strokeWidth={2} />
      </TouchableOpacity>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          currentLocation={location}
          selectedLocation={selectedLocation}
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
                Water Volume & Rates:
              </Text>
              <View style={styles.ratesContainer}>
                {supplier.rates.map((rate, index) => (
                  <TouchableOpacity key={index} style={styles.rateButton}>
                    <Text style={styles.rateButtonText}>{rate.label}</Text>
                    <Text style={styles.ratePrice}>₹{rate.price}</Text>
                    <Text style={styles.ratePerLiter}>
                      (₹{(rate.price / rate.liters).toFixed(2)}/L)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      <SearchOverlay
        visible={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLocationSelect={handleLocationSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
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
    fontSize: 14,
  },
  ratePrice: {
    color: '#000000',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    marginTop: 2,
  },
  ratePerLiter: {
    color: '#000000',
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
});