# Routes Documentation

This document provides comprehensive documentation for all routes in the application, organized by route groups.

---

## Base URL
All routes are prefixed with `/api` unless otherwise specified.

---

## Part 1: Admin Routes (`/api/admins`)

### Authentication
- `POST /api/admins/login` - Admin login (public)

### Admin Management
- `POST /api/admins` - Create admin (requires validation)
- `GET /api/admins` - Get all admins
- `GET /api/admins/:id` - Get admin by ID
- `PUT /api/admins/:id` - Update admin (requires validation)
- `DELETE /api/admins/:id` - Delete admin

### Dashboard & Statistics
- `GET /api/admins/dashboard/overview` - Dashboard overview (requires adminAuth)
- `GET /api/admins/dashboard/statistics` - Overall dashboard statistics (requires adminAuth)
- `GET /api/admins/dashboard/statistics/daily` - Daily statistics (requires adminAuth)
- `GET /api/admins/dashboard/statistics/weekly` - Weekly statistics (requires adminAuth)
- `GET /api/admins/dashboard/statistics/monthly` - Monthly statistics (requires adminAuth)
- `GET /api/admins/dashboard/statistics/orders` - Order statistics (requires adminAuth)
- `GET /api/admins/dashboard/statistics/finance` - Finance statistics (requires adminAuth)
- `GET /api/admins/dashboard/statistics/users` - User statistics (requires adminAuth)
- `GET /api/admins/dashboard/statistics/products` - Product statistics (requires adminAuth)

### Category Management
- `POST /api/admins/categories` - Create category (requires adminAuth, validation)
- `GET /api/admins/categories` - Get all categories (requires adminAuth)
- `GET /api/admins/categories/:id` - Get category by ID (requires adminAuth)
- `PUT /api/admins/categories/:id` - Update category (requires adminAuth, validation)
- `PUT /api/admins/categories/:id/status` - Update category status (requires adminAuth, validation)
- `DELETE /api/admins/categories/:id` - Delete category (requires adminAuth)
- `POST /api/admins/categories/subcategories` - Create subcategory (requires adminAuth, validation)
- `GET /api/admins/categories/subcategories` - Get all subcategories (requires adminAuth)
- `PUT /api/admins/categories/subcategories/:id` - Update subcategory (requires adminAuth, validation)
- `PUT /api/admins/categories/subcategories/:id/status` - Update subcategory status (requires adminAuth, validation)
- `DELETE /api/admins/categories/subcategories/:id` - Delete subcategory (requires adminAuth)

### Admin Data Access
- `GET /api/admins/data/categories` - Get all categories for admin (requires adminAuth)
- `GET /api/admins/data/subcategories` - Get all subcategories for admin (requires adminAuth)
- `GET /api/admins/data/categories/:id` - Get category by ID for admin (requires adminAuth)
- `GET /api/admins/data/products` - Get all products for admin (requires adminAuth)
- `GET /api/admins/data/products/:id` - Get product by ID for admin (requires adminAuth)
- `PUT /api/admins/products/:id` - Update product (requires adminAuth, validation)
- `GET /api/admins/data/sms-verifications` - Get all SMS verifications (requires adminAuth)
- `GET /api/admins/data/sms-verifications/:id` - Get SMS verification by ID (requires adminAuth)
- `GET /api/admins/data/marketplace-users` - Get all marketplace users (requires adminAuth)
- `GET /api/admins/data/marketplace-users/:id` - Get marketplace user by ID (requires adminAuth)
- `GET /api/admins/data/orders` - Get all orders (requires adminAuth)
- `GET /api/admins/data/orders/marketplace` - Get marketplace orders (requires adminAuth)
- `GET /api/admins/data/orders/confirmed-by-punkt` - Get orders confirmed by punkt (requires adminAuth)
- `GET /api/admins/data/orders/requested-to-contragents` - Get orders requested to contragents (requires adminAuth)
- `GET /api/admins/data/orders/delivered-to-punkt` - Get orders delivered to punkt (requires adminAuth)
- `GET /api/admins/data/orders/assigned-to-agents` - Get orders assigned to agents (requires adminAuth)
- `GET /api/admins/data/orders/confirmed-by-agents` - Get orders confirmed by agents (requires adminAuth)
- `GET /api/admins/data/orders/confirmed-by-customers` - Get orders confirmed by customers (requires adminAuth)
- `GET /api/admins/data/orders/cancelled` - Get cancelled orders (requires adminAuth)
- `GET /api/admins/data/orders/:id` - Get order by ID (requires adminAuth)
- `GET /api/admins/data/agents` - Get agents in region (requires adminAuth)
- `GET /api/admins/data/punkts` - Get punkts in region (requires adminAuth)

### Product Moderation
- `GET /api/admins/products/moderation/pending` - Get pending products (requires adminAuth)
- `GET /api/admins/products/moderation/pending/:id` - Get pending product by ID (requires adminAuth)
- `GET /api/admins/products/moderation` - Get all products for moderation (requires adminAuth)
- `POST /api/admins/products/moderation/:id/approve` - Approve product (requires adminAuth)
- `POST /api/admins/products/moderation/:id/reject` - Reject product (requires adminAuth, validation)

### KPI Management
- `POST /api/admins/kpi/distributions` - Create KPI distribution (requires adminAuth)
- `GET /api/admins/kpi/distributions` - Get all KPI distributions (requires adminAuth)
- `GET /api/admins/kpi/distributions/:id` - Get KPI distribution by ID (requires adminAuth)
- `PUT /api/admins/kpi/distributions/:id` - Update KPI distribution (requires adminAuth)
- `DELETE /api/admins/kpi/distributions/:id` - Delete KPI distribution (requires adminAuth)
- `GET /api/admins/kpi/distributions/initial/defaults` - Get initial KPI distribution defaults (requires adminAuth)
- `GET /api/admins/kpi/transactions` - Get all KPI transactions (requires adminAuth)
- `GET /api/admins/kpi/transactions/:id` - Get KPI transaction by ID (requires adminAuth)
- `GET /api/admins/kpi/statistics` - Get KPI statistics (requires adminAuth)
- `GET /api/admins/kpi/data/viloyat-agents` - Get viloyat agents KPI (requires adminAuth)
- `GET /api/admins/kpi/data/tuman-agents` - Get tuman agents KPI (requires adminAuth)
- `GET /api/admins/kpi/data/mfy-agents` - Get MFY agents KPI (requires adminAuth)
- `GET /api/admins/kpi/data/punkts` - Get punkts KPI (requires adminAuth)
- `GET /api/admins/kpi/data/agents/:agentId` - Get agent KPI details (requires adminAuth)
- `GET /api/admins/kpi/data/punkts/:punktId` - Get punkt KPI details (requires adminAuth)

### Sales Statistics
- `GET /api/admins/stats/sales/summary` - Get sales statistics summary (requires adminAuth)
- `GET /api/admins/stats/sales/viloyats` - Get sales statistics by viloyats (requires adminAuth)
- `GET /api/admins/stats/sales/viloyats/:viloyatId` - Get sales statistics by viloyat ID (requires adminAuth)
- `GET /api/admins/stats/sales/tumans/:tumanId` - Get sales statistics by tuman ID (requires adminAuth)
- `GET /api/admins/stats/sales/mfys/:mfyId` - Get sales statistics by MFY ID (requires adminAuth)

### Featured Contragents
- `GET /api/admins/featured-contragents` - Get featured contragents for admin (requires adminAuth)
- `PUT /api/admins/featured-contragents` - Update featured contragents list (requires adminAuth, validation)

### Partnership Requests
- `GET /api/admins/partnership-requests` - Get all partnership requests (requires adminAuth)
- `GET /api/admins/partnership-requests/:id` - Get partnership request by ID (requires adminAuth)
- `PATCH /api/admins/partnership-requests/:id/contact-status` - Update contact status (requires adminAuth, validation)
- `PATCH /api/admins/partnership-requests/:id/status` - Update request status (requires adminAuth, validation)
- `POST /api/admins/partnership-requests/:id/convert-to-contragent` - Convert partnership request to contragent (requires adminAuth)

### Marketplace Partnership Requests
- `GET /api/admins/marketplace-partnership-requests` - Get all marketplace partnership requests (requires adminAuth)
- `GET /api/admins/marketplace-partnership-requests/:id` - Get marketplace partnership request by ID (requires adminAuth)
- `PATCH /api/admins/marketplace-partnership-requests/:id/reviewing` - Update status to reviewing (requires adminAuth)
- `PATCH /api/admins/marketplace-partnership-requests/:id/contacted` - Update status to contacted (requires adminAuth, validation)
- `PATCH /api/admins/marketplace-partnership-requests/:id/approve` - Approve marketplace partnership request (requires adminAuth, validation)
- `PATCH /api/admins/marketplace-partnership-requests/:id/reject` - Reject marketplace partnership request (requires adminAuth, validation)
- `POST /api/admins/marketplace-partnership-requests/:id/convert-to-contragent` - Convert to contragent (requires adminAuth)

### Device Management
- `GET /api/admins/devices` - Get all devices (requires adminAuth)
- `GET /api/admins/devices/statistics` - Get device statistics (requires adminAuth)
- `GET /api/admins/devices/:id` - Get device by ID (requires adminAuth)
- `GET /api/admins/devices/user/:userModel/:userId` - Get user's devices (requires adminAuth)
- `PUT /api/admins/devices/:id/deactivate` - Deactivate device (requires adminAuth)
- `PUT /api/admins/devices/:id/activate` - Activate device (requires adminAuth)
- `DELETE /api/admins/devices/:id` - Delete device (requires adminAuth)

### Archive
- `GET /api/admins/archive/punkts` - Get archived punkts (requires adminAuth)
- `GET /api/admins/archive/agents` - Get archived agents (requires adminAuth)
- `GET /api/admins/archive/punkts/:id/work` - Get archived punkt with work (requires adminAuth)
- `GET /api/admins/archive/agents/:id/work` - Get archived agent with work (requires adminAuth)

---

## Part 2: Agent Routes (`/api/agents`)

### Authentication
- `POST /api/agents/password-setup/step1` - Password setup step 1 (public, validation)
- `POST /api/agents/password-setup/step2` - Password setup step 2 (public, validation)
- `POST /api/agents/password-setup/step3` - Password setup step 3 (public, validation)
- `POST /api/agents/login` - Agent login (public, validation)

### Agent Management
- `POST /api/agents` - Create agent (validation)
- `GET /api/agents` - Get all agents (with filters: status, viloyat, tuman, mfy, agentType, page, limit)
- `GET /api/agents/selection` - Get agents for selection (public)
- `GET /api/agents/:id` - Get agent by ID
- `PUT /api/agents/:id` - Update agent (validation)
- `DELETE /api/agents/:id` - Delete agent

### Notifications
- `GET /api/agents/notifications/list` - Get agent notifications (requires agentAuth)
- `GET /api/agents/notifications/unread-count` - Get unread notification count (requires agentAuth)
- `POST /api/agents/notifications/:notificationId/read` - Mark notification as read (requires agentAuth)
- `POST /api/agents/notifications/read-all` - Mark all notifications as read (requires agentAuth)

---

## Part 3: Agent Order Routes (`/api/agent`)

All routes require agent authentication.

### Orders
- `GET /api/agent/orders` - Get my orders
- `GET /api/agent/orders/today` - Get today's orders
- `GET /api/agent/orders/history` - Get order history
- `GET /api/agent/orders/:id` - Get order by ID
- `POST /api/agent/orders/:id/confirm` - Confirm order by agent
- `POST /api/agent/orders/:id/delivered` - Mark order as delivered

### KPI
- `GET /api/agent/kpi/summary` - Get KPI summary
- `GET /api/agent/kpi/transactions` - Get KPI transactions
- `GET /api/agent/kpi/balance` - Get daily KPI balance
- `GET /api/agent/kpi/reports/daily` - Get daily KPI report

---

## Part 4: Agent Finance Routes (`/api/agent-finance`)

All routes require agent authentication.

### MFY Agent Routes
- `GET /api/agent-finance/mfy/daily-report` - Get MFY daily report
- `GET /api/agent-finance/mfy/pending-payments` - Get MFY pending payments
- `POST /api/agent-finance/mfy/collect-payment/:transactionId` - Collect payment
- `POST /api/agent-finance/mfy/submit-to-district` - Submit to district
- `GET /api/agent-finance/mfy/statistics` - Get MFY statistics

### Tuman Agent Routes
- `GET /api/agent-finance/district/report` - Get district report
- `GET /api/agent-finance/district/submissions` - Get district submissions
- `POST /api/agent-finance/district/confirm-submission/:submissionId` - Confirm district submission
- `POST /api/agent-finance/district/submit-to-province` - Submit to province
- `GET /api/agent-finance/district/statistics` - Get district statistics

### Viloyat Agent Routes
- `GET /api/agent-finance/province/report` - Get province report
- `GET /api/agent-finance/province/submissions` - Get province submissions
- `POST /api/agent-finance/province/confirm-submission/:submissionId` - Confirm province submission
- `POST /api/agent-finance/province/submit-to-finance` - Submit to finance
- `GET /api/agent-finance/province/statistics` - Get province statistics

---

## Part 5: Contragent Routes (`/api/contragents`)

### Authentication
- `POST /api/contragents/password-setup/step1` - Password setup step 1 (validation)
- `POST /api/contragents/password-setup/step2` - Password setup step 2 (validation)
- `POST /api/contragents/password-setup/step3` - Password setup step 3 (validation)
- `POST /api/contragents/login` - Login contragent (old endpoint, validation)
- `POST /api/contragents/auth/login` - Login contragent (new endpoint, validation)

### Contragent Management
- `POST /api/contragents` - Create contragent (validation)
- `GET /api/contragents` - Get all contragents (with filters: status, viloyat, tuman, mfy, page, limit)
- `GET /api/contragents/:id` - Get contragent by ID
- `PUT /api/contragents/:id` - Update contragent (validation)
- `DELETE /api/contragents/:id` - Delete contragent

### Profile (Requires contragentAuth)
- `GET /api/contragents/me` - Get current contragent profile
- `PUT /api/contragents/me` - Update profile (validation)
- `PATCH /api/contragents/me/logo` - Update logo (validation)

### Notifications
- `GET /api/contragents/notifications/list` - Get contragent notifications (requires contragentAuth)
- `GET /api/contragents/notifications/unread-count` - Get unread notification count (requires contragentAuth)
- `POST /api/contragents/notifications/:notificationId/read` - Mark notification as read (requires contragentAuth)
- `POST /api/contragents/notifications/read-all` - Mark all notifications as read (requires contragentAuth)

### Payments
- `GET /api/contragents/payments/paid` - Get paid payments (requires contragentAuth)
- `GET /api/contragents/payments/unpaid` - Get unpaid payments (requires contragentAuth)
- `GET /api/contragents/payments/statistics` - Get payment statistics (requires contragentAuth)
- `GET /api/contragents/payments/:id` - Get payment by ID (requires contragentAuth)

---

## Part 6: Contragent Order Routes (`/api/contragent`)

All routes require contragent authentication.

### Orders
- `GET /api/contragent/orders` - Get orders for contragent
- `GET /api/contragent/orders/:id` - Get order by ID
- `POST /api/contragent/orders/:orderId/respond` - Respond to order request
- `POST /api/contragent/orders/:orderId/deliver-to-punkt` - Deliver order to punkt
- `GET /api/contragent/statistics` - Get contragent statistics
- `GET /api/contragent/today` - Get today's orders
- `GET /api/contragent/history` - Get order history

---

## Part 7: Punkt Routes (`/api/punkts`)

### Authentication
- `POST /api/punkts/password-setup/step1` - Password setup step 1 (validation)
- `POST /api/punkts/password-setup/step2` - Password setup step 2 (validation)
- `POST /api/punkts/password-setup/step3` - Password setup step 3 (validation)
- `POST /api/punkts/login` - Punkt login (validation)

### Punkt Management
- `POST /api/punkts` - Create punkt (validation)
- `GET /api/punkts` - Get all punkts (with filters: status, viloyat, tuman, page, limit)
- `GET /api/punkts/selection` - Get punkts for selection (public)
- `GET /api/punkts/:id` - Get punkt by ID
- `PUT /api/punkts/:id` - Update punkt (validation)
- `DELETE /api/punkts/:id` - Delete punkt

### Data (Requires punktAuth)
- `GET /api/punkts/data/contragents` - Get contragents in punkt's region

### Notifications
- `GET /api/punkts/notifications/list` - Get punkt notifications (requires punktAuth)
- `GET /api/punkts/notifications/unread-count` - Get unread notification count (requires punktAuth)
- `POST /api/punkts/notifications/:notificationId/read` - Mark notification as read (requires punktAuth)
- `POST /api/punkts/notifications/read-all` - Mark all notifications as read (requires punktAuth)

---

## Part 8: Punkt Order Routes (`/api/punkt`)

All routes require punkt authentication.

### Orders
- `GET /api/punkt/orders` - Get my orders
- `GET /api/punkt/orders/today` - Get today's orders
- `GET /api/punkt/orders/history` - Get order history
- `GET /api/punkt/orders/:id` - Get order by ID
- `GET /api/punkt/orders/:id/contragents` - Get contragent IDs from order products
- `POST /api/punkt/orders/:id/confirm` - Confirm order
- `POST /api/punkt/orders/:id/assign-to-agent` - Assign order to agent
- `POST /api/punkt/orders/:id/request-to-contragent` - Request to contragent
- `POST /api/punkt/orders/:id/request-to-punkt` - Request to another punkt
- `POST /api/punkt/orders/:id/request-to-punkts` - Request to other punkts
- `POST /api/punkt/orders/:id/send-to-punkt` - Send to punkt
- `POST /api/punkt/orders/:id/receive-from-punkt` - Receive from punkt
- `POST /api/punkt/orders/:id/receive-from-contragent` - Receive from contragent

### Requests
- `GET /api/punkt/requests` - Get requests to my punkt
- `POST /api/punkt/requests/:orderId/respond` - Respond to request
- `GET /api/punkt/punkt-to-punkt-requests` - Get punkt to punkt requests
- `POST /api/punkt/punkt-to-punkt-requests/:orderId/respond` - Respond to punkt to punkt request

### KPI
- `GET /api/punkt/kpi/summary` - Get KPI summary
- `GET /api/punkt/kpi/transactions` - Get KPI transactions
- `GET /api/punkt/kpi/balance` - Get daily KPI balance
- `GET /api/punkt/kpi/reports/daily` - Get daily KPI report

---

## Part 9: Category Routes (`/api/category`)

### Categories
- `GET /api/category/list` - Get all categories (optional contragentAuth)
- `GET /api/category/:id` - Get category by ID (optional contragentAuth)

### Subcategories
- `GET /api/category/subcategory/list` - Get all subcategories (optional contragentAuth)

---

## Part 10: Product Routes (`/api/product`)

### Products (Public)
- `GET /api/product/list` - Get all products (public)
- `GET /api/product/:id` - Get product by ID (public)

### Products (Requires contragentAuth)
- `POST /api/product/create` - Create product (requires contragentAuth, validation)
- `GET /api/product/my` - Get my products (requires contragentAuth)
- `PUT /api/product/:id` - Update product (requires contragentAuth, validation)
- `PUT /api/product/:id/status` - Update product status (requires contragentAuth, validation)
- `DELETE /api/product/:id` - Delete product (requires contragentAuth)

---

## Part 11: Marketplace Routes (`/api/marketplace`)

### Authentication
- `GET /api/marketplace/check-phone` - Check if phone exists (public)
- `POST /api/marketplace/register/step1` - Register step 1 (validation)
- `POST /api/marketplace/register/step2` - Register step 2 (validation)
- `POST /api/marketplace/login/step1` - Login step 1 (validation)
- `POST /api/marketplace/login/step2` - Login step 2 (validation)
- `POST /api/marketplace/forgot-password/step1` - Forgot password step 1 (validation)
- `POST /api/marketplace/forgot-password/step2` - Forgot password step 2 (validation)
- `POST /api/marketplace/resend-code` - Resend SMS code (validation)

### Marketplace Data (Public)
- `GET /api/marketplace/search` - Search across products, categories, contragents
- `GET /api/marketplace/filter` - Filter products
- `GET /api/marketplace/products` - Get all products
- `GET /api/marketplace/products/:id` - Get product by ID
- `GET /api/marketplace/categories` - Get all categories
- `GET /api/marketplace/categories/:id` - Get category by ID
- `GET /api/marketplace/categories/:id/products` - Get products by category
- `GET /api/marketplace/contragents` - Get all contragents
- `GET /api/marketplace/contragents/:id` - Get contragent by ID
- `GET /api/marketplace/featured-contragents` - Get featured contragents (public)

### Cart (Requires marketplaceUserAuth)
- `GET /api/marketplace/cart` - Get cart
- `POST /api/marketplace/cart` - Add to cart (validation)
- `PUT /api/marketplace/cart/:productId` - Update cart item (validation)
- `DELETE /api/marketplace/cart/:productId` - Remove from cart
- `DELETE /api/marketplace/cart` - Clear cart

### Orders (Requires marketplaceUserAuth)
- `POST /api/marketplace/orders` - Create order (validation)
- `GET /api/marketplace/orders` - Get my orders
- `GET /api/marketplace/orders/:id` - Get order by ID
- `DELETE /api/marketplace/orders/:id` - Cancel order
- `POST /api/marketplace/orders/:id/confirm-delivery` - Confirm delivery

### Profile (Requires marketplaceUserAuth)
- `GET /api/marketplace/me` - Get current user profile
- `PUT /api/marketplace/me` - Update profile (validation)
- `PATCH /api/marketplace/me/password` - Update password (validation)
- `PATCH /api/marketplace/me/avatar` - Update avatar (validation)
- `PATCH /api/marketplace/me/location` - Update location (validation)
- `GET /api/marketplace/me/viloyat-tuman` - Get viloyat and tuman
- `PATCH /api/marketplace/me/viloyat-tuman` - Update viloyat and tuman (validation)

### Notifications (Requires marketplaceUserAuth)
- `GET /api/marketplace/notifications/list` - Get notifications
- `GET /api/marketplace/notifications/unread-count` - Get unread count
- `POST /api/marketplace/notifications/:notificationId/read` - Mark notification as read
- `POST /api/marketplace/notifications/read-all` - Mark all notifications as read

### Partnership Requests
- `POST /api/marketplace/partnership-requests` - Create partnership request (optional authentication, validation)
- `GET /api/marketplace/partnership-requests` - Get my partnership requests (requires marketplaceUserAuth)
- `POST /api/marketplace/marketplace-partnership-requests` - Create marketplace partnership request (requires marketplaceUserAuth, validation)
- `GET /api/marketplace/marketplace-partnership-requests` - Get my marketplace partnership requests (requires marketplaceUserAuth)
- `GET /api/marketplace/marketplace-partnership-requests/:id` - Get marketplace partnership request by ID (requires marketplaceUserAuth)

---

## Part 12: Payment Routes (`/api/payment`)

All routes require marketplaceUserAuth.

- `POST /api/payment/orders/:orderId/pay` - Pay order
- `GET /api/payment/orders/:orderId/payment-status` - Get payment status

---

## Part 13: Admin Finance Routes (`/api/admin-finance`)

All routes require adminAuth.

### Reports
- `GET /api/admin-finance/reports/daily` - Get daily report
- `GET /api/admin-finance/reports/weekly` - Get weekly report
- `GET /api/admin-finance/reports/monthly` - Get monthly report
- `GET /api/admin-finance/reports/yearly` - Get yearly report
- `GET /api/admin-finance/reports/custom` - Get custom report

### Submissions
- `GET /api/admin-finance/submissions/pending` - Get pending submissions
- `POST /api/admin-finance/submissions/:submissionId/confirm` - Confirm submission
- `POST /api/admin-finance/submissions/:submissionId/reject` - Reject submission

### Transactions
- `GET /api/admin-finance/transactions` - Get all transactions

### Statistics
- `GET /api/admin-finance/statistics` - Get overall statistics
- `GET /api/admin-finance/statistics/region` - Get statistics by region
- `GET /api/admin-finance/statistics/district` - Get statistics by district
- `GET /api/admin-finance/statistics/mfy` - Get statistics by MFY
- `GET /api/admin-finance/statistics/agent-performance` - Get agent performance

### Balance
- `GET /api/admin-finance/balance` - Get finance balance
- `GET /api/admin-finance/balance/total-received` - Get total received
- `GET /api/admin-finance/balance/total-distributed` - Get total distributed
- `GET /api/admin-finance/balance/finance-kpi` - Get finance KPI amount
- `GET /api/admin-finance/balance/delivery-service-kpi` - Get delivery service KPI amount
- `GET /api/admin-finance/balance/total-balance` - Get total balance

---

## Part 14: Admin KPI Payment Routes (`/api/admin-kpi-payments`)

All routes require adminAuth.

- `GET /api/admin-kpi-payments/unpaid` - Get unpaid payments
- `GET /api/admin-kpi-payments/unpaid/grouped` - Get unpaid payments grouped
- `POST /api/admin-kpi-payments/mark-as-paid` - Mark payments as paid
- `GET /api/admin-kpi-payments/statistics` - Get payment statistics
- `GET /api/admin-kpi-payments/paid` - Get paid payments
- `POST /api/admin-kpi-payments/sync` - Sync KPI payments

---

## Part 15: Admin Contragent Payment Routes (`/api/admin-contragent-payments`)

All routes require adminAuth.

- `POST /api/admin-contragent-payments/:id/pay` - Pay contragent payment
- `POST /api/admin-contragent-payments/pay-by-date-range` - Pay payments by date range
- `GET /api/admin-contragent-payments/unpaid` - Get unpaid payments
- `GET /api/admin-contragent-payments/unpaid/grouped` - Get unpaid payments grouped
- `POST /api/admin-contragent-payments/mark-as-paid` - Mark payments as paid
- `GET /api/admin-contragent-payments/statistics` - Get payment statistics
- `GET /api/admin-contragent-payments/paid` - Get paid payments
- `POST /api/admin-contragent-payments/sync` - Sync contragent payments

---

## Part 16: Region Routes (`/api/regions`)

### Regions
- `POST /api/regions` - Create region (validation)
- `GET /api/regions` - Get all regions (with filters: type, parent, status, page, limit)
- `GET /api/regions/type/:type` - Get regions by type (with filters: status, parent)
- `GET /api/regions/:id` - Get region by ID
- `GET /api/regions/:id/children` - Get children of a region (with filter: status)
- `PUT /api/regions/:id` - Update region (validation)
- `PATCH /api/regions/:id/status` - Update region status
- `DELETE /api/regions/:id` - Delete region

---

## Part 17: Review Routes (`/api/reviews`)

### Public Routes
- `GET /api/reviews/templates` - Get active templates
- `GET /api/reviews/product/:productId` - Get product reviews

### Marketplace User Routes
- `POST /api/reviews` - Create review (requires marketplaceUserAuth)

### Admin Routes
- `POST /api/reviews/admin/comment-templates` - Create comment template (requires adminAuth)
- `GET /api/reviews/admin/comment-templates` - Get all comment templates (requires adminAuth)
- `GET /api/reviews/admin/comment-templates/:id` - Get comment template by ID (requires adminAuth)
- `PUT /api/reviews/admin/comment-templates/:id` - Update comment template (requires adminAuth)
- `DELETE /api/reviews/admin/comment-templates/:id` - Delete comment template (requires adminAuth)
- `POST /api/reviews/admin/initial-templates` - Create initial templates (requires adminAuth)
- `GET /api/reviews/admin/contacts/statistics` - Get contact statistics (requires adminAuth)
- `GET /api/reviews/admin/contacts/positive` - Get positive contacts (requires adminAuth)
- `GET /api/reviews/admin/contacts/negative` - Get negative contacts (requires adminAuth)
- `GET /api/reviews/admin/contacts` - Get all contacts (requires adminAuth)
- `GET /api/reviews/admin/contacts/:id` - Get contact by ID (requires adminAuth)
- `PUT /api/reviews/admin/contacts/:id/status` - Update contact status (requires adminAuth)
- `GET /api/reviews/admin` - Get all reviews (requires adminAuth)
- `GET /api/reviews/admin/:id` - Get review by ID (requires adminAuth)

---

## Part 18: Notification Routes (`/api/notifications`)

### Admin Routes
- `POST /api/notifications` - Create notification (requires adminAuth)
- `GET /api/notifications` - Get all notifications (requires adminAuth)
- `GET /api/notifications/stats` - Get notification statistics (requires adminAuth)
- `GET /api/notifications/:id` - Get notification by ID (requires adminAuth)
- `PUT /api/notifications/:id` - Update notification (requires adminAuth)
- `DELETE /api/notifications/:id` - Delete notification (requires adminAuth)

### User Routes
- `GET /api/notifications/my/:userType/:userId` - Get my notifications
- `POST /api/notifications/:notificationId/read` - Mark notification as read

---

## Part 22: Device Verification Routes (`/api/device-verification`)

All routes are public.

- `POST /api/device-verification/:userModel/request-code` - Request device verification code
- `POST /api/device-verification/:userModel/verify` - Verify device
- `POST /api/device-verification/:userModel/resend-code` - Resend device verification code

**Note:** `userModel` can be: `admin`, `contragent`, `punkt`, `agent`

---

## Part 23: Contragent Type Routes (`/api/contragent-types`)

### Public Routes
- `GET /api/contragent-types` - Get all contragent types
- `GET /api/contragent-types/:id` - Get contragent type by ID

### Admin Routes
- `POST /api/contragent-types` - Create contragent type (requires adminAuth, validation)
- `PUT /api/contragent-types/:id` - Update contragent type (requires adminAuth, validation)
- `DELETE /api/contragent-types/:id` - Delete contragent type (requires adminAuth)

---

## Summary

This documentation covers all routes in the application, organized into 23 logical parts:

1. **Admin Routes** - Comprehensive admin management and data access
2. **Agent Routes** - Agent authentication and management
3. **Agent Order Routes** - Agent order operations and KPI
4. **Agent Finance Routes** - Agent financial operations (MFY, Tuman, Viloyat)
5. **Contragent Routes** - Contragent authentication, management, and payments
6. **Contragent Order Routes** - Contragent order operations
7. **Punkt Routes** - Punkt authentication and management
8. **Punkt Order Routes** - Punkt order operations and KPI
9. **Category Routes** - Category and subcategory access
10. **Product Routes** - Product management for contragents
11. **Marketplace Routes** - Public marketplace and user operations
12. **Payment Routes** - Payment processing for marketplace users
13. **Admin Finance Routes** - Financial reporting and management
14. **Admin KPI Payment Routes** - KPI payment management
15. **Admin Contragent Payment Routes** - Contragent payment management
16. **Region Routes** - Region management
17. **Review Routes** - Review and rating system
18. **Notification Routes** - Notification system
19. **Device Verification Routes** - Device verification for all user types
20. **Contragent Type Routes** - Contragent type management

Each route group includes authentication requirements, validation requirements, and route-specific details. Routes are organized to avoid conflicts, with specific routes placed before generic `:id` routes where necessary.


