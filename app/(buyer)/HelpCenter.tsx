import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { SCREEN_WIDTH as width } from '@/constants/Layout';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FAQCategory = 'all' | 'shipping' | 'returns' | 'payment' | 'tracking' | 'account';

interface FAQItem {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
  icon: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    category: 'shipping',
    question: 'How much does standard delivery cost?',
    answer:
      'Standard shipping within Metro Manila and Luzon is ₱50. We also offer FREE shipping on orders totaling ₱1,500 or more! Deliveries to Visayas and Mindanao typically take 4–7 business days.',
    icon: 'cube-outline',
  },
  {
    id: '2',
    category: 'shipping',
    question: 'How long will it take for my package to arrive?',
    answer:
      'Once a merchant dispatches your package:\n• Metro Manila: 1–3 business days\n• Luzon Provincial: 3–5 business days\n• Visayas & Mindanao: 5–8 business days\nYou can view real-time status updates in your "My Orders" tab.',
    icon: 'time-outline',
  },
  {
    id: '3',
    category: 'returns',
    question: 'What is Wagon’s Return & Refund policy?',
    answer:
      'You can request a return or replacement within 7 calendar days from the date of delivery if the item is damaged, defective, or incorrect. Items must be in original condition with tags and packaging intact.',
    icon: 'refresh-circle-outline',
  },
  {
    id: '4',
    category: 'returns',
    question: 'How long does refund processing take?',
    answer:
      'Once the merchant receives and inspects the returned parcel, refunds are processed within 24–48 hours for GCash / E-Wallet and 3–5 banking days for Credit / Debit Card payments.',
    icon: 'cash-outline',
  },
  {
    id: '5',
    category: 'payment',
    question: 'What payment methods are supported on Wagon?',
    answer:
      'We support:\n• Cash on Delivery (COD) nationwide\n• GCash & Maya E-Wallets\n• Credit and Debit Cards (Visa, Mastercard)\nAll transactions are encrypted and processed securely.',
    icon: 'card-outline',
  },
  {
    id: '6',
    category: 'payment',
    question: 'Can I cancel an order after placing it?',
    answer:
      'Yes! You can cancel any order while its status is still "Pending" or "To Pay". Once the seller accepts and prepares the package ("Processing" or "Shipped"), cancellation is locked.',
    icon: 'close-circle-outline',
  },
  {
    id: '7',
    category: 'tracking',
    question: 'How do I track my order?',
    answer:
      'Navigate to your Account tab and tap "My Orders". Select your active order to view its status badge, courier assignment (e.g., J&T Express, Flash Express), and tracking code.',
    icon: 'navigate-outline',
  },
  {
    id: '8',
    category: 'account',
    question: 'How do I change my delivery address?',
    answer:
      'You can add, edit, and select your default delivery address in Account > My Addresses. You can also change your destination address right on the Checkout screen before placing an order.',
    icon: 'location-outline',
  },
  {
    id: '9',
    category: 'account',
    question: 'How do I become a seller on Wagon?',
    answer:
      'Go to your Account tab and tap the "Become a Seller" banner. Once activated, you can toggle seamlessly into Seller Center mode to list products and fulfill customer orders.',
    icon: 'storefront-outline',
  },
];

const CATEGORIES: { id: FAQCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'All FAQs', icon: 'apps-outline' },
  { id: 'shipping', label: 'Shipping', icon: 'car-outline' },
  { id: 'returns', label: 'Returns', icon: 'repeat-outline' },
  { id: 'payment', label: 'Payment', icon: 'card-outline' },
  { id: 'tracking', label: 'Tracking', icon: 'locate-outline' },
  { id: 'account', label: 'Account', icon: 'person-outline' },
];

const HelpCenterScreen: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleAccordion = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@wagon.com?subject=Wagon Customer Support Inquiry');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+63281234567');
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerTitle: 'Help Center',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Banner */}
        <View style={styles.searchBanner}>
          <Text style={styles.bannerTitle}>How can we help you?</Text>
          <Text style={styles.bannerSubtitle}>Search our knowledge base or browse popular topics below.</Text>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search topics, questions, keywords..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter Pills */}
        <View style={styles.categoryScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsRow}>
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catPill, active && styles.catPillActive]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={15}
                    color={active ? '#fff' : '#6b7280'}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.catPillText, active && styles.catPillTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* FAQ Accordion List */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionHeading}>
            Frequently Asked Questions {filteredFAQs.length > 0 ? `(${filteredFAQs.length})` : ''}
          </Text>

          {filteredFAQs.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="help-circle-outline" size={44} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Matching Questions</Text>
              <Text style={styles.emptySubtitle}>
                We couldn't find any articles matching "{searchQuery}". Try a different keyword or contact our support team.
              </Text>
            </View>
          ) : (
            filteredFAQs.map((item) => {
              const isOpen = !!expandedIds[item.id];
              return (
                <View key={item.id} style={[styles.accordionCard, isOpen && styles.accordionCardOpen]}>
                  <TouchableOpacity
                    style={styles.accordionHeader}
                    onPress={() => toggleAccordion(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconCircle}>
                      <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
                    </View>
                    <Text style={styles.questionText}>{item.question}</Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#9ca3af"
                      style={{ marginLeft: 6 }}
                    />
                  </TouchableOpacity>

                  {isOpen && (
                    <View style={styles.accordionBody}>
                      <Text style={styles.answerText}>{item.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Contact Support Section */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeaderRow}>
            <View style={styles.supportIconBadge}>
              <Ionicons name="headset" size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.contactTitle}>Still need assistance?</Text>
              <Text style={styles.contactSubtitle}>Our support team is available Mon-Sat, 8:00 AM - 8:00 PM PHT.</Text>
            </View>
          </View>

          <View style={styles.contactActionsRow}>
            <TouchableOpacity
              style={styles.contactActionBtn}
              onPress={() => router.push('/Chat')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubbles-outline" size={18} color={Colors.primary} />
              <Text style={styles.contactActionText}>Live Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactActionBtn}
              onPress={handleEmailSupport}
              activeOpacity={0.8}
            >
              <Ionicons name="mail-outline" size={18} color={Colors.primary} />
              <Text style={styles.contactActionText}>Email Us</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactActionBtn}
              onPress={handleCallSupport}
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
              <Text style={styles.contactActionText}>Call Hotline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default HelpCenterScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8f8f9',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchBanner: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.title,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.subtitle,
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
  },
  categoryScrollWrap: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryPillsRow: {
    paddingHorizontal: 16,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  catPillActive: {
    backgroundColor: Colors.primary,
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  catPillTextActive: {
    color: '#fff',
  },
  faqSection: {
    padding: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.title,
    marginBottom: 12,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.title,
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.subtitle,
    textAlign: 'center',
    lineHeight: 18,
  },
  accordionCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  accordionCardOpen: {
    borderColor: '#d1a67c',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f3ece7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.title,
    lineHeight: 19,
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  answerText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 20,
  },
  contactCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  supportIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3ece7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.title,
  },
  contactSubtitle: {
    fontSize: 12,
    color: Colors.subtitle,
    marginTop: 2,
  },
  contactActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf6f4',
    borderWidth: 1,
    borderColor: '#ebdcd3',
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 3,
  },
  contactActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: 4,
  },
});
