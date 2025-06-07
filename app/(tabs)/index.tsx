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
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import SearchOverlay from '../../components/SearchOverlay';
import ProfileMenu from '../../components/ProfileMenu';
import AlertsOverlay from '../../components/AlertsOverlay';
import { supabase } from '../../lib/supabase';
import WaterVolumeModal from '../../components/WaterVolumeModal';

const { height } = Dimensions.get('window');

interface MapProps {
  style: any;
  currentLocation: any;
  selectedLocation: any;
  ref?: React.RefObject<any>;
}

function WebMap({ style, currentLocation, selectedLocation }: MapProps) {
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
}

function NativeMap({ style, currentLocation, selectedLocation }: MapProps) {
  const [mapError, setMapError] = useState(false);
  let Map;
  
  try {
    Map = require('react-native-maps').default;
  } catch (error) {
    console.error('Failed to load react-native-maps:', error);
    setMapError(true);
  }

  if (!Map || mapError) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#242430' }]}>
        <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center', padding: 20 }}>
          Map not available. Please check your connection and try again.
        </Text>
      </View>
    );
  }

  try {
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
        onError={(error: any) => {
          console.error('Map error:', error);
          setMapError(true);
        }}
      />
    );
  } catch (error) {
    console.error('Error rendering map:', error);
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#242430' }]}>
        <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center', padding: 20 }}>
          Error loading map. Please try again later.
        </Text>
      </View>
    );
  }
}

const MapView = Platform.select({
  web: () => WebMap,
  default: () => NativeMap,
})();

interface WaterContainer {
  id: string;
  name: string;
  location: string;
  address: string;
  capacity: number;
  available_volume: number;
  is_online: boolean;
  rates: Array<{
    volume: number;
    price: number;
  }>;
  distance?: number;
}

export default function Home() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [containers, setContainers] = useState<WaterContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<any>(null);
  const [defaultAddress, setDefaultAddress] = useState<any>(null);
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<any>(null);

  const [fontsLoaded] = useFonts({
    'Montserrat-Light': Montserrat_300Light,
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    fetchContainers();
    
    const subscription = supabase
      .channel('water_containers')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'water_containers'
      }, (payload) => {
        console.log('Real-time update:', payload);
        fetchContainers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchDefaultAddress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .single();

        if (error) throw error;
        if (data) {
          const pointStr = data.location.slice(1, -1).split(',');
          setDefaultAddress({
            ...data,
            coordinates: {
              longitude: parseFloat(pointStr[0]),
              latitude: parseFloat(pointStr[1])
            }
          });
        }
      } catch (error) {
        console.error('Error fetching default address:', error);
      }
    };

    fetchDefaultAddress();
  }, []);

  const fetchContainers = async () => {
    try {
      const { data, error } = await supabase
        .from('water_containers')
        .select('*')
        .order('name');

      if (error) throw error;

      const containersWithDistance = data.map(container => {
        const pointStr = container.location.slice(1, -1).split(',');
        const containerLocation = {
          longitude: parseFloat(pointStr[0]),
          latitude: parseFloat(pointStr[1])
        };

        let distance = 0;
        if (defaultAddress?.coordinates) {
          distance = calculateDistance(
            defaultAddress.coordinates.latitude,
            defaultAddress.coordinates.longitude,
            containerLocation.latitude,
            containerLocation.longitude
          );
        }

        return {
          ...container,
          distance: distance
        };
      });

      containersWithDistance.sort((a, b) => a.distance - b.distance);
      setContainers(containersWithDistance);
    } catch (error) {
      console.error('Error fetching containers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      fetchContainers();
    })();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showSearchOverlay) {
        setShowSearchOverlay(false);
        return true;
      }
      if (showProfileMenu) {
        setShowProfileMenu(false);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [showSearchOverlay, showProfileMenu]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  const handleLocationSelect = async (suggestion: any) => {
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

      let location = await Location.getLastKnownPositionAsync({});

      if (!location) {
        location = await Location.getCurrentPositionAsync({});
      }

      setLocation(location);
      setSelectedLocation(null);
      setSearchQuery('Current Location');
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Failed to get location. Please check your GPS settings.");
    }
  };

  const handleRateSelect = (container: WaterContainer, rate: any) => {
    if (!container.is_online) return;
    
    console.log('[Container Selection]:', {
      container: container.id,
      rate: rate
    });
    
    setSelectedContainer({
      ...container,
      selectedRate: rate
    });
    setShowVolumeModal(true);
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
      <AlertsOverlay />
      <View style={[styles.header, { backgroundColor: bgColor }]}>
        <Text style={[styles.logo, { color: textColor }]}>AquaGo</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: cardBgColor }]}
            onPress={() => setShowProfileMenu(true)}
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

          {loading ? (
            <Text style={[styles.loadingText, { color: subtitleColor }]}>
              Loading suppliers...
            </Text>
          ) : containers.map((container) => (
            <View key={container.id} style={[styles.supplierCard, { backgroundColor: cardBgColor }]}>
              <View style={styles.supplierHeader}>
                <Text style={[styles.supplierName, { color: textColor }]}>
                  {container.name}
                </Text>
                <View style={[styles.statusIndicator, { 
                  backgroundColor: container.is_online ? '#4CAF50' : '#FF3B30' 
                }]} />
              </View>
              
              <View style={styles.supplierInfo}>
                <Text style={[styles.distanceText, { color: subtitleColor }]}>
                  📍 {container.distance !== undefined ? container.distance.toFixed(1) : '?'} km away
                </Text>
                <Text style={[styles.availabilityText, { color: subtitleColor }]}>
                  Available Volume: {container.available_volume.toLocaleString()}L / {container.capacity.toLocaleString()}L
                </Text>
                <View style={styles.statusText}>
                  <Text style={[styles.statusLabel, { color: container.is_online ? '#4CAF50' : '#FF3B30' }]}>
                    {container.is_online ? '● Online' : '● Offline'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.ratesTitle, { color: textColor }]}>
                Water Volume & Rates:
              </Text>
              <View style={styles.ratesContainer}>
                {container.rates.map((rate, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={[
                      styles.rateButton,
                      !container.is_online && styles.rateButtonDisabled
                    ]}
                    onPress={() => handleRateSelect(container, rate)}
                    disabled={!container.is_online}
                  >
                    <Text style={styles.rateButtonText}>{rate.volume}L</Text>
                    <Text style={styles.ratePrice}>₹{rate.price}</Text>
                    <Text style={styles.ratePerLiter}>
                      (₹{(rate.price / rate.volume).toFixed(2)}/L)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {selectedContainer && (
        <WaterVolumeModal
          visible={showVolumeModal}
          onClose={() => {
            console.log('[Modal]: Closing modal');
            setShowVolumeModal(false);
            setSelectedContainer(null);
          }}
          onSuccess={() => {
            console.log('[Modal]: Order successful');
            setShowVolumeModal(false);
            setSelectedContainer(null);
            fetchContainers();
          }}
          selectedContainer={selectedContainer}
        />
      )}

      <SearchOverlay
        visible={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLocationSelect={handleLocationSelect}
      />

      <ProfileMenu
        visible={showProfileMenu}
        onClose={() => setShowProfileMenu(false)}
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
  loadingText: {
    textAlign: 'center',
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    marginTop: 20,
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
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  supplierInfo: {
    marginBottom: 15,
  },
  distanceText: {
    fontFamily: 'Montserrat-Regular',
    marginBottom: 5,
  },
  availabilityText: {
    fontFamily: 'Montserrat-Regular',
    marginBottom: 5,
  },
  statusText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
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
  rateButtonDisabled: {
    opacity: 0.5,
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