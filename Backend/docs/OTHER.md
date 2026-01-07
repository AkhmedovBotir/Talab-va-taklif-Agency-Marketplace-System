# Other Components Documentation

This document provides comprehensive documentation for configuration files, middleware, services, utilities, scripts, and the main application entry point.

---

## Part 1: Configuration Files (`config/`)

### 1.1 Database Configuration (`config/database.js`)

**Purpose:** Handles MongoDB database connection.

**Exports:**
- `connectDB` - Async function that connects to MongoDB

**Functionality:**
- Connects to MongoDB using `process.env.MONGODB_URI`
- Logs connection status
- Exits process on connection error
- Uses Mongoose for MongoDB connection

**Usage:**
```javascript
const connectDB = require('./config/database');
connectDB();
```

---

### 1.2 Socket.io Configuration (`config/socket.js`)

**Purpose:** Initializes Socket.io server for real-time notifications.

**Exports:**
- `initializeSocket(server)` - Initializes Socket.io server
- `getIO()` - Returns Socket.io instance

**Functionality:**
- Creates Socket.io server with CORS configuration
- Sets up Socket.io instance in notification controller
- Handles socket connections and room management
- Supports user-specific rooms (`user:${userId}`)
- Supports type-specific rooms (userType)
- Handles join/leave room events
- Logs connection/disconnection events

**Socket Events:**
- `connection` - When a user connects
- `join:room` - Join a room (userType, userId)
- `leave:room` - Leave a room (userType, userId)
- `disconnect` - When a user disconnects

**Usage:**
```javascript
const { initializeSocket } = require('./config/socket');
const io = initializeSocket(server);
```

---

## Part 2: Middleware (`middleware/`)

### 2.1 Authentication Middleware (`middleware/auth.js`)

**Purpose:** Provides authentication middleware for all user types with JWT token verification and device validation.

**Exports:**
- `adminAuth` - Admin authentication middleware
- `contragentAuth` - Contragent authentication middleware
- `optionalContragentAuth` - Optional contragent authentication (doesn't fail if no token)
- `marketplaceUserAuth` - Marketplace user authentication middleware
- `optionalMarketplaceUserAuth` - Optional marketplace user authentication
- `punktAuth` - Punkt authentication middleware
- `agentAuth` - Agent authentication middleware

**Common Features:**
- JWT token verification from Authorization header (Bearer token)
- Token expiration checking
- User existence and status validation
- Device verification (for Admin, Contragent, Punkt, Agent)
- Device activity tracking (lastActivityAt)
- Attaches user info to `req.user`

**Admin Auth (`adminAuth`):**
- Verifies JWT token
- Checks admin existence and active status
- Validates device if deviceId is in token
- Requires active device for login
- Attaches: `userId`, `userType: 'Admin'`, `role`, `username`, `admin`

**Contragent Auth (`contragentAuth`):**
- Verifies JWT token with type check (`type === 'contragent'`)
- Validates device if deviceId is in token
- Returns `requiresDeviceVerification: true` if device is inactive
- Attaches: `userId`, `userType: 'Contragent'`, `phone`, `inn`

**Optional Contragent Auth (`optionalContragentAuth`):**
- Same as contragentAuth but doesn't fail if no token
- Continues without setting `req.user` if no token or invalid token

**Marketplace User Auth (`marketplaceUserAuth`):**
- Verifies JWT token with type check (`type === 'marketplace_user'`)
- Checks user existence and active status
- No device verification required
- Attaches: `userId`, `userType: 'MarketplaceUser'`, `phone`

**Optional Marketplace User Auth (`optionalMarketplaceUserAuth`):**
- Same as marketplaceUserAuth but doesn't fail if no token
- Sets `req.user = null` if no token or invalid token

**Punkt Auth (`punktAuth`):**
- Verifies JWT token with type check (`type === 'punkt'`)
- Validates device if deviceId is in token
- Populates viloyat and tuman regions
- Attaches: `userId`, `userType: 'Punkt'`, `phone`, `viloyat`, `tuman`, `punkt`

**Agent Auth (`agentAuth`):**
- Verifies JWT token with type check (`type === 'agent'`)
- Validates device if deviceId is in token
- Populates viloyat, tuman, and mfy regions
- Determines agent type (mfy, tuman, viloyat)
- Attaches: `userId`, `userType: 'Agent'`, `phone`, `role` (agentType), `viloyat`, `tuman`, `mfy`, `agent`

**Error Responses:**
- `401` - Token not found or invalid/expired
- `403` - Wrong token type, inactive user, or device not found/inactive

---

### 2.2 Validation Middleware (`middleware/validation.js`)

**Purpose:** Provides request validation using Joi schemas for all endpoints.

**Exports:**
- `validate(schema)` - Validation middleware function
- Multiple validation schema objects for different entities

**Validation Function:**
- Validates request body against Joi schema
- Strips unknown fields
- Returns detailed error messages for each field
- Returns `400` status with error details if validation fails

**Validation Schemas:**

**Admin Validation Schemas (`adminValidationSchemas`):**
- `create` - Admin creation (name, role, telefonRaqam, username, parol, status)
- `update` - Admin update (all fields optional)
- `login` - Admin login (username, parol)

**Region Validation Schemas (`regionValidationSchemas`):**
- `create` - Region creation (name, type, parent, code, status)
- `update` - Region update (all fields optional)

**Contragent Validation Schemas (`contragentValidationSchemas`):**
- `create` - Contragent creation (name, inn, viloyat, tuman, mfy, phone, password, logo, status)
- `update` - Contragent update
- `login` - Contragent login (phone, password)
- `updateProfile` - Profile update
- `updateLogo` - Logo update (base64 format)
- `passwordSetupStep1` - Password setup step 1 (phone)
- `passwordSetupStep2` - Password setup step 2 (phone, code)
- `passwordSetupStep3` - Password setup step 3 (phone, newPassword)

**Agent Validation Schemas (`agentValidationSchemas`):**
- `create` - Agent creation (name, viloyat, tuman, mfy, phone, password, status)
- `update` - Agent update
- `login` - Agent login (phone, password)
- `passwordSetupStep1` - Password setup step 1 (phone)
- `passwordSetupStep2` - Password setup step 2 (phone, code)
- `passwordSetupStep3` - Password setup step 3 (phone, newPassword)

**Punkt Validation Schemas (`punktValidationSchemas`):**
- `create` - Punkt creation (name, phone, password, viloyat, tuman, status)
- `update` - Punkt update
- `login` - Punkt login (phone, password)
- `passwordSetupStep1` - Password setup step 1 (phone)
- `passwordSetupStep2` - Password setup step 2 (phone, code)
- `passwordSetupStep3` - Password setup step 3 (phone, newPassword)

**Category Validation Schemas (`categoryValidationSchemas`):**
- `create` - Category creation (name, parent, status)
- `update` - Category update
- `createSubcategory` - Subcategory creation (name, parent, status)
- `updateSubcategory` - Subcategory update
- `updateStatus` - Status update

**Admin Category Validation Schemas (`adminCategoryValidationSchemas`):**
- `create` - Category creation with image and censored (name, image, censored, status)
- `update` - Category update
- `createSubcategory` - Subcategory creation
- `updateSubcategory` - Subcategory update
- `updateStatus` - Status update

**Product Validation Schemas (`productValidationSchemas`):**
- `create` - Product creation (name, description, price, originalPrice, images, category, subcategory, quantity, unit, unitSize, length, width, weight, status, deliveryRegions, kpiBonusPercent)
- `update` - Product update
- `updateStatus` - Status update

**Marketplace Validation Schemas (`marketplaceValidationSchemas`):**
- `registerStep1` - Registration step 1 (phone)
- `registerStep2` - Registration step 2 (firstName, lastName, phone, gender, viloyat, tuman, mfy, birthDate, password, code)
- `loginStep1` - Login step 1 (phone, password)
- `loginStep2` - Login step 2 (phone, code)
- `forgotPasswordStep1` - Forgot password step 1 (phone)
- `forgotPasswordStep2` - Forgot password step 2 (phone, code, newPassword)
- `resendSMSCode` - Resend SMS code (phone, type)

**Cart Validation Schemas (`cartValidationSchemas`):**
- `addToCart` - Add to cart (productId, quantity)
- `updateCartItem` - Update cart item (quantity)

**Order Validation Schemas (`orderValidationSchemas`):**
- `create` - Order creation (paymentMethod, deliveryViloyat, deliveryTuman, deliveryMfy, deliveryNote, phoneNumber, clearCart)

**Marketplace Profile Validation Schemas (`marketplaceProfileValidationSchemas`):**
- `updateProfile` - Profile update (firstName, lastName, gender, birthDate)
- `updatePassword` - Password update (currentPassword, newPassword)
- `updateAvatar` - Avatar update (base64 format)
- `updateLocation` - Location update (viloyat, tuman, mfy)
- `updateViloyatTuman` - Viloyat/Tuman update

**Partnership Request Validation Schemas (`partnershipRequestValidationSchemas`):**
- `create` - Partnership request creation (companyName, inn, mfo, accountNumber, viloyat, tuman, mfy, activityType, managerFirstName, managerLastName, managerPhone)
- `updateContactStatus` - Contact status update
- `updateRequestStatus` - Request status update

**Marketplace Partnership Request Validation Schemas (`marketplacePartnershipRequestValidationSchemas`):**
- `create` - Marketplace partnership request creation
- `updateContacted` - Update contacted status
- `approve` - Approve request
- `reject` - Reject request (requires adminNotes)

**Featured Contragent Validation Schemas (`featuredContragentValidationSchemas`):**
- `updateFeaturedList` - Update featured contragents list (contragentIds array)

**Admin Product Moderation Validation Schemas (`adminProductModerationValidationSchemas`):**
- `reject` - Reject product (rejectionReason required)
- `update` - Update product during moderation

**Contragent Type Validation Schemas (`contragentTypeValidationSchemas`):**
- `create` - Contragent type creation (name, icon, status)
- `update` - Contragent type update

**Validation Rules:**
- Phone numbers: Pattern validation for international format
- INN: 9 or 12 digits
- Base64 images: Pattern validation for data URI format
- Status fields: Enum validation (active/inactive, etc.)
- Required fields: Marked with `.required()`
- String lengths: Min/max validation
- Number ranges: Min/max validation
- Arrays: Min items validation
- Custom error messages in Uzbek

---

## Part 3: Services (`services/`)

### 3.1 Eskiz SMS Service (`services/eskizService.js`)

**Purpose:** Handles SMS sending via Eskiz.uz API for all authentication and verification purposes.

**Class: `EskizService`**

**Constructor:**
- Initializes with `ESKIZ_EMAIL` and `ESKIZ_PASSWORD` from environment variables
- Base URL: `https://notify.eskiz.uz/api`
- Token caching with expiration (29 days)

**Methods:**

**`getToken()`**
- Gets authentication token from Eskiz API
- Caches token and expiration date
- Refreshes token if expired
- Returns token string

**`sendSMS(phone, message)`**
- Sends SMS to phone number
- Formats phone number (removes +, spaces, ensures starts with 998)
- Uses cached token or gets new token
- Handles token expiration (401) and retries
- Returns: `{ success: true, messageId, status }`
- Handles various success indicators (success, waiting, id)

**`generateCode()`**
- Generates 5-digit random code
- Returns string code

**SMS Type Methods:**
- `sendRegistrationCode(phone, code)` - Marketplace registration
- `sendLoginCode(phone, code)` - Marketplace login
- `sendForgotPasswordCode(phone, code)` - Marketplace forgot password
- `sendContragentPasswordSetupCode(phone, code)` - Contragent password setup
- `sendPunktPasswordSetupCode(phone, code)` - Punkt password setup
- `sendAgentPasswordSetupCode(phone, code)` - Agent password setup
- `sendDeviceVerificationCode(phone, code)` - Device verification

**All SMS messages include:**
- 5-digit code
- Purpose description
- Expiration time (5 minutes)
- "Talab va Taklif Agency" signature

**Error Handling:**
- Token expiration handling with retry
- Phone number formatting
- API error handling
- Success status detection (success, waiting, id)

**Usage:**
```javascript
const eskizService = require('./services/eskizService');
await eskizService.sendRegistrationCode('998901234567', '12345');
```

---

## Part 4: Utilities (`utils/`)

### 4.1 Device Helper (`utils/deviceHelper.js`)

**Purpose:** Extracts and detects device information from HTTP requests.

**Exports:**
- `extractDeviceInfo(req)` - Extracts device info from request
- `detectDeviceType(userAgent)` - Detects device type
- `detectPlatform(userAgent)` - Detects platform
- `detectOS(userAgent)` - Detects operating system
- `detectBrowser(userAgent)` - Detects browser

**`extractDeviceInfo(req)`**
- Extracts device information from request headers and body
- Sources: `x-device-id`, `x-device-name`, `x-device-type`, `x-platform`, `x-os`, `x-browser` headers
- Falls back to User-Agent parsing if headers not provided
- Returns: `{ deviceId, deviceName, deviceType, platform, os, browser, ipAddress, userAgent, location }`

**`detectDeviceType(userAgent)`**
- Detects device type: `mobile`, `tablet`, `desktop`, `web`, `unknown`
- Based on User-Agent string patterns

**`detectPlatform(userAgent)`**
- Detects platform: `Android`, `iOS`, `Windows`, `macOS`, `Linux`, `unknown`
- Based on User-Agent string patterns

**`detectOS(userAgent)`**
- Detects OS with version: `Android 12`, `iOS 15.0`, `Windows 10`, etc.
- Extracts version numbers from User-Agent

**`detectBrowser(userAgent)`**
- Detects browser: `Chrome`, `Safari`, `Firefox`, `Edge`, `Opera`, `unknown`
- Based on User-Agent string patterns

**Usage:**
```javascript
const { extractDeviceInfo } = require('./utils/deviceHelper');
const deviceInfo = extractDeviceInfo(req);
```

---

### 4.2 KPI Bonus Calculator (`utils/kpiBonusCalculator.js`)

**Purpose:** Calculates and creates KPI bonus transactions for orders.

**Exports:**
- `calculateAndCreateKpiBonus(orderId, status)` - Main calculation function
- `getRecipients(order)` - Gets recipients for KPI bonus

**`calculateAndCreateKpiBonus(orderId, status)`**
- Calculates KPI bonuses for all order items
- Only creates transactions when order status is `confirmed_by_customer`
- Checks for existing transactions (prevents duplicates)
- Gets active KPI distribution configuration
- Calculates profit per unit: `price - originalPrice`
- Calculates total KPI amount: `(profitPerUnit * quantity * kpiBonusPercent) / 100`
- Distributes amounts based on distribution percentages:
  - `punkt` - Punkt percentage
  - `viloyatAgent` - Viloyat agent percentage
  - `tumanAgent` - Tuman agent percentage
  - `mfyAgent` - MFY agent percentage
  - `finance` - Finance department percentage
  - `deliveryService` - Delivery service percentage
  - `punktTransfer` - Punkt-to-punkt transfer (split 50/50 between fromPunkt and toPunkt)
- Creates `KpiBonusTransaction` records for each order item
- Returns array of created transactions

**`getRecipients(order)`**
- Determines recipients for KPI bonuses based on order
- Returns: `{ punkt, viloyatAgent, tumanAgent, mfyAgent, fromPunkt, toPunkt }`
- Logic:
  - Punkt: from `confirmedByPunkt` or `currentPunkt`
  - Agents: from `assignedToAgent` (determines type: mfy, tuman, viloyat)
  - Tuman agent: found by tuman (where mfy is null)
  - Viloyat agent: found by viloyat (where tuman and mfy are null)
  - Punkt transfer: from `punktToPunktRequests` (accepted/delivered requests)

**KPI Distribution Formula:**
```
profitPerUnit = price - originalPrice
totalKpiAmount = (profitPerUnit * quantity * kpiBonusPercent) / 100
amount = (totalKpiAmount * distributionPercentage) / 100
```

**Usage:**
```javascript
const { calculateAndCreateKpiBonus } = require('./utils/kpiBonusCalculator');
await calculateAndCreateKpiBonus(orderId, 'confirmed_by_customer');
```

---

## Part 5: Scripts (`scripts/`)

### 5.1 Create General Admin (`scripts/createGeneralAdmin.js`)

**Purpose:** Creates a general admin user with full permissions.

**Functionality:**
- Connects to MongoDB
- Creates admin with data from environment variables:
  - `ADMIN_NAME` - Admin name
  - `ADMIN_PHONE` - Admin phone number
  - `ADMIN_USERNAME` - Admin username
  - `ADMIN_PASSWORD` - Admin password
- Sets role to `'general'`
- Sets all default permissions
- Checks for existing admin (by username or phone)
- Exits with error if admin already exists
- Logs success with admin details

**Default Permissions:**
- dashboard, admins, regions, counterparties, agents, points, archive, warehouse, marketplace_clients, messages, orders, kpi_bonuses, area_statistics, sms, finance, pricing, partnership_requests, vacancies, settings

**Usage:**
```bash
node scripts/createGeneralAdmin.js
```

**Environment Variables Required:**
- `MONGODB_URI` - MongoDB connection string
- `ADMIN_NAME` - Admin name
- `ADMIN_PHONE` - Admin phone
- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD` - Admin password

---

### 5.2 Import Regions (`scripts/importRegions.js`)

**Purpose:** Imports regions from JSON file to MongoDB.

**Functionality:**
- Reads `region.json` file (newline-delimited JSON)
- Parses each line as JSON object
- Converts MongoDB Extended JSON format to Mongoose format
- Converts ObjectId strings to Mongoose ObjectId
- Converts date strings to Date objects
- Upserts regions (creates or updates)
- Handles parent references

**File Format:**
- Newline-delimited JSON (NDJSON)
- Each line is a JSON object with MongoDB Extended JSON format
- Fields: `_id`, `name`, `type`, `parent`, `code`, `status`, `createdAt`, `updatedAt`, `__v`

**Usage:**
```bash
node scripts/importRegions.js
```

**Environment Variables Required:**
- `MONGO_URI` - MongoDB connection string

**Note:** Uncomment `await Region.deleteMany({})` to clear existing regions before import.

---

### 5.3 Test SMS (`scripts/test-sms.js`)

**Purpose:** Tests all SMS sending functions with different message types.

**Functionality:**
- Tests all SMS types:
  - Marketplace registration
  - Marketplace login
  - Marketplace forgot password
  - Contragent password setup
  - Punkt password setup
  - Agent password setup
  - Device verification
- Uses phone number from command line argument, `TEST_PHONE` env var, or default
- Waits 2 seconds between SMS to avoid rate limiting
- Logs success/failure for each test
- Provides summary statistics

**Usage:**
```bash
node scripts/test-sms.js [phone_number]
```

**Environment Variables:**
- `TEST_PHONE` - Default test phone number (optional)
- `ESKIZ_EMAIL` - Eskiz email
- `ESKIZ_PASSWORD` - Eskiz password

---

### 5.4 Test Notifications (`scripts/test-notifications.js`)

**Purpose:** Tests notification system with different types and target types.

**Functionality:**
- Tests all notification types: `info`, `warning`, `success`, `error`, `announcement`, `promotion`, `update`
- Tests all target types: `all`, `punkts`, `viloyat_agents`, `tuman_agents`, `mfy_agents`, `marketplace_users`, `contragents`
- Sends notifications via HTTP POST to `/api/notifications`
- Requires admin token (hardcoded in script - needs to be updated)
- Provides summary statistics

**Modes:**
- `--single` - Send single test notification
- `--all` - Test all combinations (7 types × 8 targets = 56 notifications)

**Usage:**
```bash
node scripts/test-notifications.js --single
node scripts/test-notifications.js --all
```

**Configuration:**
- `BASE_URL` - API base URL (default: `http://localhost:5000`)
- `ADMIN_TOKEN` - Admin JWT token (needs to be updated in script)

---

## Part 6: Main Application Entry Point (`index.js`)

**Purpose:** Main application entry point that initializes Express server, Socket.io, database connection, and all routes.

**Dependencies:**
- `express` - Web framework
- `cors` - CORS middleware
- `http` - HTTP server
- `dotenv` - Environment variables

**Imports:**
- Database connection: `./config/database`
- Socket.io initialization: `./config/socket`
- All route modules (22 route files)

**Initialization:**
1. Loads environment variables
2. Creates Express app
3. Creates HTTP server
4. Initializes Socket.io
5. Connects to MongoDB

**Middleware:**
- `cors()` - Enables CORS for all origins
- `express.json({ limit: '1gb' })` - JSON body parser (1GB limit)
- `express.urlencoded({ extended: true, limit: '1gb' })` - URL-encoded body parser (1GB limit)

**Routes (Base URL: `/api`):**
- `/api/admins` - Admin routes
- `/api/regions` - Region routes
- `/api/contragents` - Contragent routes
- `/api/contragent` - Contragent order routes
- `/api/agents` - Agent routes
- `/api/agent` - Agent order routes
- `/api/punkts` - Punkt routes
- `/api/punkt` - Punkt order routes
- `/api/category` - Category routes
- `/api/product` - Product routes
- `/api/marketplace` - Marketplace routes
- `/api/notifications` - Notification routes
- `/api/reviews` - Review routes
- `/api/payment` - Payment routes
- `/api/agent-finance` - Agent finance routes
- `/api/admin-finance` - Admin finance routes
- `/api/admin-kpi-payments` - Admin KPI payment routes
- `/api/admin-contragent-payments` - Admin contragent payment routes
- `/api/contragent-types` - Contragent type routes
- `/api/device-verification` - Device verification routes

**Health Check:**
- `GET /health` - Returns server status and timestamp

**Error Handling:**
- `404` handler - Returns JSON error for unknown routes
- Global error handler - Returns JSON error with status code

**Server:**
- Port: `process.env.PORT` or `5000`
- Starts HTTP server
- Logs server start message

**Exports:**
- `{ app, io }` - Express app and Socket.io instance

**Usage:**
```bash
node index.js
```

**Environment Variables:**
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- Other service-specific variables (ESKIZ_EMAIL, ESKIZ_PASSWORD, etc.)

---

## Summary

This documentation covers all configuration, middleware, services, utilities, scripts, and the main application entry point:

1. **Configuration Files** - Database and Socket.io setup
2. **Middleware** - Authentication and validation
3. **Services** - SMS service (Eskiz)
4. **Utilities** - Device helper and KPI calculator
5. **Scripts** - Admin creation, region import, SMS testing, notification testing
6. **Main Entry Point** - Express server initialization and route setup

Each component is designed to work together to provide a complete backend system with authentication, validation, real-time notifications, SMS services, and administrative tools.


