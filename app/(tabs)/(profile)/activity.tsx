import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, StatusBar, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { Truck, Check, Clock, Ban, Phone, MessageSquare, X } from 'lucide-react-native';
import { useFonts, Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { supabase } from '../../../lib/supabase';
import ChatModal from '../../../components/ChatModal';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  amount: number;
  status: 'completed' | 'confirmed' | 'pending' | 'cancelled';
  created_at: string;
  contact_number?: string;
  reference_type?: string;
}

interface ActivityOverlayProps {
  activity: Activity;
  onClose: () => void;
  onChatPress: () => void;
  onCallPress: () => void;
  onCancelPress: () => void;
}

function ActivityOverlay({ activity, onClose, onChatPress, onCallPress, onCancelPress }: ActivityOverlayProps) {
  const canCancel = activity.status !== 'cancelled' && activity.status !== 'completed';
  const timeSinceCreation = Math.floor((Date.now() - new Date(activity.created_at).getTime()) / 1000);
  const canRequestCancellation = canCancel && timeSinceCreation <= 60;

  return (
    <View style={styles.overlayContainer}>
      <View style={styles.overlayContent}>
        <View style={styles.overlayHeader}>
          <Text style={styles.overlayTitle}>Activity Options</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.overlayBody}>
          <TouchableOpacity style={styles.overlayButton} onPress={onCallPress}>
            <Phone size={24} color="#FFA500" />
            <Text style={styles.overlayButtonText}>Call Supplier</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.overlayButton} onPress={onChatPress}>
            <MessageSquare size={24} color="#FFA500" />
            <Text style={styles.overlayButtonText}>Chat with Supplier</Text>
          </TouchableOpacity>

          {canRequestCancellation && (
            <TouchableOpacity 
              style={[styles.overlayButton, styles.cancelButton]}
              onPress={onCancelPress}
            >
              <Ban size={24} color="#FF3B30" />
              <Text style={[styles.overlayButtonText, styles.cancelButtonText]}>
                Cancel Order
              </Text>
              <Text style={styles.cancelTimeText}>
                ({60 - timeSinceCreation}s remaining)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function Activity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  const fetchActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .rpc('get_user_activity_history', { p_user_id: user.id });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
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

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check size={24} color="#4CAF50" />;
      case 'confirmed':
        return <Truck size={24} color="#FFA500" />;
      case 'pending':
        return <Clock size={24} color="#2196F3" />;
      case 'cancelled':
        return <Ban size={24} color="#FF3B30" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'confirmed':
        return '#FFA500';
      case 'pending':
        return '#2196F3';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const handleCall = (phoneNumber: string) => {
    const telUrl = `tel:${phoneNumber}`;
    Linking.canOpenURL(telUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(telUrl);
        }
        console.log('Phone calls not supported');
      })
      .catch(err => console.error('Error opening phone app:', err));
  };

  const handleActivityPress = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowOverlay(true);
  };

  const handleCancelOrder = async () => {
    if (!selectedActivity) return;

    try {
      const { error } = await supabase.rpc('cancel_water_delivery', {
        p_order_id: selectedActivity.id
      });

      if (error) throw error;

      // Refresh activities list
      fetchActivities();
      setShowOverlay(false);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
      // You might want to show an error message to the user here
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFA500"
          />
        }
      >
        {loading ? (
          <Text style={styles.messageText}>Loading activities...</Text>
        ) : activities.length === 0 ? (
          <Text style={styles.messageText}>No activities yet</Text>
        ) : (
          activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() => handleActivityPress(activity)}
            >
              <View style={[styles.iconContainer, { 
                backgroundColor: `${getStatusColor(activity.status)}20` 
              }]}>
                {getActivityIcon(activity.status)}
              </View>
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityAmount}>₹{activity.amount}</Text>
                </View>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                <View style={styles.activityFooter}>
                  <Text style={styles.activityTime}>
                    {formatDate(activity.created_at)} • {formatTime(activity.created_at)}
                  </Text>
                  <Text style={[styles.activityStatus, { 
                    color: getStatusColor(activity.status)
                  }]}>
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {showOverlay && selectedActivity && (
        <ActivityOverlay
          activity={selectedActivity}
          onClose={() => {
            setShowOverlay(false);
            setSelectedActivity(null);
          }}
          onChatPress={() => {
            setShowOverlay(false);
            setShowChat(true);
          }}
          onCallPress={() => {
            if (selectedActivity.contact_number) {
              handleCall(selectedActivity.contact_number);
            }
          }}
          onCancelPress={handleCancelOrder}
        />
      )}

      {selectedActivity && (
        <ChatModal
          visible={showChat}
          onClose={() => {
            setShowChat(false);
            setSelectedActivity(null);
          }}
          deliveryId={selectedActivity.id}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1f2b',
    paddingTop: STATUSBAR_HEIGHT + 20,
    paddingHorizontal: 20,
  },
  messageText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginTop: 20,
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
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayContent: {
    backgroundColor: '#1a1f2b',
    borderRadius: 15,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  overlayTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#242430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBody: {
    gap: 10,
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  overlayButtonText: {
    color: '#FFA500',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#FF3B30',
  },
  cancelTimeText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
});