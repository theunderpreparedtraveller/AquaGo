import { useEffect } from 'react';
import { StyleSheet, View, Text, Image, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useFonts, Montserrat_300Light, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
  const translateX = useSharedValue(-width);
  const scale = useSharedValue(1);
  const logoOpacity = useSharedValue(0);

  const [fontsLoaded] = useFonts({
    'Montserrat-Light': Montserrat_300Light,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
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
  }, []);

  const truckStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <Text style={styles.title}>AquaGo</Text>
        <Text style={styles.subtitle}>Water Delivery Made Simple</Text>
      </Animated.View>

      <View style={styles.roadContainer}>
        <View style={styles.road} />
        <Animated.View style={[styles.truckContainer, truckStyle]}>
          <Image
            source={{ uri: 'https://raw.githubusercontent.com/stackblitz/stackblitz-codeflow/main/examples/water-tanker.png' }}
            style={styles.truckImage}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <Text style={styles.loadingText}>Loading...</Text>
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