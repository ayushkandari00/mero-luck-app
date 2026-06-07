# Mero Luck (मेरो Luck)

Mero Luck is a **vibecoded platform** designed for buying physical collectible coins and digital tokens engraved with unique lucky numbers, participating in real-time lucky draws, and winning rewards.

This platform bridges the physical and digital world, enabling users to order custom-engraved physical coins or buy digital tokens, both of which serve as entries into active lucky draws.

---

## 🌟 Key Features

* **Dual-Collectible System**: Purchase physical coins (shipped to you) or digital tokens (active instantly).
* **Engraved Lucky Numbers**: Every coin/token comes with a unique 6-digit lucky number.
* **Real-time Live Activity**: Real-time jackpot ticking and purchase feeds powered by Socket.io.
* **Lucky Draws & Winners**: Interactive active draws, automatic entry management, and verified winners list.
* **Referral & Rewards System**: Claim welcome bonuses and refer friends to unlock additional perks.
* **Proof of Payment Upload**: Multer-based workflow for uploading and verifying bank/payment proofs.
* **Robust Admin Panel**: Complete control over active draws, verifying proof-of-payments, approving physical shipping, and announcing draw winners.

---

## 🛠️ Technology Stack

### Backend
* **Runtime & Framework**: Node.js with Express & TypeScript
* **Database & ORM**: Prisma ORM with SQLite (dev)
* **Real-time Engine**: Socket.io (websockets)
* **Auth**: JSON Web Tokens (JWT) & Bcrypt hashing
* **File Uploads**: Multer (storing payment proof images locally)

### Frontend
* **Framework**: Next.js (App Router) & TypeScript
* **State Management**: Zustand
* **Styling**: TailwindCSS / Vanilla CSS
* **Socket Integration**: Socket.io-client for live ticking

---

## 🚀 Getting Started

To get the entire application running locally:

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on the local setup:
   ```env
   PORT=5000
   JWT_SECRET=your_jwt_secret_here
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
   FRONTEND_URL=http://localhost:3000
   DATABASE_URL="file:./dev.db"
   ```
4. Run the Prisma database migrations:
   ```bash
   npm run prisma:migrate
   ```
5. Seed the database with demo users (including admin and general test users):
   ```bash
   npm run prisma:seed
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```
   The backend server will run on `http://localhost:5000`.

### 2. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`.

---

## 🔒 Security & Git configuration

This repository uses updated `.gitignore` rules to ensure that:
* Local SQLite databases (`*.db`, `*.db-journal`) are kept out of source control.
* Sensitive environment files (`.env`, `.env.*.local`) are ignored.
* Dependency directories (`node_modules`) and production build targets (`dist`, `.next`) are never pushed.
