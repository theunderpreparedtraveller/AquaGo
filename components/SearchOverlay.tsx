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
import { supabase } from '../lib/supabase';

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
  }
];

interface SavedLocation {
  id: string;
  title: string;
  address: string;
  location: string; // Point data from PostgreSQL
  is_default: boolean;
}

interface RecentLocation {
  id: string;
  delivery_address: string;
  delivery_location: string; // Point data from PostgreSQL
  created_at: string;
}

interface SearchSuggestion {
  title: string;
  type: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  is_default?: boolean;
  created_at?: string;
}

interface SearchOverlayProps {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onLocationSelect: (suggestion: SearchSuggestion) => void;
}

export default function SearchOverlay({
  visible,
  onClose,
  searchQuery,
  onSearchChange,
  onLocationSelect,
}: SearchOverlayProps) {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
  });

  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SearchSuggestion[]>([]);
  const [recentLocations, setRecentLocations] = useState<SearchSuggestion[]>([]);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      loadSavedLocations();
      loadRecentLocations();
    } else {
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const loadSavedLocations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;

      const formattedLocations = data.map(location => {
        // Convert point format '(longitude,latitude)' to coordinates
        const pointMatch = location.location.match(/\((.*?),(.*?)\)/);
        const coordinates = pointMatch ? {
          longitude: parseFloat(pointMatch[1]),
          latitude: parseFloat(pointMatch[2])
        } : null;

        return {
          ...location,
          type: 'saved',
          coordinates
        };
      });

      setSavedLocations(formattedLocations);
    } catch (error) {
      console.error('Error loading saved locations:', error);
    }
  };

  const loadRecentLocations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('water_deliveries')
        .select('id, delivery_address, delivery_location, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedLocations = data.map(delivery => {
        // Convert point format '(longitude,latitude)' to coordinates
        const pointMatch = delivery.delivery_location.match(/\((.*?),(.*?)\)/);
        const coordinates = pointMatch ? {
          longitude: parseFloat(pointMatch[1]),
          latitude: parseFloat(pointMatch[2])
        } : undefined;

        return {
          id: delivery.id,
          type: 'recent',
          title: delivery.delivery_address.split(',')[0], // First part of address as title
          address: delivery.delivery_address,
          coordinates,
          created_at: delivery.created_at
        };
      });

      setRecentLocations(formattedLocations as SearchSuggestion[]);
    } catch (error) {
      console.error('Error loading recent locations:', error);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        // Always show current location at the top
        let defaultSuggestions = [
          { title: 'Current Location', type: 'current' }
        ];
        
        // Safely add saved and recent locations
        try {
          defaultSuggestions = [
            ...defaultSuggestions,
            ...(savedLocations || []),
            ...(recentLocations || [])
          ];
        } catch (locError) {
          console.error('Error adding saved/recent locations:', locError);
        }

        if (!searchQuery || !searchQuery.trim()) {
          // Show default suggestions when no search query
          setSuggestions(defaultSuggestions);
          setIsLoading(false);
          return;
        }

        // Search in locations database
        let searchResults: SearchSuggestion[] = [];
        try {
          searchResults = LOCATIONS_DB.filter(location =>
            location.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            location.address.toLowerCase().includes(searchQuery.toLowerCase())
          );
        } catch (searchError) {
          console.error('Error searching locations:', searchError);
        }

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
        let resultsWithDistance: SearchSuggestion[] = [];
        try {
          resultsWithDistance = searchResults.map(result => {
            if (currentLocation && result.coordinates) {
              try {
                const distance = calculateDistance(
                  currentLocation.coords.latitude,
                  currentLocation.coords.longitude,
                  result.coordinates.latitude,
                  result.coordinates.longitude
                );
                return { ...result, distance };
              } catch (distError) {
                console.error('Error calculating distance:', distError);
                return result;
              }
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
        } catch (mapError) {
          console.error('Error processing search results:', mapError);
        }

        setSuggestions([
          ...defaultSuggestions,
          ...resultsWithDistance
        ]);

      } catch (error) {
        console.error('Error fetching suggestions:', error);
        // Set at least default suggestions on error
        setSuggestions([{ title: 'Current Location', type: 'current' }]);
      } finally {
        setIsLoading(false);
      }
    };

    try {
      const debounceTimer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(debounceTimer);
    } catch (timerError) {
      console.error('Error setting debounce timer:', timerError);
      fetchSuggestions();
      return () => {};
    }
  }, [searchQuery, savedLocations, recentLocations]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const getIcon = (type: string) => {
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
                    <Text style={styles.suggestionTitle}>
                      {suggestion.title}
                      {suggestion.is_default && suggestion.type === 'saved' && (
                        <Text style={styles.defaultBadge}> (Default)</Text>
                      )}
                    </Text>
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
  defaultBadge: {
    color: '#FFA500',
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
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