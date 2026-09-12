# 📋 Wagon E-Commerce — Buyer UI/UX Improvement Action Plan

This action plan provides a step-by-step roadmap for upgrading the buyer experience into a premium, state-of-the-art mobile shopping application.

---

## 📌 How to Use This Plan
When you are ready to execute any action, simply say:
> **"Implement Action X"** (e.g., *"Implement Action 1"* or *"Implement Action 2"*).

---

## 🚀 Step-by-Step Actions

### 📦 Action 1: Buyer "My Orders" & Order Tracking Screen
- **Objective**: Give buyers a dedicated screen to view and track all active and completed orders placed on Wagon.
- **Key Tasks**:
  1. Create `app/(buyer)/OrdersScreen.tsx` with status tabs: **All**, **Pending**, **Processing**, **Shipped**, **Delivered**, and **Cancelled**.
  2. Query `orders` from Supabase with joined `product_variant` (`products`, `product_color`, `product_size`), and delivery `addresses`.
  3. Build order item cards with status pill badges (e.g., 🟡 Pending, 🔵 Shipped, 🟢 Delivered), tracking number, courier, and formatted totals.
  4. Allow cancelling orders while status is `pending`.
  5. Link the **"My Orders"** option in `Account.tsx` to `/OrdersScreen` instead of `/UnderConstruction`.

---

### ⚡ Action 2: Product Screen Action Bar ("Chat Seller" + "Add to Cart" + "Buy Now")
- **Objective**: Increase conversion rates with direct 1-click checkout and seamless buyer-seller communication.
- **Key Tasks**:
  1. Upgrade the bottom floating bar on `app/(buyer)/ProductScreen.tsx` into a modern 3-action bar:
     - 💬 **Chat with Seller**: Direct button to start a conversation with the merchant about the current product.
     - 🛒 **Add to Cart**: Opens variant selection and adds the item to the user's cart with animated feedback.
     - ⚡ **Buy Now**: Opens variant selection and routes directly to `CheckOutScreen` for instant purchase.
  2. Upgrade the **Ratings & Reviews** section in `ProductScreen.tsx` with star distribution bars and cleaner review cards.

---

### 🔍 Action 3: Search & Discovery Polish (Debounce, Recent Chips & Sorting)
- **Objective**: Enable fast, fluid search discovery with zero lag and intuitive filters.
- **Key Tasks**:
  1. Add a **250ms debounce** on text inputs in `app/(buyer)/SearchScreen.tsx` to eliminate re-render stutters while typing.
  2. Implement interactive **Recent Search Chips** with individual removal and "Clear All" action.
  3. Add **Trending Search Suggestions** for quick discovery.
  4. Upgrade `app/(buyer)/ResultScreen.tsx` with:
     - Result count header (e.g., *"Found 12 items for 'Hoodie'"*).
     - Active sort pill buttons (Relevance, Latest, Price: Low $\rightarrow$ High, Price: High $\rightarrow$ Low).
     - Modern empty search state with clickable recommendation chips.

---

### 📍 Action 4: Address Book & Default Switcher Polish
- **Objective**: Make managing multiple delivery addresses effortless and error-free.
- **Key Tasks**:
  1. Upgrade `app/(buyer)/AddressScreen.tsx` with interactive radio selection cards to switch the default delivery address in 1 tap.
  2. Add delete confirmation dialogs and edit shortcuts.
  3. Upgrade `app/(buyer)/AddEditAddress.tsx` with structured Philippine address fields (House/Street, Barangay, City/Municipality, Province, Postal Code) and a "Set as Default Address" toggle switch.

---

### 👤 Action 5: Profile & Customer Support Center Polish
- **Objective**: Refine account personalization and provide accessible self-service support.
- **Key Tasks**:
  1. Upgrade `app/(buyer)/EditProfileScreen.tsx` with profile photo avatar upload, username validation, and phone number editing.
  2. Upgrade `app/(buyer)/HelpCenter.tsx` with searchable FAQ accordion categories (*Shipping & Delivery*, *Returns & Refunds*, *Payment Methods*, *Order Tracking*).
  3. Add a direct **"Contact Support"** action button that connects to live help.
