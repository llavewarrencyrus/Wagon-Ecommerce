import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, SimpleLineIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';

export default function SellerAccount() {
  const router = useRouter();
  const { user, storeProfile, logout, toggleMode } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setModalVisible(false);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Logout Error', 'There was a problem logging out.');
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSwitchToBuyer = async () => {
    await toggleMode();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Store Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.storeLogoWrap}>
            {storeProfile?.store_logo ? (
              <Image
                source={{ uri: storeProfile.store_logo }}
                style={styles.storeLogo}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.storeLogo, styles.storeLogoPlaceholder]}>
                <Ionicons name="storefront" size={36} color="#5C3A2E" />
              </View>
            )}
          </View>

          <Text style={styles.storeName}>
            {storeProfile?.store_name || user?.username || 'My Merchant Store'}
          </Text>
          <Text style={styles.storeEmail}>{user?.email}</Text>

          {storeProfile?.store_description ? (
            <Text style={styles.storeBio} numberOfLines={2}>
              {storeProfile.store_description}
            </Text>
          ) : null}

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => router.push('/EditStoreScreen' as any)}
          >
            <Ionicons name="pencil" size={14} color="#5C3A2E" style={{ marginRight: 6 }} />
            <Text style={styles.editProfileBtnText}>Edit Store Info</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Switch Card */}
        <TouchableOpacity style={styles.switchModeCard} onPress={handleSwitchToBuyer}>
          <View style={styles.switchModeLeft}>
            <View style={styles.switchIconBox}>
              <Ionicons name="bag-handle-outline" size={22} color="#FFF" />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.switchModeTitle}>Switch to Buyer Mode</Text>
              <Text style={styles.switchModeSub}>Browse items and place personal orders</Text>
            </View>
          </View>
          <Ionicons name="swap-horizontal" size={22} color="#5C3A2E" />
        </TouchableOpacity>

        {/* Menu Options Group */}
        <Text style={styles.groupTitle}>Store Management</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/EditStoreScreen' as any)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="brush-outline" size={22} color="#5C3A2E" />
              <Text style={styles.menuItemText}>Store Branding & Logo</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/SellerOrders' as any)}
          >
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={22} color="#5C3A2E" />
              <Text style={styles.menuItemText}>Fulfillment & Courier Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/SellerProducts' as any)}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="pricetags-outline" size={22} color="#5C3A2E" />
              <Text style={styles.menuItemText}>Inventory & Catalog Management</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>
        </View>

        <Text style={styles.groupTitle}>Support & Account</Text>
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/HelpCenter')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#5C3A2E" />
              <Text style={styles.menuItemText}>Merchant Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.logoutMenuItem]}
            onPress={() => setModalVisible(true)}
          >
            <View style={styles.menuItemLeft}>
              <MaterialIcons name="logout" size={22} color="#D32F2F" />
              <Text style={[styles.menuItemText, { color: '#D32F2F' }]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal transparent animationType="fade" visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {loggingOut ? (
              <ActivityIndicator size="large" color="#5C3A2E" />
            ) : (
              <>
                <Text style={styles.modalTitle}>Confirm Logout</Text>
                <Text style={styles.modalMsg}>
                  Are you sure you want to log out of your merchant account?
                </Text>
                <View style={styles.modalBtnRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmBtn}
                    onPress={handleLogout}
                  >
                    <Text style={styles.modalConfirmBtnText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  storeLogoWrap: {
    marginBottom: 12,
  },
  storeLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#F5EBE6',
  },
  storeLogoPlaceholder: {
    backgroundColor: '#F5EBE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E1E17',
    marginBottom: 2,
  },
  storeEmail: {
    fontSize: 13,
    color: '#777',
    marginBottom: 8,
  },
  storeBio: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
    marginBottom: 12,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F5EBE6',
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5C3A2E',
  },
  switchModeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#5C3A2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  switchModeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5C3A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchModeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E1E17',
  },
  switchModeSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuContainer: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F4',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  logoutMenuItem: {
    borderBottomWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  modalMsg: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalConfirmBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
