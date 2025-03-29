import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { User, Wallet, History, CreditCard, Settings, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';

export default function ProfileMenu({ visible, onClose }) {
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const menuItems = [
    { icon: Wallet, label: 'Wallet', route: '/wallet' },
    { icon: History, label: 'Activity History', route: '/activity' },
    { icon: CreditCard, label: 'Payment Methods', route: '/payment-methods' },
    { icon: Settings, label: 'Settings', route: '/settings' },
  ];

  const handleMenuItemPress = (route: string) => {
    onClose();
    router.push(route);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <User size={32} color="#FFA500" />
            </View>
            <Text style={styles.userEmail}>
              trevor.does.work@gmail.com
            </Text>
          </View>

          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleMenuItemPress(item.route)}
            >
              <item.icon size={24} color="#FFA500" />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              onClose();
              router.replace('/login');
            }}
          >
            <LogOut size={24} color="#000000" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    width: 300,
    marginTop: 100,
    marginLeft: 15,
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#1a1f2b',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userSection: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  userEmail: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 8,
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#FFA500',
    borderRadius: 8,
    marginTop: 20,
  },
  logoutText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Montserrat-SemiBold',
  },
});