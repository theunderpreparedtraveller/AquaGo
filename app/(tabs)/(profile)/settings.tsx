import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Platform, StatusBar } from 'react-native';
import { Bell, Shield, Moon, CircleHelp as HelpCircle } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useTheme } from '../../../context/ThemeContext';
import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';

// Get status bar height
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

export default function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    if (Platform.OS === 'web') {
      console.log('[Notifications]: Web platform - notifications not supported');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('[Notifications]: Current permission status:', existingStatus);
      setNotificationsEnabled(existingStatus === 'granted');
    } catch (error) {
      console.error('[Notifications Error]:', error);
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (Platform.OS === 'web') {
      console.log('[Notifications]: Web platform - notifications not supported');
      return;
    }

    try {
      if (value) {
        console.log('[Notifications]: Requesting permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('[Notifications]: Permission request result:', status);
        
        if (status === 'granted') {
          console.log('[Notifications]: Permission granted');
          setNotificationsEnabled(true);
          
          // Configure notifications
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFA500',
          });
        } else {
          console.log('[Notifications]: Permission denied');
          setNotificationsEnabled(false);
        }
      } else {
        console.log('[Notifications]: Disabling notifications');
        setNotificationsEnabled(false);
      }
    } catch (error) {
      console.error('[Notifications Error]:', error);
      setNotificationsEnabled(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const sections = [
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          type: 'switch',
          value: notificationsEnabled,
          onValueChange: handleNotificationsToggle,
        },
        {
          icon: Moon,
          label: 'Dark Mode',
          type: 'switch',
          value: isDarkMode,
          onValueChange: toggleTheme,
        },
      ],
    },
    {
      title: 'Security',
      items: [
        {
          icon: Shield,
          label: 'Privacy Settings',
          type: 'link',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & Support',
          type: 'link',
        },
      ],
    },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#1a1f2b' : '#f5f5f5' }]}>
      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={[styles.section, { borderBottomColor: isDarkMode ? '#2C2C2E' : '#E5E5E5' }]}>
          <Text style={[styles.sectionTitle, { color: '#FFA500' }]}>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity
              key={itemIndex}
              style={[styles.settingItem, { backgroundColor: isDarkMode ? '#242430' : '#FFFFFF' }]}
              disabled={item.type === 'switch'}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <item.icon size={24} color="#FFA500" />
                </View>
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                  {item.label}
                </Text>
              </View>
              {item.type === 'switch' ? (
                <Switch
                  value={item.value}
                  onValueChange={item.onValueChange}
                  trackColor={{ false: '#2C2C2E', true: '#FFA50050' }}
                  thumbColor={item.value ? '#FFA500' : '#666'}
                />
              ) : (
                <Text style={styles.linkText}>{'>'}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={[styles.version, { color: isDarkMode ? '#666' : '#999' }]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: STATUSBAR_HEIGHT + 20,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
  linkText: {
    fontSize: 18,
    color: '#666',
    fontFamily: 'Montserrat-Medium',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  version: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
});