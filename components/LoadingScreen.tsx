import { useEffect } from 'react';
import { StyleSheet, View, Text, Image, Dimensions, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useFonts, Montserrat_300Light, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
  const translateX = useSharedValue(-width);
  const scale = useSharedValue(1);
  const logoOpacity = useSharedValue(0);

  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Light': Montserrat_300Light,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (fontError) {
      console.warn('Font loading error:', fontError);
    }
    
    try {
      // Truck animation
      translateX.value = withRepeat(
        withSequence(
          withTiming(-width, { duration: 0 }),
          withTiming(width, {
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
          }),
        ),
        -1,
        false
      );

      // Logo animation
      logoOpacity.value = withTiming(1, { duration: 1000 });
      scale.value = withRepeat(
        withSequence(
          withSpring(1.1),
          withSpring(1)
        ),
        -1,
        true
      );
    } catch (error) {
      console.error('Animation error:', error);
    }
  }, []);

  const truckStyle = useAnimatedStyle(() => {
    try {
      return {
        transform: [{ translateX: translateX.value }],
      };
    } catch (error) {
      runOnJS(console.error)('Truck animation error:', error);
      return {};
    }
  });

  const logoStyle = useAnimatedStyle(() => {
    try {
      return {
        opacity: logoOpacity.value,
        transform: [{ scale: scale.value }],
      };
    } catch (error) {
      runOnJS(console.error)('Logo animation error:', error);
      return {};
    }
  });

  // Fallback styles for when fonts aren't loaded
  const titleStyle = fontsLoaded
    ? styles.title
    : { ...styles.title, fontFamily: undefined, fontWeight: 'bold' as const };
  
  const subtitleStyle = fontsLoaded
    ? styles.subtitle
    : { ...styles.subtitle, fontFamily: undefined };
  
  const loadingTextStyle = fontsLoaded
    ? styles.loadingText
    : { ...styles.loadingText, fontFamily: undefined };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Text style={titleStyle}>AquaGo</Text>
        <Text style={subtitleStyle}>Water Delivery Made Simple</Text>
      </Animated.View>

      <View style={styles.roadContainer}>
        <View style={styles.road} />
        <Animated.View style={[styles.truckContainer, truckStyle]}>
          <Image
            source={{ uri: 'https://raw.githubusercontent.com/stackblitz/stackblitz-codeflow/main/examples/water-tanker.png' }}
            style={styles.truckImage}
            resizeMode="contain"
            onError={(e) => console.error('Image loading error:', e.nativeEvent.error)}
          />
        </Animated.View>
      </View>

      <Text style={loadingTextStyle}>Loading...</Text>
      {!fontsLoaded && <ActivityIndicator size="large" color="#FFA500" style={{ marginTop: 10 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 48,
    color: '#FFA500',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat-Light',
  },
  roadContainer: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  road: {
    width: '100%',
    height: 2,
    backgroundColor: '#666',
    position: 'absolute',
  },
  truckContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  truckImage: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    marginTop: 30,
    color: '#FFA500',
    fontSize: 16,
    fontFamily: 'Montserrat-Light',
  },
});