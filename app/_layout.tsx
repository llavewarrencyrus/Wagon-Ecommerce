import React, { useEffect, useState } from "react";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { View, Dimensions, SafeAreaView, TouchableOpacity, Platform } from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import "react-native-reanimated";
import { AuthProvider } from "@/context/AuthContext";
import { NetworkProvider } from "@/components/NetworkContext";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts } from "expo-font";
import DummySearch from "@/components/DummySearch";
import { CartProvider } from "@/context/CartProvider";
import { AddressProvider } from "@/context/AddressProvider";

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get("window");

// Android Device Simulator Presets (Width × Height in dp)
interface AndroidPreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

const ANDROID_PRESETS: AndroidPreset[] = [
  { id: "standard", name: "Standard Android (Google Pixel · 412 × 915)", width: 412, height: 915 },
  { id: "compact", name: "Small Android (Compact · 360 × 640)", width: 360, height: 640 },
  { id: "large", name: "Large Android (Samsung Galaxy Ultra · 440 × 950)", width: 440, height: 950 },
  { id: "tablet", name: "Android Tablet (Galaxy Tab · 800 × 1280)", width: 800, height: 1280 },
];

function WebSimulator({ children }: { children: React.ReactNode }) {
  const [selectedPreset, setSelectedPreset] = useState<AndroidPreset>(ANDROID_PRESETS[0]);

  return (
    <div style={webStyles.shell}>
      {/* Top Controls Toolbar */}
      <div style={webStyles.toolbar}>
        <div style={webStyles.brand}>
          <span style={webStyles.brandDot} />
          <span style={webStyles.brandTitle}>Wagon E-Commerce</span>
          <span style={webStyles.badge}>Android Simulator</span>
        </div>

        <div style={webStyles.controls}>
          <label
            style={webStyles.label}
            htmlFor="device-preset-select">
            Device:
          </label>
          <select
            id="device-preset-select"
            value={selectedPreset.id}
            onChange={(e) => {
              const found = ANDROID_PRESETS.find((p) => p.id === e.target.value);
              if (found) setSelectedPreset(found);
            }}
            style={webStyles.select}>
            {ANDROID_PRESETS.map((preset) => (
              <option
                key={preset.id}
                value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Android Device Frame */}
      <div
        style={{
          ...webStyles.deviceFrame,
          width: `${selectedPreset.width}px`,
          height: `${selectedPreset.height}px`,
        }}>
        {/* Punch-hole Camera Cutout */}
        <div style={webStyles.cameraNotch} />

        {/* Screen Viewport */}
        <div style={webStyles.screen}>{children}</div>
      </div>
    </div>
  );
}

const webStyles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    width: "100vw",
    backgroundColor: "#0f172a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 16px",
    boxSizing: "border-box",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    overflowY: "auto",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "820px",
    marginBottom: "16px",
    padding: "10px 18px",
    backgroundColor: "rgba(30, 41, 59, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "14px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
    boxSizing: "border-box",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  brandDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#10b981",
    boxShadow: "0 0 10px #10b981",
  },
  brandTitle: {
    color: "#f8fafc",
    fontSize: "14px",
    fontWeight: 700,
    letterSpacing: "0.3px",
  },
  badge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    color: "#60a5fa",
    fontSize: "11px",
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: "6px",
    border: "1px solid rgba(59, 130, 246, 0.3)",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  label: {
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: 500,
  },
  select: {
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "6px 12px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  deviceFrame: {
    position: "relative",
    maxWidth: "96vw",
    maxHeight: "calc(100vh - 90px)",
    borderRadius: "28px",
    border: "10px solid #1e293b",
    backgroundColor: "#000000",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxSizing: "border-box",
  },
  cameraNotch: {
    position: "absolute",
    top: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#0a0a0a",
    border: "1px solid #1e293b",
    zIndex: 9999,
    pointerEvents: "none",
  },
  screen: {
    flex: 1,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
};

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const appContent = (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <SafeAreaView style={{ flex: 1 }}>
          <NetworkProvider>
            <CartProvider>
              <AddressProvider>
                <Stack>
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="+not-found" />

                  {/* Auth Screens */}
                  <Stack.Screen name="(auth)/LoginScreen" />
                  <Stack.Screen
                    name="(auth)/SignupScreen"
                    options={{ animation: "fade" }}
                  />
                  <Stack.Screen
                    name="(auth)/CurrentPasswordScreen"
                    options={{ headerTitle: "Current Password" }}
                  />
                  <Stack.Screen
                    name="(auth)/ChangePasswordScreen"
                    options={{ headerTitle: "Change Password" }}
                  />

                  {/* Buyer Screens */}
                  <Stack.Screen name="(buyer)/Category" />
                  <Stack.Screen
                    name="(buyer)/Cart"
                    options={{ headerShadowVisible: false }}
                  />
                  <Stack.Screen name="(buyer)/Account" />
                  <Stack.Screen
                    name="(buyer)/ProductScreen"
                    options={{
                      headerTitle: " ",
                      headerTransparent: true,
                      headerBackVisible: false,
                      headerLeft: () => (
                        <TouchableOpacity
                          onPress={() => {
                            if (router.canGoBack()) {
                              router.back();
                            } else {
                              router.replace("/(tabs)");
                            }
                          }}
                          style={{
                            backgroundColor: Colors.tertiary,
                            padding: 5,
                            marginRight: 25,
                            borderRadius: 20,
                          }}>
                          <AntDesign
                            name="arrowleft"
                            size={24}
                            color="black"
                          />
                        </TouchableOpacity>
                      ),
                      headerRight: () => (
                        <TouchableOpacity
                          onPress={() => router.push("/Cart")}
                          style={{ backgroundColor: Colors.tertiary, padding: 5, borderRadius: 20 }}>
                          <Ionicons
                            name="cart-outline"
                            size={24}
                            color="black"
                          />
                        </TouchableOpacity>
                      ),
                    }}
                  />
                  <Stack.Screen
                    name="(buyer)/SearchScreen"
                    options={{
                      headerBackVisible: false,
                      headerLeft: () => (
                        <TouchableOpacity
                          onPress={() => {
                            if (router.canGoBack()) {
                              router.back();
                            } else {
                              router.replace("/(tabs)");
                            }
                          }}
                          style={{ padding: 5, marginRight: 25, borderRadius: 20 }}>
                          <AntDesign
                            name="arrowleft"
                            size={24}
                            color="black"
                          />
                        </TouchableOpacity>
                      ),
                      animation: "fade",
                    }}
                  />
                  <Stack.Screen name="(buyer)/ResultScreen" />
                  <Stack.Screen
                    name="(buyer)/EditProfileScreen"
                    options={{
                      title: "Edit Profile",
                      headerShadowVisible: false,
                    }}
                  />
                  <Stack.Screen
                    name="(buyer)/NewArrival"
                    options={{
                      headerTitle: "",
                      headerLeft: () => (
                        <TouchableOpacity
                          onPress={() => {
                            if (router.canGoBack()) {
                              router.back();
                            } else {
                              router.replace("/(tabs)");
                            }
                          }}
                          style={{ backgroundColor: Colors.tertiary, padding: 5, marginRight: 25, borderRadius: 20 }}>
                          <AntDesign
                            name="arrowleft"
                            size={24}
                            color="black"
                          />
                        </TouchableOpacity>
                      ),
                      headerTransparent: true,
                    }}
                  />
                  <Stack.Screen
                    name="(buyer)/TopSales"
                    options={{
                      headerTitle: "",
                      headerLeft: () => (
                        <TouchableOpacity
                          onPress={() => {
                            if (router.canGoBack()) {
                              router.back();
                            } else {
                              router.replace("/(tabs)");
                            }
                          }}
                          style={{ backgroundColor: Colors.tertiary, padding: 5, marginRight: 25, borderRadius: 20 }}>
                          <AntDesign
                            name="arrowleft"
                            size={24}
                            color="black"
                          />
                        </TouchableOpacity>
                      ),
                      headerTransparent: true,
                    }}
                  />
                  <Stack.Screen name="(buyer)/HelpCenter" />
                  <Stack.Screen name="(buyer)/CheckOutScreen" options={{ title: "Checkout" }} />
                  <Stack.Screen name="(buyer)/OrdersScreen" options={{ title: "My Orders" }} />
                  <Stack.Screen name="(buyer)/AddressScreen" options={{ title: "My Addresses" }} />
                  <Stack.Screen name="(buyer)/AddEditAddress" options={{ title: "Address Details" }} />

                  {/* Seller Screens */}
                  <Stack.Screen
                    name="(seller)/SellerOrders"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(seller)/SellerProducts"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(seller)/AddProduct"
                    options={{ title: "Add New Product" }}
                  />
                  <Stack.Screen
                    name="(seller)/UpdateProduct"
                    options={{ title: "Edit Product" }}
                  />
                  <Stack.Screen
                    name="(seller)/EditStoreScreen"
                    options={{ headerShown: false }}
                  />

                  {/* Shared Screens */}
                  <Stack.Screen name="(shared)/Chat" />
                  <Stack.Screen
                    name="(shared)/SellerChat"
                    options={{ title: "Customer Chat" }}
                  />
                  <Stack.Screen name="(shared)/UnderConstruction" />
                </Stack>
              </AddressProvider>
            </CartProvider>
          </NetworkProvider>
        </SafeAreaView>
      </ThemeProvider>
    </AuthProvider>
  );

  if (Platform.OS === "web") {
    return <WebSimulator>{appContent}</WebSimulator>;
  }

  return appContent;
}
