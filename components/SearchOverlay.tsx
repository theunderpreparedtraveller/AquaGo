import { StyleSheet, View, Text, TouchableOpacity, TextInput, ScrollView, Dimensions, Keyboard, Platform, StatusBar } from 'react-native';
import { Search, MapPin, X, Clock, Chrome as Home, Building2 } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium } from '@expo-google-fonts/montserrat';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import Animated, { 
  withTiming, 
  useAnimatedStyle, 
  useSharedValue,
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;
const TOP_OFFSET = STATUSBAR_HEIGHT + 10;

const AnimatedView = Animated.createAnimatedComponent(View);

// Sample locations database
const LOCATIONS_DB = [
  { 
    title: 'Indiranagar',
    type: 'location',
    address: 'Indiranagar, Bengaluru, Karnataka 560038',
    coordinates: { latitude: 12.9719, longitude: 77.6412 }
  },
  { 
    title: 'Koramangala',
    type: 'location',
    address: 'Koramangala, Bengaluru, Karnataka 560034',
    coordinates: { latitude: 12.9279, longitude: 77.6271 }
  },
  { 
    title: 'HSR Layout',
    type: 'location',
    address: 'HSR Layout, Bengaluru, Karnataka 560102',
    coordinates: { latitude: 12.9081, longitude: 77.6476 }
  },
  { 
    title: 'Whitefield',
    type: 'location',
    address: 'Whitefield, Bengaluru, Karnataka 560066',
    coordinates: { latitude: 12.9698, longitude: 77.7499 }
  },
  { 
    title: 'Electronic City',
    type: 'location',
    address: 'Electronic City, Bengaluru, Karnataka 560100',
    coordinates: { latitude: 12.8399, longitude: 77.6770 }
  },
  {
    title: 'MG Road',
    type: 'location',
    address: 'MG Road, Bengaluru, Karnataka 560001',
    coordinates: { latitude: 12.9756, longitude: 77.6097 }
  },
  {
    title: 'Jayanagar',
    type: 'location',
    address: 'Jayanagar, Bengaluru, Karnataka 560011',
    coordinates: { latitude: 12.9250, longitude: 77.5938 }
  },
  {
    title: 'JP Nagar',
    type: 'location',
    address: 'JP Nagar, Bengaluru, Karnataka 560078',
    coordinates: { latitude: 12.9077, longitude: 77.5851 }
  }
];

// Saved locations
const SAVED_LOCATIONS = [
  { title: 'Home', type: 'saved', address: '123 Main St, Indiranagar, Bangalore', coordinates: { latitude: 12.9719, longitude: 77.6412 } },
  { title: 'Office', type: 'saved', address: '456 Work Ave, Koramangala, Bangalore', coordinates: { latitude: 12.9279, longitude: 77.6271 } },
];

// Recent locations
const RECENT_LOCATIONS = [
  { title: 'MG Road Mall', type: 'recent', address: 'MG Road, Bangalore', coordinates: { latitude: 12.9756, longitude: 77.6097 } },
  { title: 'Central Park', type: 'recent', address: 'JP Nagar, Bangalore', coordinates: { latitude: 12.9077, longitude: 77.5851 } },
];

export default function SearchOverlay({ 
  visible, 
  onClose, 
  searchQuery, 
  onSearchChange,
  onLocationSelect,
}) {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
  });

  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        // Always show current location and saved locations at the top
        const defaultSuggestions = [
          { title: 'Current Location', type: 'current' },
          ...SAVED_LOCATIONS
        ];

        if (!searchQuery.trim()) {
          // Show default suggestions and recent locations when no search query
          setSuggestions([
            ...defaultSuggestions,
            ...RECENT_LOCATIONS
          ]);
          return;
        }

        // Search in locations database
        const searchResults = LOCATIONS_DB.filter(location => 
          location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          location.address.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Get current location for distance calculation
        let currentLocation = null;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            currentLocation = await Location.getCurrentPositionAsync({});
          }
        } catch (error) {
          console.error('Error getting current location:', error);
        }

        // Calculate distances if we have current location
        const resultsWithDistance = searchResults.map(result => {
          if (currentLocation && result.coordinates) {
            const distance = calculateDistance(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude,
              result.coordinates.latitude,
              result.coordinates.longitude
            );
            return { ...result, distance };
          }
          return result;
        });

        // Sort by distance if available
        resultsWithDistance.sort((a, b) => {
          if (a.distance && b.distance) {
            return a.distance - b.distance;
          }
          return 0;
        });

        setSuggestions([
          ...defaultSuggestions,
          ...resultsWithDistance
        ]);

      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const getIcon = (type) => {
    switch (type) {
      case 'current':
        return MapPin;
      case 'saved':
        return Home;
      case 'recent':
        return Clock;
      case 'location':
        return Building2;
      default:
        return MapPin;
    }
  };

  if (!visible || !fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <AnimatedView style={[styles.overlay, overlayStyle]} />
      <View style={[styles.content, { top: TOP_OFFSET }]}>
        <View style={styles.searchHeader}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location"
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={onSearchChange}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => onSearchChange('')}>
                <X size={20} color="#666" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.suggestionsContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <Text style={styles.loadingText}>Searching locations...</Text>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => {
              const Icon = getIcon(suggestion.type);
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => {
                    onLocationSelect(suggestion);
                    handleClose();
                  }}
                >
                  <View style={[
                    styles.suggestionIcon,
                    { backgroundColor: suggestion.type === 'current' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(255, 165, 0, 0.1)' }
                  ]}>
                    <Icon size={20} color={suggestion.type === 'current' ? '#2196F3' : '#FFA500'} />
                  </View>
                  <View style={styles.suggestionText}>
                    <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                    {suggestion.address && (
                      <Text style={styles.suggestionAddress}>
                        {suggestion.address}
                        {suggestion.distance && (
                          <Text style={styles.distanceText}>
                            {' '}• {suggestion.distance.toFixed(1)} km away
                          </Text>
                        )}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.noResultsText}>No locations found</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#1a1f2b',
    borderRadius: 12,
    maxHeight: height - TOP_OFFSET - 20,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    backgroundColor: '#1a1f2b',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginRight: 10,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    marginRight: 10,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#242430',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 15,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginBottom: 4,
  },
  suggestionAddress: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  distanceText: {
    color: '#FFA500',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    paddingVertical: 20,
  },
});