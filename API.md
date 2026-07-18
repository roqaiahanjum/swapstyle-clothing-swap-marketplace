# SwapStyle – API Endpoint Documentation

All backend API endpoints are prefix-routed under `/api`.

---

## 🔐 1. Authentication Endpoints (Prefix: `/api/auth`)

### Register User
* **Method**: `POST`
* **Route**: `/register`
* **Content-Type**: `multipart/form-data`
* **Payload**:
  * `name`: String (Required)
  * `email`: String (Required, Unique)
  * `password`: String (Required, Min 6 chars)
  * `phone`: String
  * `city`: String (Required)
  * `lat`: Number (Optional GPS lat)
  * `lng`: Number (Optional GPS lng)
  * `profilePicture`: File (Optional image upload)
* **Response**: `201 Created` with User JSON object.

### Login User
* **Method**: `POST`
* **Route**: `/login`
* **Payload**: `{ "email": "alice@swapstyle.com", "password": "password123" }`
* **Response**: `200 OK` with JSON `{ token, user: { id, name, email, role, location, profilePicture } }`.

### Get Current Profile
* **Method**: `GET`
* **Route**: `/me`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Response**: `200 OK` with User details.

### Update Profile
* **Method**: `PUT`
* **Route**: `/me`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Content-Type**: `multipart/form-data`
* **Payload**: name, phone, city, lat, lng, and optional profilePicture file.
* **Response**: `200 OK` with updated User details.

### Change Password
* **Method**: `PUT`
* **Route**: `/change-password`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Payload**: `{ "oldPassword": "password123", "newPassword": "newSecurePassword123" }`
* **Response**: `200 OK` with `{ "message": "Password updated successfully!" }`.

---

## 👕 2. Listings Endpoints (Prefix: `/api/listings`)

### Get All/Filtered Listings
* **Method**: `GET`
* **Route**: `/`
* **Query Parameters**:
  * `search`: String (matches Title, Description, Brand)
  * `category`: String (e.g. `Outerwear`, `Tops`, `Bottoms`, `Shoes`, `Accessories`, `Other`)
  * `brand`: String (case-insensitive brand filter)
  * `size`: String
  * `condition`: String
  * `city`: String
  * `minPoints`: Number
  * `maxPoints`: Number
  * `sortBy`: String (`value_asc`, `value_desc`, `date_desc`, `distance_asc`)
  * `maxDistance`: Number (requires lat/lng coordinates)
  * `page`: Number (Pagination index, Default: 1)
  * `limit`: Number (Items per page, Default: 12)
* **Headers Injected in Response**:
  * `x-total-count`: Total listings matching filters database-wide.
  * `x-total-pages`: Total paginated pages count.
  * `x-current-page`: The current query index page.
* **Response**: `200 OK` with paginated listings array.

### Get Single Listing Detail
* **Method**: `GET`
* **Route**: `/:id`
* **Response**: `200 OK` with populated Listing JSON.

### Create Listing
* **Method**: `POST`
* **Route**: `/`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Content-Type**: `multipart/form-data`
* **Payload**: Title, Description, Category, Brand, Size, Condition, City, lat, lng, and optional file array (field name: `images`, maximum 5 files, size limit: 5MB per file).
* **Response**: `201 Created` with created listing JSON.

### Update Own Listing
* **Method**: `PUT`
* **Route**: `/:id`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Content-Type**: `multipart/form-data`
* **Payload**: Same fields as Create, with optional parameter `clearExistingImages` (boolean) to clear previous photos before appending new ones.
* **Response**: `200 OK` with updated listing.

### Delete Own Listing
* **Method**: `DELETE`
* **Route**: `/:id`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Response**: `200 OK` with confirmation message. *Fails with 400 Bad Request if the item is locked inside active swaps.*

---

## 🔄 3. Swap Requests Endpoints (Prefix: `/api/swaps`)

### Create Swap Request
* **Method**: `POST`
* **Route**: `/`
* **Payload**: `{ "offeredItemId": "<OWN_ITEM_ID>", "requestedItemId": "<TARGET_ITEM_ID>" }`
* **Response**: `201 Created` with SwapRequest.

### Get User Swaps
* **Method**: `GET`
* **Route**: `/`
* **Response**: `{ "incoming": [...], "outgoing": [...] }` (each card includes calculated chat unread messages count).

### Update Swap Status (Accept/Reject/Dispute/Confirm Complete)
* **Method**: `PUT`
* **Route**: `/:id`
* **Payload**: `{ "status": "Accepted" | "Rejected" | "Completed" | "Disputed", "disputeReason": "optional text" }`
* **Response**: `200 OK` with updated SwapRequest JSON.

---

## 🛡️ 4. Admin Management Endpoints (Prefix: `/api/admin`)

### Get Dashboard Analytics
* **Method**: `GET`
* **Route**: `/analytics`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>` (Must be admin)
* **Response**: `{ totalUsers, totalListings, availableListings, pendingListings, completedSwaps, disputedSwaps, activeUsers7Days }`

### Toggle User Active Status
* **Method**: `PUT`
* **Route**: `/users/:id/toggle-active`
* **Response**: `200 OK` with user status message.
