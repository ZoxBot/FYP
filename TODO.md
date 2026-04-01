# Kaamko Kura - Priority-Based TODO List

This document outlines the remaining tasks, missing features, and technical improvements needed to make Kaamko Kura a robust, production-ready freelance marketplace, sorted by order of urgency.

---

## 🔴 Priority 1: Critical (Blockers for a Working Marketplace)
These features are absolutely essential for the core business logic of the app to function securely and properly.

- [x] **Contract & Escrow Workflow:** Build exactly what happens *after* a bid is accepted. The system needs to lock the accepted bid amount, change the task status to "In Progress", allow freelancers to "Submit Work", and allow clients to "Approve Work".
- [x] **Payment Integration (Khalti):** Integrate Khalti to handle the escrow funds when a contract is created, and build the route to release funds to the freelancer upon job completion.
- [x] **Platform Fee / Commission Logic:** Automatically calculate and deduct the platform's commission (currently set to 5%) before transferring the final payment to the freelancer.
- [x] **Email Verification:** Implement an email verification flow (OTP or Magic Link) upon signup to prevent spam accounts and ensure valid users.
- [x] **Password Reset Flow:** Add a "Forgot Password" functionality via secure email links.
- [x] **Edit / Delete Jobs:** Ensure clients can edit or delete their job postings as long as no bids have been accepted yet.
- [x] **Dispute Resolution Center:** Create an Admin UI to review and intervene on frozen contracts where the client and freelancer disagree.
- [x] **Identity Verification Workflow:** Add an admin approval process for IDs and badges for verified profiles.

---

## 🟠 Priority 2: High (Crucial UX, Trust, and Security)
These features heavily impact user trust, security, and the day-to-day experience of using the platform.

- [x] **CSRF Protection:** Since we migrated to HTTP-only cookies for authentication, we must implement Cross-Site Request Forgery (CSRF) tokens to secure state-changing requests.
- [x] **Input Validation Middleware:** Replace manual `if (!email)` checks in the backend with a powerful validation library (like Joi or Zod) to catch bad data before it hits the DB.

- [x] **Centralized Error Handling:** Create a global error handling middleware in Express to catch all failed promises and prevent unexpected server crashes.
- [x] **Push / App Notifications:** Implement a dedicated "Notifications" bell in the UI (e.g., "Client accepted your bid", "You have a new message").
 
---
 
## 🟡 Priority 3: Medium (Growth & Engagement Features)
These features make the app feel alive, competitive, and professional, but aren't strictly required to launch an MVP.
 
- [x] **WebSockets (Socket.io) Transition:** Migrate the current polling-based messaging system to full Socket.io for instant, real-time message delivery.
- [ ] **OAuth Integration:** Fully configure Google and Facebook login strategies in the backend and handle user mapping correctly.
- [x] **Review Validation:** Ensure backend checks prevent users from leaving reviews on profiles unless a verified contract has been completed between them.
- [x] **Withdrawal System:** Build a system for freelancers to request bank/Khalti withdrawals from their platform wallet.
- [x] **Transaction History UI:** Create a comprehensive "Billing & Payments" page for both clients and freelancers to view past transactions, invoices, and balances.
- [x] **Rich Text Descriptions:** Upgrade the job description inputs and displays to support rich formatting (bold, lists, links) using a library like React Quill or TipTap.
- [x] **Pagination:** Implement backend and frontend pagination for the Job Marketplace to handle hundreds of jobs efficiently without lagging.

---

## 🟢 Priority 4: Low (Polish, Analytics, and Nice-to-Haves)
These features add that final layer of polish, speed, and administrative ease.

- [ ] **Analytics & Metrics:** Add visual charts (e.g., using Recharts) to the Admin Dashboard showing revenue, user growth, and active jobs.
- [ ] **Data Export:** Allow admins to export user lists, job lists, and revenue reports as CSV files.
- [ ] **Rate Limiting:** Add `express-rate-limit` to authentication routes to prevent brute-force attacks.
- [ ] **Automated Testing:** Set up Jest and Supertest to write unit and integration tests for critical routes (especially payments and auth).
- [ ] **Loading Skeletons:** Replace generic loading spinners with skeleton loaders for smoother perceived performance (especially on the Jobs and Profile pages).
- [ ] **Bookmarks / Saved Jobs:** Allow freelancers to "save" jobs to view later.
- [ ] **Social Links & External Portfolios:** Allow users to link their GitHub, LinkedIn, or Dribbble accounts directly on their profiles.
- [ ] **File Attachments in Chat:** Allow users to upload and share files/images securely within messages using Cloudinary.



Build Error

Ecmascript file had an error

./src/app/(app)/user/[id]/page.tsx (1:10)

Ecmascript file had an error
> 1 | import { useEffect, useState, use } from "react";
    |          ^^^^^^^^^
  2 | import { cn } from "@/lib/utils";
  3 | import { PageHeader } from "@/components/page-header";
  4 | import { Card, CardContent, CardHeader } from "@/components/ui/card";

You're importing a component that needs `useEffect`. This React hook only works in a client component. To fix, mark the file (or its parent) with the `"use client"` directive.

 Learn more: https://nextjs.org/docs/app/api-reference/directives/use-client