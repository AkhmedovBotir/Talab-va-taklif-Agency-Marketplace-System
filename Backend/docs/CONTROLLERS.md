# Controller Documentation

This document provides comprehensive documentation for all controllers in the application, organized into logical parts.

---

## Part 1: Admin Controllers

### 1.1 Admin Controller (`adminController.js`)

**Purpose:** Manages administrative users with comprehensive CRUD operations, authentication, and permission management.

**Key Functions:**
- `createAdmin` - Creates a new admin user with validation (username and phone uniqueness, default permissions, role assignment)
- `getAllAdmins` - Retrieves all admins with default permissions assignment
- `getAdminById` - Retrieves a specific admin by ID with default permissions
- `updateAdmin` - Updates admin information with duplicate checking
- `deleteAdmin` - Soft deletes an admin
- `loginAdmin` - Handles admin login with username/password and device verification

**Key Features:**
- Username and phone number (telefonRaqam) uniqueness validation
- Default permissions array (dashboard, admins, regions, counterparties, agents, points, archive, warehouse, marketplace_clients, messages, orders, kpi_bonuses, area_statistics, sms, finance, pricing, partnership_requests, vacancies, settings)
- Role management (general, etc.)
- Device verification integration for login
- Password hashing via pre-save hook
- Soft delete mechanism
- Permission inheritance for existing admins without permissions

---

### 1.2 Admin Category Controller (`adminCategoryController.js`)

**Purpose:** Handles comprehensive CRUD operations for categories and subcategories with validation and hierarchy management.

**Key Functions:**
- `createCategory` - Creates a new top-level category (name, image, censored, status, createdBy: Admin)
- `createSubcategory` - Creates a subcategory under a parent category (name, parent required, inherits censored from parent)
- `getAllCategories` - Retrieves all top-level categories with filtering (status, censored, pagination, includes subcategories)
- `getAllSubcategories` - Retrieves all subcategories with filtering (status, censored, parent, pagination)
- `getCategoryById` - Retrieves a specific category by ID
- `updateCategory` - Updates category information (name, image, censored, status)
- `updateSubcategory` - Updates subcategory information (name, status)
- `updateCategoryStatus` - Updates category status (active/inactive)
- `deleteCategory` - Soft deletes a category
- `deleteSubcategory` - Soft deletes a subcategory

**Key Features:**
- Parent-child relationship validation (subcategory cannot have another subcategory as parent)
- Duplicate name and slug checking (unique per parent)
- Censored status inheritance (subcategory inherits from parent)
- Created by Admin validation (categories must be created by Admin for contragent use)
- Soft delete mechanism
- Category hierarchy management
- Image management (only for top-level categories)

---

### 1.3 Admin Dashboard Controller (`adminDashboardController.js`)

**Purpose:** Provides comprehensive statistics and overview data for the admin dashboard.

**Key Functions:**
- `getDashboardStatistics` - Overall dashboard statistics with parallel queries for orders, revenue, products, categories, contragents, marketplace users, punkts, agents, admins, reviews, vacancies, payments, and KPI transactions
- `getDailyStatistics` - Daily statistics breakdown
- `getWeeklyStatistics` - Weekly statistics breakdown
- `getMonthlyStatistics` - Monthly statistics breakdown
- `getOrdersStatistics` - Detailed order statistics
- `getFinanceStatistics` - Financial statistics
- `getUsersStatistics` - User statistics breakdown by type
- `getProductsStatistics` - Product statistics

**Key Features:**
- Parallel query execution for performance
- Time-based filtering (today, week, month, year)
- Comprehensive aggregation across all entities
- Status-based filtering (active/inactive)
- Revenue calculation from confirmed orders
- Payment status tracking (pending/paid)
- KPI transaction statistics

---

### 1.4 Admin Data Controller (`adminDataController.js`)

**Purpose:** Provides comprehensive administrative access to all data entities with extensive filtering, pagination, and workflow management.

**Key Functions (Categories & Products):**
- `getAllCategoriesForAdmin` - Retrieves all categories with filtering (status, includeSubcategories)
- `getAllSubcategoriesForAdmin` - Retrieves all subcategories with filtering (status, parent)
- `getAllProductsForAdmin` - Retrieves all products with comprehensive filtering (status, category, subcategory, contragent, viloyat, tuman, mfy, price range, quantity range, unit, search)
- `getProductByIdForAdmin` - Retrieves specific product with full details
- `getCategoryByIdForAdmin` - Retrieves specific category with subcategories

**Key Functions (SMS & Users):**
- `getAllSmsVerificationsForAdmin` - Retrieves SMS verification records with filtering
- `getSmsVerificationByIdForAdmin` - Retrieves specific SMS verification
- `getAllMarketplaceUsersForAdmin` - Retrieves marketplace users with filtering (status, viloyat, tuman, mfy, search)
- `getMarketplaceUserByIdForAdmin` - Retrieves specific marketplace user

**Key Functions (Orders):**
- `getAllOrdersForAdmin` - Retrieves all orders with extensive filtering
- `getOrderByIdForAdmin` - Retrieves specific order with full details
- `getMarketplaceOrdersForAdmin` - Retrieves marketplace orders
- `getOrdersConfirmedByPunktForAdmin` - Retrieves orders confirmed by punkt
- `getOrdersRequestedToContragentsForAdmin` - Retrieves orders requested to contragents
- `getOrdersDeliveredToPunktForAdmin` - Retrieves orders delivered to punkt
- `getOrdersAssignedToAgentsForAdmin` - Retrieves orders assigned to agents
- `getOrdersConfirmedByAgentsForAdmin` - Retrieves orders confirmed by agents
- `getOrdersConfirmedByCustomersForAdmin` - Retrieves orders confirmed by customers
- `getCancelledOrdersForAdmin` - Retrieves cancelled orders

**Key Functions (Regions & Agents):**
- `getAgentsInRegion` - Retrieves agents in a specific region
- `getPunktsInRegion` - Retrieves punkts in a specific region

**Key Functions (Sales Statistics):**
- `getSalesStatsByViloyats` - Sales statistics by viloyats
- `getSalesStatsByViloyatId` - Sales statistics for specific viloyat
- `getSalesStatsByTumanId` - Sales statistics for specific tuman
- `getSalesStatsByMfyId` - Sales statistics for specific MFY
- `getSalesStatsSummary` - Overall sales statistics summary
- `getAdminDashboardOverview` - Admin dashboard overview

**Key Functions (Archive):**
- `getArchivedPunkts` - Retrieves archived punkts
- `getArchivedAgents` - Retrieves archived agents
- `getArchivedPunktWithWork` - Retrieves archived punkt with work history
- `getArchivedAgentWithWork` - Retrieves archived agent with work history

**Key Features:**
- Extensive filtering options for all entities
- Comprehensive population of related data
- Order workflow status filtering
- Regional sales analysis
- Archive management
- Statistics aggregation

---

### 1.5 Admin Device Controller (`adminDeviceController.js`)

**Purpose:** Manages device access for all user types (Admin, Contragent, Punkt, Agent) from an administrative perspective.

**Key Functions:**
- `getAllDevices` - Retrieves all devices with filtering (userModel, userId, pagination)
- `getDeviceById` - Retrieves a specific device by ID with user population
- `getUserDevices` - Retrieves all devices for a specific user (userId, userModel)
- `activateDevice` - Activates a device (deactivates all other devices for the user, sets isActive=true)
- `deactivateDevice` - Deactivates a device (sets isActive=false)
- `deleteDevice` - Deletes a device permanently
- `getDeviceStatistics` - Retrieves device statistics (total devices, active devices, by user type)

**Key Features:**
- Device management for all user types (Admin, Contragent, Punkt, Agent)
- Device activation/deactivation (only one active device per user)
- Device metadata tracking (deviceId, deviceName, deviceType, platform, OS, browser, IP, location)
- User population for device details
- Device statistics by user type
- Last activity tracking

---

### 1.6 Admin Finance Controller (`adminFinanceController.js`)

**Purpose:** Handles comprehensive financial reporting, submission management, and balance tracking for administrators.

**Key Functions (Reports):**
- `getDailyReport` - Daily financial report with submissions breakdown by region
- `getWeeklyReport` - Weekly financial report with daily breakdown and regional analysis
- `getMonthlyReport` - Monthly financial report with daily breakdown and regional analysis
- `getYearlyReport` - Yearly financial report with monthly breakdown and regional analysis
- `getCustomReport` - Custom date range financial report

**Key Functions (Submissions):**
- `getPendingSubmissions` - Retrieves pending finance submissions
- `confirmSubmission` - Confirms a finance submission
- `rejectSubmission` - Rejects a finance submission with reason

**Key Functions (Transactions):**
- `getAllTransactions` - Retrieves all payment transactions with filtering

**Key Functions (Statistics):**
- `getStatistics` - Overall financial statistics
- `getStatisticsByRegion` - Statistics by viloyat
- `getStatisticsByDistrict` - Statistics by tuman
- `getStatisticsByMfy` - Statistics by MFY
- `getAgentPerformance` - Agent performance statistics

**Key Functions (Balance):**
- `getFinanceBalance` - Finance department balance
- `getTotalReceived` - Total received amount
- `getTotalDistributed` - Total distributed amount
- `getFinanceKpiAmount` - Finance KPI amount
- `getDeliveryServiceKpiAmount` - Delivery service KPI amount
- `getTotalBalance` - Overall total balance

**Key Features:**
- Time-based reporting (daily, weekly, monthly, yearly, custom)
- Regional breakdown (viloyat, tuman, MFY)
- Submission approval workflow
- Transaction tracking
- Agent performance analysis
- Balance calculation and tracking

---

### 1.7 Admin KPI Controller (`adminKpiController.js`)

**Purpose:** Manages KPI (Key Performance Indicator) bonus distribution configurations, transactions, and comprehensive reporting.

**Key Functions (Distribution Management):**
- `createKpiDistribution` - Creates a new KPI distribution rule with percentage validation (must sum to 100%)
- `getAllKpiDistributions` - Retrieves all KPI distributions with filtering (isActive)
- `getKpiDistributionById` - Retrieves a specific KPI distribution
- `updateKpiDistribution` - Updates a KPI distribution
- `deleteKpiDistribution` - Deletes a KPI distribution
- `getInitialKpiDistribution` - Returns default KPI distribution values for forms

**Key Functions (Transactions):**
- `getAllKpiTransactions` - Retrieves all KPI transactions with extensive filtering
- `getKpiTransactionById` - Retrieves a specific KPI transaction with full details

**Key Functions (Statistics):**
- `getKpiStatistics` - Overall KPI statistics

**Key Functions (KPI Data by Region/Type):**
- `getViloyatAgentsKpi` - KPI data for viloyat agents
- `getTumanAgentsKpi` - KPI data for tuman agents
- `getMfyAgentsKpi` - KPI data for MFY agents
- `getPunktsKpi` - KPI data for punkts
- `getAgentKpiDetails` - Detailed KPI information for a specific agent
- `getPunktKpiDetails` - Detailed KPI information for a specific punkt

**Key Features:**
- KPI distribution percentage validation (must sum to 100%)
- Active distribution management (only one active at a time)
- Default distribution values (punkt: 15%, viloyatAgent: 15%, tumanAgent: 15%, mfyAgent: 35%, finance: 15%, deliveryService: 5%)
- Comprehensive transaction filtering
- Regional and type-based KPI breakdowns
- Detailed KPI reporting by agent and punkt

---

### 1.8 Admin KPI Payment Controller (`adminKpiPaymentController.js`)

**Purpose:** Manages the payment process for KPI bonuses from an administrative perspective with grouping, synchronization, and notifications.

**Key Functions:**
- `getUnpaidPayments` - Retrieves unpaid KPI payments with filtering (recipientType, agentType, viloyatId, tumanId, mfyId)
- `getUnpaidPaymentsGrouped` - Groups unpaid payments by recipient (agent or punkt) with totals
- `getPaidPayments` - Retrieves paid KPI payments with filtering
- `markPaymentsAsPaid` - Marks multiple payments as paid (bulk operation, can mark single or multiple payments)
- `syncKpiPayments` - Synchronizes payments from KPI transactions (creates KpiPaymentDistribution records)
- `getPaymentStatistics` - Retrieves payment statistics

**Key Features:**
- Payment status management (pending/paid)
- Payment grouping by recipient type (agent/punkt) and agent type (mfy/tuman/viloyat)
- Regional filtering (viloyat, tuman, MFY)
- Bulk payment processing (marks multiple payments as paid)
- Payment synchronization from KPI transactions
- Notification system integration via Socket.io
- Payment statistics calculation
- Updates related KPI transactions (isPaid flag)

---

### 1.9 Admin Product Moderation Controller (`adminProductModerationController.js`)

**Purpose:** Responsible for the moderation of products submitted by contragents with approval/rejection workflow.

**Key Functions:**
- `getPendingProducts` - Retrieves products pending moderation with filtering (contragent, category, pagination)
- `getPendingProductById` - Retrieves a specific pending product by ID
- `getAllProductsForModeration` - Retrieves all products for moderation (pending, approved, rejected) with filtering
- `approveProduct` - Approves a product (sets moderationStatus to 'approved', records moderator and timestamp)
- `rejectProduct` - Rejects a product with reason (sets moderationStatus to 'rejected', records rejection reason, moderator, and timestamp)
- `updateProduct` - Updates product details during moderation

**Key Features:**
- Product approval workflow (pending → approved/rejected)
- Rejection reason tracking (required field)
- Moderator tracking (moderatedBy, moderatedAt)
- Ensures only approved products appear on marketplace
- Product status validation before approval/rejection
- Comprehensive product population (category, subcategory, contragent, delivery regions)

---

### 1.11 Admin Contragent Payment Controller (`adminContragentPaymentController.js`)

**Purpose:** Manages comprehensive contragent payment processing from an administrative perspective with grouping, synchronization, and overdue tracking.

**Key Functions:**
- `getUnpaidPayments` - Retrieves unpaid contragent payments with filtering (contragentId, viloyatId, tumanId, mfyId, isOverdue, pagination)
- `getUnpaidPaymentsGrouped` - Groups unpaid payments by contragent with totals and overdue information
- `getPaidPayments` - Retrieves paid contragent payments with filtering
- `payContragentPayment` - Marks a single contragent payment as paid
- `payContragentPaymentsByDateRange` - Marks multiple payments as paid by date range (bulk operation)
- `markPaymentsAsPaid` - Marks multiple payments as paid (bulk operation)
- `syncContragentPayments` - Synchronizes payments from confirmed orders (creates ContragentPaymentDistribution records)
- `getPaymentStatistics` - Retrieves payment statistics (total paid, total unpaid, overdue amounts)

**Key Features:**
- Payment status management (pending/paid)
- Payment grouping by contragent with totals
- Regional filtering (viloyat, tuman, MFY)
- Overdue payment tracking (isOverdue flag, dueDate comparison)
- Bulk payment processing by date range
- Payment synchronization from confirmed orders
- Notification system integration via Socket.io
- Payment statistics calculation
- Handles deleted contragents gracefully

---

## Part 2: Agent Controllers

### 2.1 Agent Controller (`agentController.js`)

**Purpose:** Manages comprehensive agent-related operations with region validation, position checking, and authentication.

**Key Functions:**
- `createAgent` - Creates a new agent with validation (phone uniqueness, region validation, position checking, agent type: mfy/tuman/viloyat)
- `getAllAgents` - Retrieves all agents with filtering (status, viloyat, tuman, mfy, agentType, pagination)
- `getAgentById` - Retrieves a specific agent by ID
- `updateAgent` - Updates agent information with duplicate checking
- `deleteAgent` - Soft deletes an agent (sets isDeleted=true)
- `loginAgent` - Handles agent login with phone/password and device verification
- `getAgentsForSelection` - Retrieves agents for selection dropdowns with filtering

**Key Features:**
- Region hierarchy validation (viloyat → tuman → MFY)
- Position uniqueness checking (only one active agent per position)
- Agent type management (mfy, tuman, viloyat)
- Phone number uniqueness validation
- Device verification integration for login
- Soft delete mechanism (isDeleted flag)
- Password hashing via pre-save hook
- Region population (viloyat, tuman, mfy)

---

### 2.2 Agent Auth Controller (`agentAuthController.js`)

**Purpose:** Handles agent authentication operations with password setup and login.

**Key Functions:**
- `passwordSetupStep1` - Step 1: Request phone number for password setup, sends SMS code
- `passwordSetupStep2` - Step 2: Verify SMS code (without setting password)
- `passwordSetupStep3` - Step 3: Set password after SMS verification
- `loginAgent` - Handles agent login with phone and password

**Key Features:**
- Three-step password setup process
- SMS code verification via eskizService
- Password setup allowed flag validation
- JWT token generation on login
- Device verification integration

---

### 2.3 Agent Finance Controller (`agentFinanceController.js`)

**Purpose:** Manages financial operations for agents based on their type (MFY, Tuman, Viloyat).

**Key Functions (MFY Agent):**
- `getMfyDailyReport` - Retrieves daily report with collected payments
- `getMfyPendingPayments` - Retrieves pending payments to submit
- `collectPayment` - Collects payment from customer
- `submitToDistrict` - Submits collected payments to district agent
- `getMfyStatistics` - Retrieves MFY agent statistics

**Key Functions (Tuman Agent):**
- `getDistrictReport` - Retrieves district report
- `getDistrictSubmissions` - Retrieves submissions from MFY agents
- `confirmDistrictSubmission` - Confirms submission from MFY agent
- `submitToProvince` - Submits to province agent
- `getDistrictStatistics` - Retrieves district statistics

**Key Functions (Viloyat Agent):**
- `getProvinceReport` - Retrieves province report
- `getProvinceSubmissions` - Retrieves submissions from district agents
- `confirmProvinceSubmission` - Confirms submission from district agent
- `submitToFinance` - Submits to finance department
- `getProvinceStatistics` - Retrieves province statistics

**Key Features:**
- Role-based access control (mfy, tuman, viloyat)
- Payment collection and submission workflow
- Daily report generation
- Statistics by agent type

---

### 2.4 Agent KPI Controller (`agentKpiController.js`)

**Purpose:** Manages KPI-related operations for agents with role-based calculations.

**Key Functions:**
- `getMyKpiSummary` - Retrieves agent's KPI bonus summary with filtering by date range and payment status
- `getMyKpiTransactions` - Retrieves detailed KPI transactions for the agent
- `getMyKpiDailyBalance` - Retrieves daily KPI balance report
- `getMyKpiDailyReport` - Retrieves daily KPI report with breakdown

**Key Features:**
- Role-based KPI amount calculation (mfy, tuman, viloyat)
- Date range filtering
- Payment status filtering (paid/unpaid)
- Daily balance and report generation
- Aggregation pipelines for efficient data processing

---

### 2.5 Agent Order Controller (`agentOrderController.js`)

**Purpose:** Manages order-related operations for agents with role-based filtering.

**Key Functions:**
- `getMyOrders` - Retrieves orders for the agent with extensive filtering (status, paymentStatus, paymentMethod, orderNumber, date range, price range, search)
- `getOrderById` - Retrieves a specific order with full details
- `confirmOrderDelivery` - Confirms order delivery by agent
- `getOrderStats` - Retrieves order statistics for the agent

**Key Features:**
- Role-based order filtering (MFY agent sees only assigned orders, Tuman agent sees tuman orders, Viloyat agent sees viloyat orders)
- Comprehensive filtering options
- Order confirmation workflow
- Statistics calculation

---

## Part 3: Contragent Controllers

### 3.1 Contragent Controller (`contragentController.js`)

**Purpose:** Manages comprehensive contragent-related operations with validation, profile management, and authentication.

**Key Functions:**
- `createContragent` - Creates a new contragent with validation (INN uniqueness, phone uniqueness, region validation, activityType validation, logo base64 validation)
- `getAllContragents` - Retrieves all contragents with filtering (status, viloyat, tuman, mfy, pagination)
- `getContragentById` - Retrieves a specific contragent by ID
- `updateContragent` - Updates contragent information with duplicate checking
- `deleteContragent` - Soft deletes a contragent (sets isDeleted=true)
- `loginContragent` - Handles contragent login with phone/password and device verification
- `getMe` - Retrieves current contragent's profile
- `updateMyProfile` - Updates contragent's own profile
- `updateMyLogo` - Updates contragent's logo (base64 image)

**Key Features:**
- INN (tax identification number) uniqueness validation
- Phone number uniqueness validation
- Region hierarchy validation (viloyat → tuman → MFY)
- Activity type (ContragentType) validation
- Logo base64 format validation
- Device verification integration for login
- Soft delete mechanism (isDeleted flag)
- Password hashing via pre-save hook
- Region and activity type population

---

### 3.2 Contragent Auth Controller (`contragentAuthController.js`)

**Purpose:** Handles contragent authentication operations with password setup and login.

**Key Functions:**
- `passwordSetupStep1` - Step 1: Request phone number for password setup, sends SMS code
- `passwordSetupStep2` - Step 2: Verify SMS code (without setting password)
- `passwordSetupStep3` - Step 3: Set password after SMS verification
- `loginContragent` - Handles contragent login with phone and password

**Key Features:**
- Three-step password setup process
- SMS code verification via eskizService
- Password setup allowed flag validation
- JWT token generation on login
- Device verification integration

---

### 3.3 Contragent Order Controller (`contragentOrderController.js`)

**Purpose:** Manages order-related operations for contragents, handling order requests and responses.

**Key Functions:**
- `getOrdersForContragent` - Retrieves orders with requests to this contragent, filters by status
- `getOrderById` - Retrieves a specific order with contragent request details
- `respondToOrderRequest` - Responds to order request (accept/reject)
- `deliverToPunkt` - Delivers order to punkt
- `getContragentStatistics` - Retrieves order statistics for the contragent
- `getTodayOrders` - Retrieves today's orders
- `getOrderHistory` - Retrieves order history with filtering

**Key Features:**
- Filters orders to show only requests to this contragent
- Filters order items to show only items requested from this contragent
- Request status management (pending, accepted, rejected)
- Removes sensitive data (kpiBonusPercent) from products
- Statistics calculation
- Order delivery to punkt workflow
- Order history tracking

---

### 3.4 Contragent Payment Controller (`contragentPaymentController.js`)

**Purpose:** Manages payment-related operations for contragents.

**Key Functions:**
- `getMyPaidPayments` - Retrieves paid payments for the contragent with date filtering
- `getMyUnpaidPayments` - Retrieves unpaid payments with overdue filtering
- `getMyPaymentStatistics` - Retrieves payment statistics (total paid, total unpaid, overdue amounts)
- `getMyPaymentById` - Retrieves a specific payment by ID

**Key Features:**
- Payment status filtering (paid/unpaid)
- Date range filtering for paid payments
- Overdue payment tracking
- Statistics calculation with totals
- Payment details with order information

---

### 3.5 Contragent Type Controller (`contragentTypeController.js`)

**Purpose:** Manages contragent types.

**Key Functions:**
- `createContragentType` - Creates a new contragent type
- `getContragentTypes` - Retrieves all contragent types
- `getContragentTypeById` - Retrieves a specific contragent type
- `updateContragentType` - Updates contragent type
- `deleteContragentType` - Deletes a contragent type

**Key Features:**
- Contragent type management
- CRUD operations

---

## Part 4: Marketplace Controllers

### 4.1 Marketplace Controller (`marketplaceController.js`)

**Purpose:** Provides public-facing endpoints for the marketplace, allowing users to browse products, categories, and contragents without authentication.

**Key Functions:**
- `getAllProducts` - Retrieves all products with filtering (category, subcategory, contragent, status, price range, search) - only approved and active products, removes kpiBonusPercent
- `getProductById` - Retrieves a specific product by ID (only approved and active, removes kpiBonusPercent)
- `getAllCategories` - Retrieves all categories with optional subcategories (status filtering, includeSubcategories option)
- `getCategoryById` - Retrieves a specific category with subcategories
- `getProductsByCategory` - Retrieves products by category with filtering
- `getAllContragents` - Retrieves all contragents with filtering (status, viloyat, tuman, mfy, search) - removes sensitive data (kpiBonusPercent, inn)
- `getContragentById` - Retrieves a specific contragent (removes sensitive data)
- `search` - General search functionality across products, categories, and contragents
- `filterProducts` - Advanced product filtering with multiple criteria

**Key Features:**
- Public access (no authentication required)
- Only approved and active products shown
- Sensitive data removal (kpiBonusPercent, inn)
- Comprehensive filtering and searching
- Category hierarchy support
- Product and contragent browsing
- Region-based filtering

---

### 4.2 Marketplace Auth Controller (`marketplaceAuthController.js`)

**Purpose:** Handles authentication for marketplace users with SMS-based registration and login.

**Key Functions:**
- `registerStep1` - Step 1: Send SMS code for registration
- `registerStep2` - Step 2: Verify SMS code and complete registration
- `loginStep1` - Step 1: Send SMS code for login
- `loginStep2` - Step 2: Verify SMS code and complete login
- `forgotPasswordStep1` - Step 1: Send SMS code for password reset
- `forgotPasswordStep2` - Step 2: Verify SMS code and reset password
- `resendSMSCode` - Resends SMS verification code
- `checkPhoneExists` - Checks if phone number already exists in the system

**Key Features:**
- Two-step registration and login process
- SMS code verification via eskizService
- Password reset functionality
- JWT token generation
- Phone number uniqueness validation

---

### 4.3 Marketplace Profile Controller (`marketplaceProfileController.js`)

**Purpose:** Manages marketplace user profiles and region selections.

**Key Functions:**
- `getMe` - Retrieves current user profile with populated regions
- `updateProfile` - Updates user profile (firstName, lastName, gender, birthDate)
- `updatePassword` - Updates user password with old password verification
- `updateAvatar` - Updates user avatar image
- `updateLocation` - Updates user location (viloyat, tuman, mfy)
- `getViloyatTuman` - Retrieves viloyat and tuman regions
- `updateViloyatTuman` - Updates viloyat and tuman region selections

**Key Features:**
- Profile field validation
- Password hashing with bcrypt
- Region hierarchy management
- Avatar image handling

---

### 4.4 Marketplace Partnership Request Controller (`marketplacePartnershipRequestController.js`)

**Purpose:** Manages partnership requests from marketplace users to become contragents.

**Key Functions (Marketplace User):**
- `createMarketplacePartnershipRequest` - Creates a partnership request with company details
- `getMyMarketplacePartnershipRequests` - Retrieves user's partnership requests
- `getMyMarketplacePartnershipRequestById` - Retrieves a specific request by ID

**Key Functions (Admin):**
- `getAllMarketplacePartnershipRequests` - Retrieves all partnership requests with filtering
- `getMarketplacePartnershipRequestById` - Retrieves a specific request
- `updateStatusToReviewing` - Updates request status to reviewing
- `updateStatusToContacted` - Updates request status to contacted
- `approveMarketplacePartnershipRequest` - Approves request and converts to contragent
- `rejectMarketplacePartnershipRequest` - Rejects request with reason
- `convertMarketplacePartnershipRequestToContragent` - Converts approved request to contragent

**Key Features:**
- Region validation (viloyat, tuman, mfy)
- Activity type (ContragentType) validation
- Status workflow (pending → reviewing → contacted → approved/rejected)
- Automatic contragent creation on approval
- Prevents duplicate pending requests

---

### 4.5 Featured Contragent Controller (`featuredContragentController.js`)

**Purpose:** Manages featured contragents on the marketplace.

**Key Functions (Admin):**
- `updateFeaturedContragents` - Updates featured contragents list by contragent IDs
- `getFeaturedContragentsForAdmin` - Retrieves featured contragents for admin view

**Key Functions (Marketplace):**
- `getFeaturedContragentsForMarketplace` - Retrieves featured contragents for public marketplace view

**Key Features:**
- Featured flag management (isFeaturedForMarketplace)
- Bulk update functionality
- Only active contragents can be featured
- Returns short info (name, logo) for marketplace

---

## Part 5: Order & Payment Controllers

### 5.1 Order Controller (`orderController.js`)

**Purpose:** Manages customer orders for marketplace users, handling order creation from cart, viewing, cancellation, and delivery confirmation.

**Key Functions:**
- `createOrder` - Creates an order from cart with comprehensive validation (product availability, region validation, cart clearing option)
- `getOrders` - Retrieves user's orders with filtering (status, paymentStatus, paymentMethod, date range, search)
- `getOrderById` - Retrieves a specific order by ID with full details
- `cancelOrder` - Cancels a pending order (only if status is pending)
- `confirmDelivery` - Confirms order delivery by customer (changes status to confirmed_by_customer)

**Key Features:**
- Cart to order conversion with automatic cart clearing
- Product availability validation (quantity check)
- Region hierarchy validation (viloyat → tuman → MFY)
- Order number generation
- Total price calculation (including KPI price)
- Payment method validation
- Order status workflow (pending → confirmed_by_customer)
- Product quantity deduction on order creation
- Comprehensive order filtering and search

---

### 5.2 Payment Controller (`paymentController.js`)

**Purpose:** Handles payment processing for marketplace users.

**Key Functions:**
- `payOrder` - Processes payment for a confirmed order, creates PaymentTransaction
- `getPaymentStatus` - Retrieves payment status for an order with transaction details

**Key Features:**
- Order ownership validation
- Order status validation (must be confirmed_by_customer)
- PaymentTransaction creation with transaction path
- Payment status tracking
- Integration with Order model for payment status updates

---

### 5.3 Cart Controller (`cartController.js`)

**Purpose:** Manages shopping cart operations for marketplace users.

**Key Functions:**
- `getCart` - Retrieves user's cart with populated product details, filters inactive products
- `addToCart` - Adds a product to cart or updates quantity if already exists
- `updateCartItem` - Updates cart item quantity
- `removeFromCart` - Removes an item from cart
- `clearCart` - Clears the entire cart

**Key Features:**
- Automatic cart creation if doesn't exist
- Product availability validation
- Active product filtering
- Removes sensitive data (kpiBonusPercent) from products
- Calculates totals (totalPrice, totalOriginalPrice, totalDiscount)
- Product population with category, subcategory, contragent, and delivery regions

---

## Part 6: Product & Category Controllers

### 6.1 Product Controller (`productController.js`)

**Purpose:** Handles comprehensive product management for contragents with validation, moderation workflow, and region management.

**Key Functions:**
- `createProduct` - Creates a new product with comprehensive validation (category/subcategory validation, delivery regions validation, product code generation, sets moderationStatus to 'pending')
- `getAllProducts` - Retrieves all products (public marketplace view, only approved and active)
- `getMyProducts` - Retrieves contragent's own products with filtering
- `getProductById` - Retrieves a specific product by ID
- `updateProduct` - Updates product information (if moderationStatus is 'pending' or 'rejected', sets back to 'pending')
- `updateProductStatus` - Updates product status (active/inactive)
- `deleteProduct` - Deletes a product

**Key Features:**
- Category validation (must be top-level, created by Admin, active)
- Subcategory validation (must belong to category, created by Admin, active)
- Delivery regions validation (viloyat required, tuman optional, hierarchy validation)
- Product code auto-generation
- Moderation workflow (pending → approved/rejected)
- Censored status inheritance from category/subcategory
- KPI bonus percent management
- Product image array management
- Quantity and pricing management
- Removes sensitive data (kpiBonusPercent) for marketplace view

---

### 6.2 Category Controller (`categoryController.js`)

**Purpose:** Provides public access to categories and subcategories with CRUD operations.

**Key Functions:**
- `createCategory` - Creates a new category (Admin only)
- `createSubcategory` - Creates a new subcategory (Admin only)
- `getAllCategories` - Retrieves all categories with filtering
- `getAllSubcategories` - Retrieves all subcategories with filtering
- `getCategoryById` - Retrieves a specific category
- `updateCategory` - Updates category information (Admin only)
- `updateSubcategory` - Updates subcategory information (Admin only)
- `updateCategoryStatus` - Updates category status (active/inactive) (Admin only)
- `deleteCategory` - Deletes a category (Admin only)
- `deleteSubcategory` - Deletes a subcategory (Admin only)

**Key Features:**
- Public read access
- Admin-only write operations
- Category hierarchy management
- Status management
- Parent-child relationship validation

---

## Part 7: Review Controllers

### 8.1 Review Controller (`reviewController.js`)

**Purpose:** Manages reviews and ratings for marketplace users with automatic contact creation for negative reviews.

**Key Functions (Marketplace User):**
- `createReview` - Creates a new review with validation (order ownership, order status, product in order, comment template or custom comment, automatic contact creation for rating <= 3)

**Key Functions (Admin):**
- `getAllReviews` - Retrieves all reviews with filtering (orderId, productId, userId, rating, isPositive, status, page, limit)
- `getReviewById` - Retrieves a specific review by ID
- `updateReviewStatus` - Updates review status (pending, approved, rejected)
- `deleteReview` - Deletes a review

**Key Features:**
- Order ownership validation
- Order status validation (must be confirmed_by_customer)
- Product validation (must exist in order)
- Comment template or custom comment (mutually exclusive)
- Automatic negative contact creation for rating <= 3
- isPositive flag management (auto-set to false for rating <= 3)
- ReviewContact automatic creation
- Rating validation (1-5 scale)
- Prevents duplicate reviews for same order+product

---

### 8.2 Review Comment Template Controller (`reviewCommentTemplateController.js`)

**Purpose:** Manages comment templates for reviews (Admin only).

**Key Functions:**
- `createCommentTemplate` - Creates a new comment template with order number
- `getAllCommentTemplates` - Retrieves all templates with filtering by isActive
- `getCommentTemplateById` - Retrieves a specific template by ID
- `updateCommentTemplate` - Updates template (text, order, isActive)
- `deleteCommentTemplate` - Deletes a template

**Key Features:**
- Order number uniqueness validation
- Active/inactive status management
- Template ordering
- Admin-only operations

---

### 8.3 Review Contact Controller (`reviewContactController.js`)

**Purpose:** Manages contact information for reviews (Admin only).

**Key Functions:**
- `getAllContacts` - Retrieves all contacts with filtering by status and isPositive
- `getPositiveContacts` - Retrieves positive contacts only
- `getNegativeContacts` - Retrieves negative contacts only
- `getContactById` - Retrieves a specific contact by ID
- `updateContactStatus` - Updates contact status (pending, resolved, ignored)
- `resolveContact` - Resolves a contact with resolution notes
- `ignoreContact` - Ignores a contact

**Key Features:**
- Contact status management
- Positive/negative filtering
- Resolution tracking with resolvedBy admin
- Pagination support
- Review and order information population

---

### 8.4 Review Initial Data Controller (`reviewInitialDataController.js`)

**Purpose:** Provides initial data needed for review creation (Admin and Marketplace).

**Key Functions (Admin):**
- `createInitialTemplates` - Creates initial comment templates (only if no templates exist)

**Key Functions (Marketplace):**
- `getActiveTemplates` - Retrieves active comment templates for review creation

**Key Features:**
- Template initialization
- Active template filtering
- Public access for marketplace users
- Admin-only template creation

---

## Part 9: Other Controllers

### 9.1 Punkt Controller (`punktController.js`)

**Purpose:** Manages comprehensive punkt-related operations with region validation, position checking, and authentication.

**Key Functions:**
- `createPunkt` - Creates a new punkt with validation (phone uniqueness, region validation, position checking - only one active punkt per viloyat+tuman combination)
- `getAllPunkts` - Retrieves all punkts with filtering (status, viloyat, tuman, pagination, excludes deleted)
- `getPunktById` - Retrieves a specific punkt by ID (excludes deleted)
- `updatePunkt` - Updates punkt information with duplicate checking
- `deletePunkt` - Soft deletes a punkt (sets isDeleted=true)
- `loginPunkt` - Handles punkt login with phone/password and device verification
- `getPunktsForSelection` - Retrieves punkts for selection dropdowns
- `getContragentsInRegion` - Retrieves contragents in punkt's region

**Key Features:**
- Phone number uniqueness validation (excludes deleted)
- Region validation (viloyat required, tuman optional)
- Position uniqueness checking (only one active punkt per viloyat+tuman)
- Device verification integration for login
- Soft delete mechanism (isDeleted flag)
- Password hashing via pre-save hook
- Region population (viloyat, tuman)
- Contragent region filtering

---

### 9.2 Punkt Auth Controller (`punktAuthController.js`)

**Purpose:** Handles authentication for punkts with password setup and login.

**Key Functions:**
- `passwordSetupStep1` - Step 1: Request phone number for password setup, sends SMS code
- `passwordSetupStep2` - Step 2: Verify SMS code (without setting password)
- `passwordSetupStep3` - Step 3: Set password after SMS verification
- `loginPunkt` - Handles punkt login with phone and password

**Key Features:**
- Three-step password setup process
- SMS code verification via eskizService
- Password setup allowed flag validation
- JWT token generation on login
- Device verification integration

---

### 9.3 Punkt KPI Controller (`punktKpiController.js`)

**Purpose:** Manages KPI-related operations for punkts with comprehensive reporting.

**Key Functions:**
- `getMyKpiSummary` - Retrieves punkt's KPI bonus summary with filtering by date range and payment status
- `getMyKpiTransactions` - Retrieves detailed KPI transactions for the punkt
- `getMyKpiDailyBalance` - Retrieves daily KPI balance report
- `getMyKpiDailyReport` - Retrieves daily KPI report with breakdown

**Key Features:**
- Multiple KPI amount calculation (punkt, fromPunkt, toPunkt)
- Date range filtering
- Payment status filtering (paid/unpaid)
- Daily balance and report generation
- Aggregation pipelines for efficient data processing

---

### 9.4 Punkt Order Controller (`punktOrderController.js`)

**Purpose:** Manages comprehensive order-related operations for punkts with extensive workflow management, filtering, and reporting capabilities.

**Key Functions (Order Retrieval):**
- `getMyOrders` - Retrieves orders for the punkt with extensive filtering (status, paymentStatus, paymentMethod, orderNumber, date range, price range, search), handles deleted punkts properly
- `getOrderById` - Retrieves a specific order with full details and proper deleted punkt handling
- `getTodayOrders` - Retrieves today's orders
- `getOrderHistory` - Retrieves order history with filtering

**Key Functions (Order Workflow):**
- `confirmOrder` - Confirms order by punkt (changes status to confirmed_by_punkt)
- `requestToPunkts` - Requests order to multiple punkts
- `getPunktRequests` - Retrieves punkt requests for orders
- `respondToRequest` - Responds to punkt request (accept/reject)
- `requestToContragent` - Requests order to contragent
- `requestToPunkt` - Requests order to another punkt (punkt-to-punkt)
- `getPunktToPunktRequests` - Retrieves punkt-to-punkt requests
- `respondToPunktToPunktRequest` - Responds to punkt-to-punkt request
- `assignOrderToAgent` - Assigns order to an agent
- `sendToPunkt` - Sends order to another punkt
- `receiveFromPunkt` - Receives order from another punkt
- `receiveFromContragent` - Receives order from contragent

**Key Functions (Order Analysis):**
- `getOrderContragentIds` - Retrieves contragent IDs from order items
- `analyzeOrderProductsByTuman` - Analyzes order products by tuman for reporting

**Key Features:**
- Comprehensive order filtering (status, payment, date, price, search)
- Deleted punkt handling (marks but keeps deleted punkt references)
- Order workflow management (confirm, request, assign, send, receive)
- Punkt-to-punkt order transfer
- Contragent request management
- Agent assignment
- Order analysis and reporting
- Regional filtering (viloyat, tuman, MFY)

---

### 9.5 Region Controller (`regionController.js`)

**Purpose:** Manages regions in the system with comprehensive CRUD operations and filtering.

**Key Functions:**
- `createRegion` - Creates a new region with validation (name, type, parent, code, status)
- `getAllRegions` - Retrieves all regions with filtering (type, parent, status, pagination)
- `getRegionById` - Retrieves a specific region by ID
- `updateRegion` - Updates region information
- `deleteRegion` - Deletes a region
- `getRegionsByType` - Retrieves regions by type (region, district, mfy)
- `getRegionChildren` - Retrieves child regions for a parent region
- `updateRegionStatus` - Updates region status (active/inactive)

**Key Features:**
- Region hierarchy management (parent-child relationships)
- Region type validation (region, district, mfy)
- Code uniqueness validation
- Status management
- Comprehensive filtering options
- CRUD operations

---

### 9.6 Device Verification Controller (`deviceVerificationController.js`)

**Purpose:** Handles device verification for all user types (Admin, Contragent, Punkt, Agent).

**Key Functions:**
- `requestDeviceVerificationCode` - Step 1: Requests device verification code via SMS
- `verifyDevice` - Step 2: Verifies device with code and registers/updates device
- `resendDeviceVerificationCode` - Resends device verification code

**Key Features:**
- Multi-user type support (admin, contragent, punkt, agent)
- SMS code verification via eskizService
- Device registration with metadata (deviceId, deviceName, deviceType, platform, OS, browser, IP, location)
- Device status management (active/inactive)
- Security enforcement for device-based authentication

---

### 9.7 Notification Controller (`notificationController.js`)

**Purpose:** Manages notifications for users with real-time Socket.io integration.

**Key Functions (Admin):**
- `createNotification` - Creates notification and sends via Socket.io to target users/groups

**Key Functions (All Users):**
- `getMyNotifications` - Retrieves user's notifications with filtering and pagination
- `getMyNotificationById` - Retrieves a specific notification by ID
- `markNotificationAsRead` - Marks a notification as read
- `markAllNotificationsAsRead` - Marks all user's notifications as read
- `deleteNotification` - Deletes a notification
- `getUnreadCount` - Retrieves unread notification count

**Key Features:**
- Target type support (all, punkts, viloyat_agents, tuman_agents, mfy_agents, marketplace_users, contragents)
- Region-based targeting (viloyatId, tumanId, mfyId)
- Specific user targeting via targetIds
- Real-time Socket.io notifications
- Read/unread status tracking
- Notification type management (info, success, warning, error)

---

### 9.8 Partnership Request Controller (`partnershipRequestController.js`)

**Purpose:** Manages partnership requests from marketplace users to become contragents.

**Key Functions (Marketplace):**
- `createPartnershipRequest` - Creates a partnership request with company details (can be anonymous or authenticated)
- `getMyPartnershipRequests` - Retrieves authenticated user's partnership requests

**Key Functions (Admin):**
- `getAllPartnershipRequests` - Retrieves all partnership requests with filtering
- `getPartnershipRequestById` - Retrieves a specific request by ID
- `updateContactStatus` - Updates contact status (not_contacted, contacted)
- `updateRequestStatus` - Updates request status (pending, reviewing, approved, rejected)
- `convertPartnershipRequestToContragent` - Converts approved request to contragent

**Key Features:**
- Region validation (viloyat, tuman, mfy)
- Activity type (ContragentType) validation
- Status workflow (pending → reviewing → approved/rejected)
- Contact status tracking
- Automatic contragent creation on conversion
- Supports both authenticated and anonymous requests

---

## Summary

This documentation covers all controllers in the application, organized into 9 logical parts:

1. **Admin Controllers** - Administrative management functions
2. **Agent Controllers** - Agent-related operations
3. **Contragent Controllers** - Contragent management
4. **Marketplace Controllers** - Public marketplace functionality
5. **Order & Payment Controllers** - Order and payment processing
6. **Product & Category Controllers** - Product and category management
7. **Review Controllers** - Review and rating system
8. **Other Controllers** - Additional functionality (Punkt, Region, Device, Notification, Partnership)

Each controller is designed to handle specific aspects of the application's functionality, with proper authentication, validation, and error handling mechanisms in place.

