import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../../../lib/supabase';
import AddMoneyModal from '../../../components/AddMoneyModal';
import { useTheme } from '../../../context/ThemeContext';

// Get status bar height
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_type: string;
  created_at: string;
}

export default function Wallet() {
  const { isDarkMode, toggleTheme } = useTheme();
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (walletError) throw walletError;
      setBalance(wallet?.balance || 0);

      // Get recent transactions
      const { data: transactions, error: transactionsError } = await supabase
        .rpc('get_user_transactions', { p_user_id: user.id, p_limit: 10 });

      if (transactionsError) throw transactionsError;
      setTransactions(transactions || []);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!fontsLoaded) {
    return null;
  }
  const bgColor = isDarkMode ? '#1a1f2b' : '#ffffff';
  const bgColorcard = isDarkMode ? '#1a1f2b' : '#F5F5F5';
  const cardBgColor = isDarkMode ? '#1a1f2B' : '#f5f5f5';
  const subtitleColor = isDarkMode ? '#666666' : '#757575';
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Text style={[styles.logo, { color: textColor }]}></Text>
      <Text style={[styles.logo, { color: textColor }]}>AquaGo</Text>
      <ScrollView style={styles.scrollView}>
        <View style={[styles.balanceCard, { backgroundColor: bgColorcard }]}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={[styles.balanceAmount,{ color: textColor }]}>₹{balance.toFixed(2)}</Text>
          <TouchableOpacity 
            style={styles.addMoneyButton}
            onPress={() => setShowAddMoney(true)}
          >
            <Plus size={20} color="#000000" />
            <Text style={styles.addMoneyText}>Add Money</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {loading ? (
            <Text style={styles.messageText}>Loading transactions...</Text>
          ) : transactions.length === 0 ? (
            <Text style={styles.messageText}>No transactions yet</Text>
          ) : (
            transactions.map((transaction) => (
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
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.created_at)} • {formatTime(transaction.created_at)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'credit' ? '#4CAF50' : '#FF3B30' },
                  ]}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <AddMoneyModal
        visible={showAddMoney}
        onClose={() => setShowAddMoney(false)}
        onSuccess={fetchWalletData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2b',
    paddingTop: STATUSBAR_HEIGHT,
  },
  logo: {
    fontSize: 24,
    fontFamily: 'Montserrat-Light',
    marginLeft:35
  },
  scrollView: {
    flex: 1,
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
  messageText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginTop: 20,
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