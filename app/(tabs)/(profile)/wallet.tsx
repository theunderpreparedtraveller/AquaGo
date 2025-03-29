import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useTheme } from '../../../context/ThemeContext';


export default function Wallet() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const transactions = [
    { id: 1, type: 'credit', amount: 500, description: 'Refund from cancelled order', date: '2024-03-16' },
    { id: 2, type: 'debit', amount: 750, description: 'Water tanker payment', date: '2024-03-15' },
    { id: 3, type: 'credit', amount: 1000, description: 'Added money to wallet', date: '2024-03-14' },
  ];

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Text>  </Text>
      <Text></Text>
      <Text></Text>
      <Text style={[styles.logo, { color: textColor }]}>    AquaGo</Text>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>₹1,500.00</Text>
        <TouchableOpacity style={styles.addMoneyButton}>
          <Plus size={20} color="#000000" />
          <Text style={styles.addMoneyText}>Add Money</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionIcon}>
              {transaction.type === 'credit' ? (
                <ArrowDownLeft size={24} color="#4CAF50" />
              ) : (
                <ArrowUpRight size={24} color="#FF3B30" />
              )}
            </View>
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionDescription}>{transaction.description}</Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>
            <Text
              style={[
                styles.transactionAmount,
                { color: transaction.type === 'credit' ? '#4CAF50' : '#FF3B30' },
              ]}>
              {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
            </Text>
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
  },
  balanceCard: {
    backgroundColor: '#242430',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 5,
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Montserrat-Light',
  },
  balanceAmount: {
    fontSize: 36,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 20,
  },
  addMoneyButton: {
    flexDirection: 'row',
    backgroundColor: '#FFA500',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  addMoneyText: {
    color: '#000000',
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
  transactionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});