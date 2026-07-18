# Quality Assurance & Testing Checklist

This guide provides verification procedures to test all the newly added internship features.

---

## 🔑 1. User Security & Password Changes

1. Log in as **Alice Cooper** (`alice@swapstyle.com` / `password123`).
2. Navigate to **Manage Profile** (Profile page).
3. Scroll to the **Update Password** section.
4. Try submitting an incorrect current password.
   - **Verify**: The form blocks execution and displays a floating red warning: *"Incorrect old password."*
5. Try submitting mismatched new passwords or a password shorter than 6 characters.
   - **Verify**: Client-side validation triggers an inline alert message.
6. Enter the correct current password and input a new secure password. Submit.
   - **Verify**: A success toast slides in stating *"Password updated successfully!"*
7. Logout and attempt to log in using the old password, then try the new password.
   - **Verify**: Old password login fails, and the new password logs you in successfully.

---

## 🔎 2. Advanced Search, Filtering, and Sorting

1. Navigate to the **Listings Catalog** page.
2. Search for items without applying filters.
   - **Verify**: Pulled listing cards are rendered correctly in rows.
3. In the filters, enter a Brand name (e.g. `Nike`).
   - **Verify**: The listing grid filters in real-time, showing only items that belong to the Nike brand.
4. Set a point value range:
   - **Min Points**: `50`
   - **Max Points**: `75`
   - **Verify**: Items below 50 pts or above 75 pts are dynamically hidden.
5. Apply different **Sort By** options:
   - Value: Low to High, Value: High to Low, Listed Date: Newest.
   - **Verify**: Listing cards rearrange immediately according to estimated points or creation timestamps.
6. Adjust the **Items per page** dropdown selector.
   - **Verify**: The grid updates dynamically (e.g. displaying a maximum of 6 elements).

---

## 📑 3. Pagination Controls & UI States

1. Navigate to the **Listings Catalog** page.
2. Select **Items per page: 6**.
   - **Verify**: If total items exceed 6, pagination controls appear at the bottom: *Page 1 of X*.
3. Click the **Next** button.
   - **Verify**: You slide to the second page, listing the next set of items.
4. Click **Previous**.
   - **Verify**: You return to the first page.
5. Apply filters that result in zero matches (e.g., Category: tops, Min value: 1000).
   - **Verify**: A stylized "No Listings Found" empty-state screen displays with an inbox icon and a "Clear Filters" button.
6. Refresh the page to trigger data loading.
   - **Verify**: Pulse shimmering placeholder grids (Skeleton Cards) are displayed while data is retrieved.

---

## 📊 4. Dashboard Tabs & Interaction Lists

1. Log in as **Alice Cooper** (`alice@swapstyle.com`).
2. Navigate to your **Dashboard**.
3. Under the statistics cards, click through each tab:
   - **Suggested Swaps Near You**: Displays geographic matching clothing items.
   - **My Closet Listings**: Displays Alice's own items. Verify **Edit** and **Delete** buttons are present on these cards.
   - **Incoming Proposals**: Shows swap offers received from other members.
   - **Outgoing Proposals**: Shows active proposals Alice has sent.
   - **Completed History**: Shows a history log of Alice's completed swap trades.
   - **Verify**: Each tab loads its items, or renders clean empty-state cues when no items exist.
