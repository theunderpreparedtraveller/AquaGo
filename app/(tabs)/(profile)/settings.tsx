import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Bell, Shield, Moon, CircleHelp as HelpCircle } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useTheme } from '../../../context/ThemeContext';

export default function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

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
          value: true,
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
    <ScrollView style={styles.container}>
      {sections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, itemIndex) => (
            <TouchableOpacity
              key={itemIndex}
              style={styles.settingItem}
              disabled={item.type === 'switch'}
            >
              <View style={styles.settingLeft}>
                <View style={styles.iconContainer}>
                  <item.icon size={24} color="#FFA500" />
                </View>
                <Text style={styles.settingLabel}>{item.label}</Text>
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
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2b',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFA500',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#242430',
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
    color: '#FFFFFF',
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
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
});