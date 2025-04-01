import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { CreditCard, Plus } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';

// Get status bar height
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function PaymentMethods() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  const paymentMethods = [
    {
      id: 1,
      type: 'card',
      title: 'Personal Card',
      details: { last4: '4242', brand: 'visa' },
      isDefault: true,
    },
    {
      id: 2,
      type: 'upi',
      title: 'UPI',
      details: { id: 'user@upi' },
      isDefault: false,
    },
  ];

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.addButton}>
        <Plus size={24} color="#000000" />
        <Text style={styles.addButtonText}>Add Payment Method</Text>
      </TouchableOpacity>

      <View style={styles.methodsContainer}>
        <Text style={styles.sectionTitle}>Saved Payment Methods</Text>
        {paymentMethods.map((method) => (
          <View key={method.id} style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <CreditCard size={24} color="#FFA500" />
            </View>
            <View style={styles.methodDetails}>
              <View style={styles.methodHeader}>
                <Text style={styles.methodTitle}>{method.title}</Text>
                {method.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.methodInfo}>
                {method.type === 'card'
                  ? `•••• ${method.details.last4}`
                  : method.details.id}
              </Text>
            </View>
          </View>
        ))}
      </View>
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
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
    marginLeft: 10,
  },
  methodsContainer: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 15,
  },
  methodCard: {
    flexDirection: 'row',
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  methodDetails: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  methodTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginRight: 10,
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    color: '#FFA500',
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
  },
  methodInfo: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
});