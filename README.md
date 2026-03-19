# Kaamko Kura - Freelance Marketplace

Kaamko Kura is a comprehensive freelance marketplace platform connecting clients with local service providers and freelancers. It features a robust job bidding system, secure escrow-style payments via Khalti, and a complete administrative control panel.

## 🚀 Technology Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Cloud Storage**: Cloudinary (Avatars, Verification Documents, Support Attachments)
- **Payment Gateway**: Khalti (Native Integration + Escrow Simulation)
- **Authentication**: JWT, Passport.js (Google & Facebook OAuth)

## 🛠️ Core Features & Capabilities

### 1. User Management & Security
- **RBAC (Role Based Access Control)**: Granular permission system (e.g., `job.post`, `user.verify`, `rbac.roles.manage`).
- **Profile System**: Customizable profiles with avatars (Cloudinary), bios, and skills.
- **Advanced Settings**: Dedicated management for Notifications (Email/Platform), Payouts (Khalti/Bank), and Privacy.
- **Verification Workflow**: Users submit identification documents for admin verification to build trust.
- **Audit Logging**: Every administrative action is logged (IP address, action, timestamp) for security compliance.

### 2. Marketplace Workflow
- **Job Posting**: Clients can post jobs with titles, descriptions, budgets, and deadlines.
- **Bidding System**: Freelancers can place bids on jobs. Clients can review and accept bids.
- **Escrow System**: Once a bid is accepted, payment is held in escrow until the job is completed and confirmed by the client.
- **Real-time Communication**: Job-specific messaging system for clients and freelancers to collaborate.

### 3. Support & Moderation
- **Support Tickets**: Integrated ticketing system for user inquiries with attachment support.
- **Admin Console**: 
  - **Dashboard**: High-level stats (Users, Jobs, Pending approvals).
  - **User/Job Management**: Verify users, ban accounts, or moderate job listings.
  - **System Settings**: Configurable platform-wide settings.
  - **Permission Management**: UI to manage roles and group permissions dynamically.

## 📂 Project Structure (Reorganized)

### Backend
- `/routes`: Modular API endpoints (Jobs, Bids, Payments, Admin, etc.).
- `/middleware`: Authentication guards and permission checkers.
- `/utils`: Helper functions like `auditLogger.js` and `cloudinaryHelper.js` (automatic file cleanup).
- `/scripts`: 
    - `/migrations`: Database schema versioning.
    - `/seeds`: Initial data setup and Super Admin creation.
    - `/debug`: API testing and troubleshooting utilities.
- `/schema`: Raw SQL files for database initialization.

### Frontend
- `/src/app`: Next.js pages and layouts (Modularized by `(admin)` and `(app)` groups).
- `/src/components`: Reusable UI components (Shadcn UI + custom logic).
- `/src/lib`: Shared utilities and API client configurations.

## 🔑 Key Functions Highlight (For Viva)

| Function | Purpose |
| :--- | :--- |
| `checkPermission(slug)` | Middleware that validates if the logged-in user has the specific permission slug required for an endpoint. |
| `PATCH /me/settings` | `userRoutes.js` | Update granular user settings (JSONB). |
| `POST /api/reviews` | `reviewRoutes.js` | Submit a review for a completed job. |
| `GET /api/reviews/user/:userId` | `reviewRoutes.js` | Fetch all reviews for a user. |
| `deleteFromCloudinary(url)` | Automatically extracts the Public ID from a URL and deletes the asset from Cloudinary when replaced/deleted. |
| `logAdminAction(...)` | Records sensitive administrative changes to the `audit_logs` table for security auditing. |
| `initiatePayment()` | Connects to Khalti API to generate a `pidx` and redirect users to a secure payment portal. |
| `verifyPayment()` | Backend callback that confirms payment success with Khalti before starting a job in 'in-progress' mode. |

## 🚧 What's Left to Do?

1. **Real-time Notifications**: Implementing Socket.io or Push notifications for new messages/bids.
2. **Advanced Filtering**: Categorization and search filters for the job marketplace.
3. **Portfolio Section**: Specialized UI for freelancers to showcase previous work.
4. **Production Hardening**: Configuring secure HTTP-only cookies and production-grade environment variables.

<!-- superadmin@kaamkokura.com
SuperAdmin123 -->



# Kaamko Kura - Comprehensive TODO & Improvement List

This document outlines the remaining tasks, missing features, and technical improvements needed to make Kaamko Kura a robust, production-ready freelance marketplace.

---

## 1. Authentication & Security
### High Priority
- [ ] **CSRF Protection:** Since we migrated to HTTP-only cookies, we must implement Cross-Site Request Forgery (CSRF) tokens to secure state-changing requests.
- [ ] **Email Verification:** Implement an email verification flow (OTP or Magic Link) upon signup ensure valid users.
- [ ] **Password Reset Flow:** Add "Forgot Password" functionality via email links.
### Improvements
- [ ] **OAuth Integration:** Fully configure Google and Facebook login strategies in the backend and handle the user mapping.
- [ ] **Rate Limiting:** Add `express-rate-limit` to authentication routes to prevent brute-force attacks.
- [ ] **Account Deletion:** Allow users to permanently delete their data (GDPR/Privacy compliance).

---

## 2. Job Marketplace & Task Management
### High Priority
- [ ] **Contract & Milestone Workflow:** Build exactly what happens *after* a bid is accepted (e.g., Active Contract state, Submission, Client Approval).
- [ ] **Edit / Delete Jobs:** Ensure clients can edit or delete their job postings if no bids have been accepted yet.
### Improvements
- [ ] **Pagination:** Implement backend and frontend pagination for the Job Marketplace to handle hundreds of jobs efficiently.
- [ ] **Rich Text Descriptions:** Upgrade the job description inputs and displays to support rich formatting (bold, lists, links) using a library like React Quill or TipTap.
- [ ] **Bookmarks / Saved Jobs:** Allow freelancers to "save" jobs to view later.

---

## 3. Payments, Escrow & Commission
### High Priority
- [ ] **Escrow Flow:** Integrate Khalti fully to hold funds in "escrow" when a client accepts a bid, and define a route to release funds to the freelancer upon job completion.
- [ ] **Platform Fee / Commission Logic:** Automatically calculate and deduct the platform's share (e.g., 10%) from the payment.
### Improvements
- [ ] **Withdrawal System:** Build a system for freelancers to request bank/Khalti withdrawals from their platform wallet.
- [ ] **Transaction History UI:** Create a comprehensive "Billing & Payments" page for both clients and freelancers to view past transactions, invoices, and balances.

---

## 4. Real-Time Features & Messaging
### High Priority
- [ ] **WebSockets (Socket.io) Transition:** Migrate the current polling-based messaging system to full Socket.io for instant, real-time message delivery.
- [ ] **Push / App Notifications:** Implement a dedicated "Notifications" bell in the UI (e.g., "Client accepted your bid", "You have a new message").
### Improvements
- [ ] **File Attachments in Chat:** Allow users to upload and share files/images securely within messages.
- [ ] **Read Receipts:** Show when a message has been read by the recipient.

---

## 5. User Profiles & Trust
### High Priority
- [ ] **Identity Verification Workflow:** Finalize the admin approval process for uploaded ID documents (Verification Requests). Add badges (e.g., "Verified Freelancer") to approved profiles.
### Improvements
- [ ] **Social Links & External Portfolios:** Allow users to link their GitHub, LinkedIn, or Dribbble accounts.
- [ ] **Review Validation:** Ensure backend checks prevent users from leaving reviews on profiles unless a verified contract has been completed between them.

---

## 6. Admin Dashboard & Moderation
### High Priority
- [ ] **Dispute Resolution Center:** Create a UI for admins to review frozen contracts where the client and freelancer disagree, allowing the admin to refund or release funds.
### Improvements
- [ ] **Analytics & Metrics:** Add visual charts (e.g., using Recharts) to the Admin Dashboard showing revenue, user growth, and active jobs.
- [ ] **Data Export:** Allow admins to export user lists, job lists, and revenue reports as CSV files.

---

## 7. Backend Architecture & Code Quality
### High Priority
- [ ] **Input Validation Middleware:** Replace manual `if (!email)` checks in the backend with a powerful validation library like Joi or Zod to catch bad data before it hits the DB.
- [ ] **Centralized Error Handling:** Create a global error handling middleware in Express to catch all failed promises and prevent unexpected server crashes.
### Improvements
- [ ] **Automated Testing:** Set up Jest and Supertest to write unit and integration tests for critical routes (especially payments and auth).
- [ ] **Logging:** Implement Winston or Morgan to log backend requests and errors securely instead of relying on `console.log`.

---

## 8. Frontend UX/UI & Performance
### High Priority
- [ ] **Loading Skeletons:** Replace generic loading spinners with skeleton loaders for smoother perceived performance (especially on the Jobs and Profile pages).
### Improvements
- [ ] **SEO Optimization:** Update `<head>`, metadata, and dynamic routing to ensure public job pages and public profiles map well in search engines.
- [ ] **Image Optimization:** Ensure all Cloudinary images serve optimized WEBP formats and utilize `next/image` to prevent layout shifts.
- [ ] **Responsive Polish:** Conduct a thorough QA pass on mobile viewports to ensure all forms, modals, and tables behave nicely on small screens.
