# Ví Điện Tử Sinh Lời (Profitable E-Wallet)

This is a comprehensive, feature-rich simulated e-wallet application designed to showcase a modern, interactive, and intelligent financial management experience. Built with React, TypeScript, and Tailwind CSS, it integrates the Google Gemini API to provide smart features.

The application is a client-side simulation, with all user data, transactions, and settings persisted in the browser's `localStorage`. Features like biometric authentication, OTP, and camera scanning are simulated to demonstrate a complete user flow without requiring backend infrastructure or native device access.

## ✨ Key Features

### Core Wallet Functionality
*   **Create & Manage Wallet:** Simple onboarding process to create a new wallet with a unique ID, avatar, and personal details.
*   **Send & Receive Money:** Multiple ways to transfer funds, including sending to other wallet IDs, bank transfers, and generating/scanning QR codes for payments.
*   **Transaction History:** A detailed log of all transactions with advanced filtering by type, date range, and a search function.
*   **Add & Withdraw Funds:** Simulate adding funds from linked bank accounts or e-wallets, and withdrawing the balance to a bank account.

### Advanced Financial Tools
*   **Savings Goals:** Set, track, and contribute to personal savings goals with visual progress bars.
*   **Bill Payments:** A dedicated interface for paying various utility bills (electricity, water, internet, etc.).
*   **Loan Applications (Simulated):** Browse different loan packages, check eligibility based on a simulated credit score, and apply for loans.
*   **Recurring Transactions:** Set up automatic, recurring payments based on past transactions for convenient scheduling.

### Unique & Engaging Features
*   **Automatic Profit Generation:** A unique simulation feature where the wallet balance passively accrues small amounts of profit over time, simulating an interest-bearing account.
*   **Lucky Money (Lì xì):** Create and share customizable lucky money packets with friends via a shareable link. Users can claim these packets until the total amount is distributed.
*   **Rewards System:** Earn coins by completing daily tasks (e.g., "make 5 transfers") and redeem the accumulated coins for various vouchers.

### AI-Powered Assistant
*   **Gemini Chatbot:** An integrated AI assistant powered by the Google Gemini API. It can:
    *   Answer questions about the user's balance and transactions.
    *   Provide summaries and analysis of spending habits.
    *   Offer information about available loan packages.
    *   Generate creative and fun wishes for lucky money packets.

### Security & Personalization
*   **Biometric & OTP Authentication (Simulated):** A simulated security layer requiring biometric (fingerprint/face) or OTP confirmation for sensitive transactions like sending money or applying for a loan.
*   **Customizable Transaction Limits:** Users can set their own daily and per-transaction spending limits for better budget control.
*   **Theming:** Personalize the application's look and feel by choosing from a variety of color themes.
*   **Custom Default Messages:** Manage a list of quick messages for faster money transfers.

## 💻 Technology Stack

*   **Frontend:** React, TypeScript, Tailwind CSS
*   **AI:** Google Gemini API
*   **Data Persistence:** Browser `localStorage` (for simulation purposes)
