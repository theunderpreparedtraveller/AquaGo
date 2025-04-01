// Previous imports remain the same...

export default function WaterVolumeModal({ visible, onClose, onSuccess, selectedContainer }) {
  console.log('[Modal]: Initializing with container:', selectedContainer);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [moneyAmount, setMoneyAmount] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: '',
    address: '',
    location: null,
  });
  const [loadingLocation, setLoadingLocation] = useState(false);

  const [fontsLoaded] = useFonts({
    'Montserrat-Regular': Montserrat_400Regular,
    'Montserrat-Medium': Montserrat_500Medium,
    'Montserrat-SemiBold': Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (visible && selectedContainer) {
      console.log('[Modal]: Modal opened with container:', selectedContainer.id);
      fetchWalletBalance();
      fetchDefaultAddress();
      setStep(1);
      setScheduledDate(new Date());
      setShowAddMoney(false);
      setShowAddAddress(false);
    }
  }, [visible, selectedContainer]);

  // Previous functions remain the same...

  if (!fontsLoaded) {
    console.log('[Modal]: Fonts not loaded');
    return null;
  }

  if (!selectedContainer) {
    console.log('[Modal]: No container data provided');
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Water Delivery</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Container Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Selected Container</Text>
              <View style={styles.containerInfo}>
                <Text style={styles.containerName}>{selectedContainer.name}</Text>
                <Text style={styles.containerDetail}>
                  Volume: {selectedContainer.selectedRate.volume}L
                </Text>
                <Text style={styles.containerDetail}>
                  Price: ₹{selectedContainer.selectedRate.price}
                </Text>
              </View>
            </View>

            {/* Delivery Address */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Delivery Address</Text>
              {defaultAddress ? (
                <View style={styles.addressCard}>
                  <Text style={styles.addressTitle}>{defaultAddress.title}</Text>
                  <Text style={styles.addressText}>{defaultAddress.address}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addAddressButton}
                  onPress={() => setShowAddAddress(true)}
                >
                  <Plus size={24} color="#FFA500" />
                  <Text style={styles.addAddressText}>Add Delivery Address</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Add Address Form */}
            {showAddAddress && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add New Address</Text>
                <View style={styles.form}>
                  <TextInput
                    style={styles.input}
                    placeholder="Address Title (e.g., Home, Office)"
                    placeholderTextColor="#666"
                    value={newAddress.title}
                    onChangeText={(text) => setNewAddress({ ...newAddress, title: text })}
                  />
                  <View style={styles.addressInputContainer}>
                    <TextInput
                      style={styles.addressInput}
                      placeholder="Full Address"
                      placeholderTextColor="#666"
                      value={newAddress.address}
                      onChangeText={(text) => setNewAddress({ ...newAddress, address: text })}
                      multiline
                    />
                    <TouchableOpacity
                      style={styles.locationButton}
                      onPress={getCurrentLocation}
                      disabled={loadingLocation}
                    >
                      {loadingLocation ? (
                        <ActivityIndicator color="#FFA500" />
                      ) : (
                        <Navigation size={24} color="#FFA500" />
                      )}
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleAddAddress}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Address</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentOptions}>
                <TouchableOpacity
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'wallet' && styles.paymentOptionSelected
                  ]}
                  onPress={() => setPaymentMethod('wallet')}
                >
                  <Wallet size={24} color={paymentMethod === 'wallet' ? '#FFA500' : '#666'} />
                  <View style={styles.paymentOptionInfo}>
                    <Text style={styles.paymentOptionTitle}>Wallet</Text>
                    <Text style={styles.walletBalance}>Balance: ₹{walletBalance}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {paymentMethod === 'wallet' && walletBalance < selectedContainer.selectedRate.price && (
                <TouchableOpacity
                  style={styles.addMoneyButton}
                  onPress={() => setShowAddMoney(true)}
                >
                  <Plus size={20} color="#FFA500" />
                  <Text style={styles.addMoneyText}>Add Money to Wallet</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Add Money Form */}
            {showAddMoney && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Add Money to Wallet</Text>
                <View style={styles.form}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Amount"
                    placeholderTextColor="#666"
                    value={moneyAmount}
                    onChangeText={setMoneyAmount}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleAddMoney}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#000000" />
                    ) : (
                      <Text style={styles.saveButtonText}>Add Money</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Confirm Order Button */}
            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
              onPress={handleConfirmOrder}
              disabled={loading || !defaultAddress || (paymentMethod === 'wallet' && walletBalance < selectedContainer.selectedRate.price)}
            >
              {loading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm Order</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#1a1f2b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  title: {
    fontSize: 24,
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
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 10,
  },
  containerInfo: {
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
  },
  containerName: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 5,
  },
  containerDetail: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  addressCard: {
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
  },
  addressTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 5,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFA500',
    borderStyle: 'dashed',
  },
  addAddressText: {
    color: '#FFA500',
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginLeft: 10,
  },
  form: {
    backgroundColor: '#242430',
    padding: 15,
    borderRadius: 12,
  },
  input: {
    backgroundColor: '#1a1f2b',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    marginBottom: 10,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressInput: {
    flex: 1,
    backgroundColor: '#1a1f2b',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
    marginRight: 10,
  },
  locationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#FFA500',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
  paymentOptions: {
    backgroundColor: '#242430',
    borderRadius: 12,
    overflow: 'hidden',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  paymentOptionSelected: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
  },
  paymentOptionInfo: {
    marginLeft: 15,
  },
  paymentOptionTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
  },
  walletBalance: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat-Regular',
    marginTop: 2,
  },
  addMoneyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  addMoneyText: {
    color: '#FFA500',
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    marginLeft: 5,
  },
  confirmButton: {
    backgroundColor: '#FFA500',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: 'Montserrat-SemiBold',
  },
});