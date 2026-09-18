import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { useAuth } from "@/context/AuthContext";
import { useAddress } from "@/context/AddressProvider";
import { AddressProps } from "@/types/types";
import { getAddress, saveAddress, getAddresses } from "@/data/data";
import { Colors } from "@/constants/Colors";
import Loading from "@/components/Loading";
import CustomAlertModal, { ModalButton } from "@/components/common/CustomAlertModal";

const PRESET_LABELS = ["Home", "Work", "Office", "Other"];

const AddEditAddressScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const { addresses, setAddresses } = useAddress();
  const params = useLocalSearchParams<{ id?: string }>();
  const addressId = typeof params.id === "string" ? params.id : undefined;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    buttons?: ModalButton[];
  }>({ visible: false, title: "", message: "" });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [houseNumberStreet, setHouseNumberStreet] = useState("");
  const [barangay, setBarangay] = useState("");
  const [cityMunicipality, setCityMunicipality] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [title, setTitle] = useState("Home");
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (addressId) {
      loadAddress(addressId);
    } else {
      // If user has no addresses yet, default to prefer: true
      if (addresses.length === 0) {
        setIsDefault(true);
      }
    }
  }, [addressId]);

  const loadAddress = async (id: string) => {
    setFetching(true);
    const data = await getAddress(id);
    setFetching(false);

    if (data) {
      setName(data.name || "");
      setPhone(data.phone || "");
      setHouseNumberStreet(data.house_number_street || "");
      setBarangay(data.barangay || "");
      setCityMunicipality(data.city_municipality || "");
      setProvince(data.province || "");
      setPostalCode(data.postal_code || "");
      setTitle(data.title || "Home");
      setIsDefault(data.prefer === true);
    } else {
      setAlertModal({
        visible: true,
        title: "Error",
        message: "Failed to load address details.",
        buttons: [{ text: "OK", onPress: () => router.back() }],
      });
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      setAlertModal({
        visible: true,
        title: "Missing Field",
        message: "Please enter the recipient full name.",
      });
      return;
    }
    if (!phone.trim()) {
      setAlertModal({
        visible: true,
        title: "Missing Field",
        message: "Please enter a valid contact phone number.",
      });
      return;
    }
    if (!houseNumberStreet.trim()) {
      setAlertModal({
        visible: true,
        title: "Missing Field",
        message: "Please enter the house number, building, or street name.",
      });
      return;
    }
    if (!barangay.trim()) {
      setAlertModal({
        visible: true,
        title: "Missing Field",
        message: "Please enter the barangay.",
      });
      return;
    }
    if (!cityMunicipality.trim()) {
      setAlertModal({
        visible: true,
        title: "Missing Field",
        message: "Please enter the city or municipality.",
      });
      return;
    }
    if (!province.trim()) {
      setAlertModal({
        visible: true,
        title: "Missing Field",
        message: "Please enter the province.",
      });
      return;
    }

    setLoading(true);

    const addressPayload: Partial<AddressProps> = {
      name: name.trim(),
      phone: phone.trim(),
      house_number_street: houseNumberStreet.trim(),
      barangay: barangay.trim(),
      city_municipality: cityMunicipality.trim(),
      province: province.trim(),
      postal_code: postalCode.trim(),
      title: title.trim() || "Home",
      prefer: isDefault,
    };

    const saved = await saveAddress(addressPayload, addressId, userId);
    setLoading(false);

    if (saved) {
      // Refresh global address list in context
      if (userId) {
        const refreshed = await getAddresses(userId);
        setAddresses(refreshed);
      }
      setAlertModal({
        visible: true,
        title: "Success",
        message: addressId ? "Address updated successfully." : "New address added successfully.",
        buttons: [{ text: "OK", onPress: () => router.back() }],
      });
    } else {
      setAlertModal({
        visible: true,
        title: "Error",
        message: "Failed to save address. Please check your connection and try again.",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen
        options={{
          headerTitle: addressId ? "Edit Address" : "Add New Address",
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
        }}
      />

      {fetching ? (
        <Loading />
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Address Label Selector */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Address Label</Text>
            <View style={styles.labelChipsRow}>
              {PRESET_LABELS.map((lbl) => {
                const active = title.toLowerCase() === lbl.toLowerCase();
                return (
                  <TouchableOpacity
                    key={lbl}
                    style={[styles.labelChip, active && styles.labelChipActive]}
                    onPress={() => setTitle(lbl)}>
                    <Ionicons
                      name={
                        lbl === "Home"
                          ? "home-outline"
                          : lbl === "Work" || lbl === "Office"
                            ? "business-outline"
                            : "location-outline"
                      }
                      size={14}
                      color={active ? "#fff" : "#6b7280"}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.labelChipText, active && styles.labelChipTextActive]}>{lbl}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Contact Details Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Contact Information</Text>

            <View style={styles.inputWrap}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#9ca3af"
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Full Name (e.g., Juan Dela Cruz)"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons
                name="call-outline"
                size={18}
                color="#9ca3af"
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Mobile Number (e.g., 0917 123 4567)"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Delivery Address Section (Philippine Standard) */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Delivery Address</Text>

            <View style={styles.inputWrap}>
              <Ionicons
                name="home-outline"
                size={18}
                color="#9ca3af"
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                value={houseNumberStreet}
                onChangeText={setHouseNumberStreet}
                placeholder="House / Unit No., Building, Street Name"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons
                name="map-outline"
                size={18}
                color="#9ca3af"
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                value={barangay}
                onChangeText={setBarangay}
                placeholder="Barangay"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputWrap, { flex: 1, marginRight: 8 }]}>
                <Ionicons
                  name="business-outline"
                  size={18}
                  color="#9ca3af"
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.input}
                  value={cityMunicipality}
                  onChangeText={setCityMunicipality}
                  placeholder="City / Municipality"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              <View style={[styles.inputWrap, { flex: 1 }]}>
                <Ionicons
                  name="navigate-outline"
                  size={18}
                  color="#9ca3af"
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.input}
                  value={province}
                  onChangeText={setProvince}
                  placeholder="Province"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons
                name="mail-outline"
                size={18}
                color="#9ca3af"
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.input}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Postal Code (e.g., 1000)"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Preferences Section */}
          <View style={[styles.sectionCard, styles.defaultToggleCard]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.toggleTitle}>Set as Default Delivery Address</Text>
              <Text style={styles.toggleSubtitle}>
                Automatically select this address during checkout for faster orders.
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#d1d5db", true: Colors.primary }}
              thumbColor={isDefault ? "#fff" : "#f4f3f4"}
              onValueChange={setIsDefault}
              value={isDefault}
            />
          </View>

          {/* Save Action Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator
                color="#fff"
                size="small"
              />
            ) : (
              <>
                <Feather
                  name="check"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.saveBtnText}>{addressId ? "Update Address" : "Save Address"}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Action Feedback Modal */}
      <CustomAlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        buttons={alertModal.buttons}
        onClose={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
};

export default AddEditAddressScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8f8f9",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.subtitle,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.title,
    marginBottom: 12,
  },
  labelChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  labelChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 6,
  },
  labelChipActive: {
    backgroundColor: Colors.primary,
  },
  labelChipText: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "600",
  },
  labelChipTextActive: {
    color: "#fff",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 48,
  },
  fieldIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: "#1f2937",
  },
  rowInputs: {
    flexDirection: "row",
  },
  defaultToggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.title,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: Colors.subtitle,
    lineHeight: 16,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 28,
    marginTop: 8,
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
