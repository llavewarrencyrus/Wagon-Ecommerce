import React, { useEffect, useState } from "react";
import { useNavigation, useRouter } from "expo-router";
import {
  ActivityIndicator,
  InteractionManager,
  StyleSheet,
  Image,
  Text,
  View,
  Alert,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ScrollView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/Colors";
import { useIsFocused } from "@react-navigation/native";
import { Entypo, Octicons, FontAwesome5, MaterialIcons, Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import Loading from "@/components/Loading";

import NetworkIssue from "@/components/NetworkIssue";
import { useNetwork } from "@/components/NetworkContext";

export default function Account() {
  const { isConnected, refreshNetworkStatus } = useNetwork();

  if (!isConnected) {
    return <NetworkIssue onRetry={refreshNetworkStatus} />;
  }
  const navigation = useNavigation();
  const router = useRouter();
  const { isAuthenticated, isSeller, logout, toggleMode, registerAsSeller } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [refreshing, setRefreshing] = useState(false); // State for refreshing
  const isFocused = useIsFocused();

  const fetchUserData = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select(`username,email,profile_picture`)
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user data:", error);
    } else {
      setNickname(data?.username);
      setEmail(data?.email);
      setProfilePic(data?.profile_picture);
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData(); // Call the fetch function
    setRefreshing(false);
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/LoginScreen");
    } else {
      fetchUserData();
    }
  }, [isAuthenticated]);

  const checkUser = async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData?.user) {
      navigation.goBack();
      return;
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      logout();
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Logout Error", "There was a problem logging out.");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <ScrollView
          style={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }>
          <View style={styles.profileSection}>
            {profilePic ? (
              <Image
                style={styles.profileImage}
                source={{ uri: profilePic }}
              />
            ) : (
              <Image
                style={styles.profileImage}
                source={require("@/assets/images/user.png")}
              />
            )}

            <Text style={styles.profileName}>{nickname}</Text>
            <Text style={styles.profileEmail}>{email}</Text>
          </View>
          <View style={styles.optionsContainer}>
            {/* Quick Orders Status Tracker */}
            <View style={styles.ordersSectionCard}>
              <View style={styles.ordersSectionHeader}>
                <Text style={styles.ordersSectionTitle}>My Orders</Text>
                <TouchableOpacity onPress={() => router.push("/OrdersScreen")}>
                  <Text style={styles.viewAllOrdersText}>View All {'>'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.orderShortcutsRow}>
                <TouchableOpacity
                  style={styles.orderShortcutBtn}
                  onPress={() => router.push({ pathname: "/OrdersScreen", params: { initialStatus: "pending" } })}
                >
                  <View style={styles.shortcutIconWrap}>
                    <Ionicons name="card-outline" size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.shortcutLabel}>To Pay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.orderShortcutBtn}
                  onPress={() => router.push({ pathname: "/OrdersScreen", params: { initialStatus: "processing" } })}
                >
                  <View style={styles.shortcutIconWrap}>
                    <Ionicons name="cube-outline" size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.shortcutLabel}>Processing</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.orderShortcutBtn}
                  onPress={() => router.push({ pathname: "/OrdersScreen", params: { initialStatus: "shipped" } })}
                >
                  <View style={styles.shortcutIconWrap}>
                    <Ionicons name="car-outline" size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.shortcutLabel}>To Receive</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.orderShortcutBtn}
                  onPress={() => router.push({ pathname: "/OrdersScreen", params: { initialStatus: "delivered" } })}
                >
                  <View style={styles.shortcutIconWrap}>
                    <Ionicons name="checkmark-done-circle-outline" size={22} color={Colors.primary} />
                  </View>
                  <Text style={styles.shortcutLabel}>Completed</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Seller Center & Mode Switch */}
            <TouchableOpacity
              onPress={async () => {
                if (isSeller) {
                  await toggleMode();
                  router.replace("/(tabs)");
                } else {
                  Alert.alert(
                    "Become a Seller",
                    "Would you like to activate your seller account and start listing products on Wagon?",
                    [
                      { text: "Later", style: "cancel" },
                      {
                        text: "Activate Seller Account",
                        onPress: async () => {
                          await registerAsSeller({ store_name: `${nickname || "My"} Store` });
                          router.replace("/(tabs)");
                        },
                      },
                    ]
                  );
                }
              }}
              style={styles.sellerBannerItem}>
              <View style={styles.sellerBannerLeft}>
                <View style={styles.sellerBannerIcon}>
                  <Ionicons
                    name="storefront"
                    size={20}
                    color="#FFF"
                  />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.sellerBannerTitle}>{isSeller ? "Switch to Seller Mode" : "Become a Seller"}</Text>
                  <Text style={styles.sellerBannerSub}>
                    {isSeller ? "Manage orders, inventory & live sales" : "Open your store and start selling"}
                  </Text>
                </View>
              </View>
              <Entypo
                name="chevron-right"
                size={20}
                color="#5C3A2E"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/OrdersScreen")}
              style={styles.optionItem}>
              <View style={styles.option}>
                <View style={styles.optionApart}>
                  <SimpleLineIcons
                    name="bag"
                    size={24}
                    color="#333"
                  />
                  <Text style={styles.optionText}>My Orders</Text>
                </View>
                <Entypo
                  name="chevron-right"
                  size={24}
                  color="#333"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/EditProfileScreen")}
              style={styles.optionItem}>
              <View style={styles.option}>
                <View style={styles.optionApart}>
                  <Ionicons
                    name="person-outline"
                    size={24}
                    color="#333"
                  />
                  <Text style={styles.optionText}>Edit Profile</Text>
                </View>
                <Entypo
                  name="chevron-right"
                  size={24}
                  color="#333"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/AddressScreen")}
              style={styles.optionItem}>
              <View style={styles.option}>
                <View style={styles.optionApart}>
                  <SimpleLineIcons
                    name="location-pin"
                    size={24}
                    color="#333"
                  />
                  <Text style={styles.optionText}>Address</Text>
                </View>
                <Entypo
                  name="chevron-right"
                  size={24}
                  color="#333"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/HelpCenter")}
              style={styles.optionItem}>
              <View style={styles.option}>
                <View style={styles.optionApart}>
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color="#333"
                  />
                  <Text style={styles.optionText}>Help Center</Text>
                </View>
                <Entypo
                  name="chevron-right"
                  size={24}
                  color="#333"
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={styles.logoutoptionItem}>
              <View style={styles.logoutoptionApart}>
                <MaterialIcons
                  name="logout"
                  size={24}
                  color="red"
                />
                <Text style={styles.logoutoptionText}>Logout</Text>
              </View>
            </TouchableOpacity>
          </View>
          <Modal
            transparent={true}
            animationType="fade"
            visible={modalVisible}>
            <View style={styles.overlay}>
              <View style={styles.modalContainer}>
                {loggingOut ? (
                  <ActivityIndicator
                    size="large"
                    color={Colors.primary}
                    style={{ margin: "auto" }}
                  />
                ) : (
                  <>
                    <Text style={styles.title}>Confirm Logout</Text>
                    <Text style={styles.message}>Are you sure you want to log out?</Text>
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={handleLogout}>
                        <Text style={styles.buttonText}>Yes, Logout</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setModalVisible(false)}>
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </Modal>
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F4F4",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 18,
    color: Colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  profileSection: {
    padding: 16,
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  profileEmail: {
    fontSize: 16,
    color: "#666",
  },
  optionsContainer: {
    padding: 0,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.tertiary,
  },
  option: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logoutoptionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomColor: Colors.tertiary,
  },
  logoutoptionApart: {
    flexDirection: "row",
  },
  logoutoptionText: {
    fontSize: 16,
    marginLeft: 16,
    color: "red",
  },
  optionApart: {
    flexDirection: "row",
  },
  optionText: {
    fontSize: 16,
    marginLeft: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  buttonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
  },
  sellerBannerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F5EBE6",
    borderBottomWidth: 1,
    borderBottomColor: "#E6D8D0",
    marginBottom: 4,
  },
  sellerBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sellerBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#5C3A2E",
    justifyContent: "center",
    alignItems: "center",
  },
  sellerBannerTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#2E1E17",
  },
  sellerBannerSub: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  ordersSectionCard: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 6,
  },
  ordersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  ordersSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.title,
  },
  viewAllOrdersText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  orderShortcutsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  orderShortcutBtn: {
    alignItems: "center",
    width: 70,
  },
  shortcutIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f7f1ec",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  shortcutLabel: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
    textAlign: "center",
  },
});
