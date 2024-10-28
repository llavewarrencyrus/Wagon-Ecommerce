import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const HelpCenterScreen = () => {
  return (
    <ScrollView style={styles.container}>

      <View style={styles.helpItem}>
        <Text style={styles.question}>How to Place an Order</Text>
        <Text style={styles.answer}>
          To place an order, browse our collection, select the desired items, and click
          "Add to Cart." Once you're ready, proceed to checkout and follow the prompts to
          complete your purchase.
        </Text>
      </View>

      <View style={styles.helpItem}>
        <Text style={styles.question}>Payment Methods</Text>
        <Text style={styles.answer}>
          We accept various payment methods, including credit/debit cards, PayPal, and
          Apple Pay. Ensure your payment method is valid for a smooth transaction.
        </Text>
      </View>

      <View style={styles.helpItem}>
        <Text style={styles.question}>Promotions and Discounts</Text>
        <Text style={styles.answer}>
          Check our promotions page for the latest discounts and coupon codes. Apply the
          code at checkout to benefit from these offers.
        </Text>
      </View>

      <View style={styles.helpItem}>
        <Text style={styles.question}>Account Security</Text>
        <Text style={styles.answer}>
          Keep your account secure by using a strong password and enabling two-factor
          authentication. If you suspect any unauthorized activity, change your password
          immediately.
        </Text>
      </View>

      <View style={styles.helpItem}>
        <Text style={styles.question}>Changing Your Account Information</Text>
        <Text style={styles.answer}>
          You can update your personal information, including your email address and
          shipping address, in your account settings. Make sure to save your changes.
        </Text>
      </View>

      <View style={styles.helpItem}>
        <Text style={styles.question}>Feedback and Suggestions</Text>
        <Text style={styles.answer}>
          We value your feedback! If you have suggestions or comments about our products or
          services, please reach out to us through our contact form.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  helpItem: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  answer: {
    marginTop: 5,
    fontSize: 14,
    color: '#555',
  },
});

export default HelpCenterScreen;
