import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import SegmentedControlTab from 'react-native-segmented-control-tab';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { getSellerMetrics } from '@/data/data';

export default function SellerIndex() {
  const router = useRouter();
  const { user, storeProfile } = useAuth();
  const screenWidth = Dimensions.get('window').width;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0); // 0: Daily, 1: Weekly, 2: Monthly, 3: Annual

  const [metrics, setMetrics] = useState<any>({
    totalRevenue: 0,
    todayRevenue: 0,
    totalOrders: 0,
    pendingCount: 0,
    processingCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
    totalProducts: 0,
    lowStockCount: 0,
    recentOrders: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await getSellerMetrics(user.id);
      if (data) {
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const periods = ['Daily', 'Weekly', 'Monthly', 'Annual'] as const;

  // Chart data computed dynamically based on totalRevenue and period
  const getLineData = () => {
    const rev = metrics.totalRevenue || 0;
    switch (selectedPeriod) {
      case 0: // Daily
        return {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              data: [
                Math.round(rev * 0.1),
                Math.round(rev * 0.15),
                Math.round(rev * 0.12),
                Math.round(rev * 0.22),
                Math.round(rev * 0.18),
                Math.round(rev * 0.28),
                Math.max(rev, 10),
              ],
              strokeWidth: 2,
            },
          ],
        };
      case 1: // Weekly
        return {
          labels: ['W1', 'W2', 'W3', 'W4'],
          datasets: [
            {
              data: [
                Math.round(rev * 0.4),
                Math.round(rev * 0.6),
                Math.round(rev * 0.8),
                Math.max(rev, 20),
              ],
              strokeWidth: 2,
            },
          ],
        };
      case 2: // Monthly
        return {
          labels: ['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'],
          datasets: [
            {
              data: [
                Math.round(rev * 0.3),
                Math.round(rev * 0.5),
                Math.round(rev * 0.7),
                Math.round(rev * 0.85),
                Math.round(rev * 0.95),
                Math.max(rev, 50),
              ],
              strokeWidth: 2,
            },
          ],
        };
      case 3: // Annual
      default:
        return {
          labels: ['2023', '2024', '2025', '2026'],
          datasets: [
            {
              data: [
                Math.round(rev * 0.2),
                Math.round(rev * 0.5),
                Math.round(rev * 0.8),
                Math.max(rev, 100),
              ],
              strokeWidth: 2,
            },
          ],
        };
    }
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(92, 58, 46, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(80, 80, 80, ${opacity})`,
    style: {
      borderRadius: 14,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#5C3A2E',
    },
    propsForVerticalLabels: {
      fontSize: 10,
    },
    propsForHorizontalLabels: {
      fontSize: 10,
    },
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5C3A2E']}
          />
        }
      >
        {/* Store Welcome Banner */}
        <View style={styles.welcomeBanner}>
          <View>
            <Text style={styles.welcomeGreeting}>Merchant Center</Text>
            <Text style={styles.storeName}>
              {storeProfile?.store_name || user?.username ? `${storeProfile?.store_name || user?.username}'s Store` : 'My Merchant Hub'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={() => router.push('/SellerAccount')}
          >
            <Ionicons name="storefront-outline" size={18} color="#5C3A2E" />
            <Text style={styles.switchModeBtnText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#5C3A2E" />
            <Text style={styles.loadingText}>Refreshing live dashboard...</Text>
          </View>
        ) : (
          <>
            {/* Quick KPI Overview Cards */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiPrimaryLabel}>Total Revenue</Text>
                  <Ionicons name="wallet-outline" size={20} color="#FFF" />
                </View>
                <Text style={styles.kpiPrimaryValue}>${metrics.totalRevenue.toFixed(2)}</Text>
                <Text style={styles.kpiPrimarySub}>
                  Today: +${metrics.todayRevenue.toFixed(2)}
                </Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={styles.kpiHeader}>
                  <Text style={styles.kpiLabel}>Total Orders</Text>
                  <Ionicons name="receipt-outline" size={18} color="#5C3A2E" />
                </View>
                <Text style={styles.kpiValue}>{metrics.totalOrders}</Text>
                <Text style={styles.kpiSub}>Lifetime orders</Text>
              </View>
            </View>

            {/* Action Items Bar (To-Dos for Merchant) */}
            <Text style={styles.sectionHeader}>Pending Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={[styles.actionCard, metrics.pendingCount > 0 && styles.actionCardAlert]}
                onPress={() => router.push('/SellerOrders' as any)}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#FFF3CD' }]}>
                  <Ionicons name="cube-outline" size={20} color="#856404" />
                </View>
                <Text style={styles.actionCount}>{metrics.pendingCount}</Text>
                <Text style={styles.actionLabel}>To Pack</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/SellerOrders' as any)}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#CCE5FF' }]}>
                  <FontAwesome5 name="shipping-fast" size={16} color="#004085" />
                </View>
                <Text style={styles.actionCount}>{metrics.processingCount}</Text>
                <Text style={styles.actionLabel}>To Ship</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, metrics.lowStockCount > 0 && styles.actionCardWarning]}
                onPress={() => router.push('/SellerProducts' as any)}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="alert-circle-outline" size={20} color="#D32F2F" />
                </View>
                <Text style={styles.actionCount}>{metrics.lowStockCount}</Text>
                <Text style={styles.actionLabel}>Low Stock</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/SellerProducts' as any)}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="pricetags-outline" size={20} color="#2E7D32" />
                </View>
                <Text style={styles.actionCount}>{metrics.totalProducts}</Text>
                <Text style={styles.actionLabel}>Products</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Operations Shortcuts */}
            <View style={styles.quickOpsRow}>
              <TouchableOpacity
                style={styles.quickOpBtn}
                onPress={() => router.push('/AddProduct')}
              >
                <Ionicons name="add-circle" size={20} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.quickOpBtnText}>Add Product</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickOpBtn, styles.quickOpBtnSecondary]}
                onPress={() => router.push('/SellerOrders' as any)}
              >
                <Ionicons name="list" size={20} color="#5C3A2E" style={{ marginRight: 6 }} />
                <Text style={styles.quickOpBtnSecondaryText}>View Orders</Text>
              </TouchableOpacity>
            </View>

            {/* Sales Growth Chart */}
            <View style={styles.chartSection}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Sales Growth</Text>
              </View>

              <View style={styles.segmentedControlContainer}>
                <SegmentedControlTab
                  values={['Daily', 'Weekly', 'Monthly', 'Annual']}
                  selectedIndex={selectedPeriod}
                  onTabPress={(idx) => setSelectedPeriod(idx)}
                  tabsContainerStyle={styles.segmentedControl}
                  tabStyle={{ backgroundColor: '#F0F0F0', borderColor: '#DDD' }}
                  activeTabStyle={{ backgroundColor: '#5C3A2E' }}
                  tabTextStyle={{ color: '#555', fontSize: 12 }}
                  activeTabTextStyle={{ color: '#FFF', fontWeight: 'bold' }}
                />
              </View>

              <LineChart
                data={getLineData()}
                width={screenWidth - 48}
                height={200}
                chartConfig={chartConfig}
                bezier
                segments={4}
                style={styles.chart}
                formatYLabel={(val) => `$${val}`}
              />
            </View>

            {/* Recent Orders Snapshot */}
            {metrics.recentOrders && metrics.recentOrders.length > 0 && (
              <View style={styles.recentOrdersSection}>
                <View style={styles.recentOrdersHeader}>
                  <Text style={styles.chartTitle}>Recent Orders</Text>
                  <TouchableOpacity onPress={() => router.push('/SellerOrders' as any)}>
                    <Text style={styles.viewAllLink}>View All &gt;</Text>
                  </TouchableOpacity>
                </View>

                {metrics.recentOrders.map((ord: any) => {
                  const prod = ord.product_variant?.products;
                  const price = prod ? prod.product_price * (1 - (prod.product_discount || 0) / 100) : 0;
                  return (
                    <View key={ord.id} style={styles.recentOrderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recentOrderTitle} numberOfLines={1}>
                          {prod?.product_name || 'Item'}
                        </Text>
                        <Text style={styles.recentOrderSub}>
                          Buyer: {ord.users?.username || 'Customer'} • #{ord.id.slice(0, 8)}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.recentOrderPrice}>${price.toFixed(2)}</Text>
                        <Text style={[styles.recentOrderStatus, { color: ord.status === 'delivered' ? '#2E7D32' : '#E65100' }]}>
                          {ord.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  welcomeGreeting: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E1E17',
    marginTop: 2,
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EBE6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  switchModeBtnText: {
    fontSize: 13,
    color: '#5C3A2E',
    fontWeight: '600',
    marginLeft: 6,
  },
  loadingBox: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#777',
    fontSize: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginLeft: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  kpiCardPrimary: {
    flex: 1.2,
    backgroundColor: '#5C3A2E',
    marginLeft: 0,
    marginRight: 6,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  kpiPrimaryLabel: {
    fontSize: 12,
    color: '#E0D0C8',
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E1E17',
  },
  kpiPrimaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  kpiSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  kpiPrimarySub: {
    fontSize: 11,
    color: '#D4C0B5',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  actionCardAlert: {
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  actionCardWarning: {
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  actionLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  quickOpsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  quickOpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5C3A2E',
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 6,
  },
  quickOpBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickOpBtnSecondary: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#5C3A2E',
    marginRight: 0,
    marginLeft: 6,
  },
  quickOpBtnSecondaryText: {
    color: '#5C3A2E',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartSection: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  chartHeader: {
    marginBottom: 10,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  segmentedControlContainer: {
    marginBottom: 12,
  },
  segmentedControl: {
    borderRadius: 8,
    height: 34,
  },
  chart: {
    borderRadius: 10,
    marginTop: 4,
  },
  recentOrdersSection: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  recentOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 13,
    color: '#5C3A2E',
    fontWeight: '600',
  },
  recentOrderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  recentOrderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recentOrderSub: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  recentOrderPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5C3A2E',
  },
  recentOrderStatus: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
