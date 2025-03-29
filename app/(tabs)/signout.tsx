import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';

export default function SignOut() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleSignOut = () => {
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Out</Text>
      <Text style={styles.message}>Are you sure you want to sign out?</Text>
      
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>SIGN OUT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2b',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 30,
    textAlign: 'center',
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});