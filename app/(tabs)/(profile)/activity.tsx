import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Truck, Check, Clock } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';

export default function Activity() {
  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  const activities = [
    {
      id: 1,
      type: 'completed',
      title: 'Water Delivery Completed',
      description: '5000L water delivered to Home',
      date: '16 Mar, 2024',
      time: '14:30',
      amount: '₹750',
    },
    {
      id: 2,
      type: 'ongoing',
      title: 'Water Delivery in Progress',
      description: '2000L water delivery to Office',
      date: '16 Mar, 2024',
      time: '12:45',
      amount: '₹450',
    },
    {
      id: 3,
      type: 'scheduled',
      title: 'Scheduled Delivery',
      description: '3000L water delivery to Home',
      date: '17 Mar, 2024',
      time: '10:00',
      amount: '₹600',
    },
  ];

  if (!fontsLoaded) {
    return null;
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'completed':
        return <Check size={24} color="#4CAF50" />;
      case 'ongoing':
        return <Truck size={24} color="#FFA500" />;
      case 'scheduled':
        return <Clock size={24} color="#2196F3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'completed':
        return '#4CAF50';
      case 'ongoing':
        return '#FFA500';
      case 'scheduled':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {activities.map((activity) => (
        <View key={activity.id} style={styles.activityCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${getStatusColor(activity.type)}20` }]}>
            {getActivityIcon(activity.type)}
          </View>
          <View style={styles.activityContent}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityAmount}>{activity.amount}</Text>
            </View>
            <Text style={styles.activityDescription}>{activity.description}</Text>
            <View style={styles.activityFooter}>
              <Text style={styles.activityTime}>{activity.date} • {activity.time}</Text>
              <Text style={[styles.activityStatus, { color: getStatusColor(activity.type) }]}>
                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2b',
    padding: 20,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#242430',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  activityTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },
  activityAmount: {
    fontSize: 16,
    color: '#FFA500',
    fontFamily: 'Montserrat-SemiBold',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 8,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  activityStatus: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
  },
});