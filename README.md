# 🚀 Firebase Admin Dashboard

A premium, high-performance admin dashboard built with **React**, **Next.js 16**, and **Firebase**. Designed for real-time tracking, analytics, and record management with a modern, sleek aesthetic.

---

## 🆕 What's New

- **D-ID & Biohazard Job Management**: Create and track vehicle identification (D-ID) and biohazard cleaning jobs. Assign jobs to users, track status (Pending/Active/Completed), and manage vehicle details.
- **User Uploads Page**: View all user upload activity with filters (This Week, Last Week, This Month, Last Month). Shows every user's daily cleans and sales prep.
- **Interactive Login Background**: Animated particles background with hover/click interactions and dark mode support.

---

## ✨ Features

- **📊 Real-time Analytics**: Dynamic charts using **Recharts** to visualize activity across branches and users.
- **🚗 Vehicle Management**: Dedicated modules for **Daily Cleans**, **Sales Prep**, **D-ID**, and **Biohazard** tracking.
- **🔍 Advanced Filtering**: Filter by branch, status, and date range (This Week, Last Week, This Month, Last Month).
- **✨ Premium UI/UX**:
  - Built with **shadcn/ui** and **Tailwind CSS**.
  - Smooth animations using **Framer Motion**.
  - **Dark Mode Support** with refined glassmorphism effects.
  - Custom **Sliding Pagination** and animated tables.
- **🔥 Firebase Integration**: Firestore-backed real-time data synchronization.
- **📱 Responsive Design**: Fully optimized for desktop and mobile workflows.
- **🎨 Advanced Visuals**: Hatched pattern charts, dotted backgrounds, and custom 3D elements using **Three.js**.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **3D Rendering**: [Three.js](https://threejs.org/)

---

## 🚀 Getting Started

Follow these steps to get your development environment up and running.

### 1. Requirements

Ensure you have **Node.js 18+** and **npm/yarn/pnpm** installed.

### 2. Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone <your-repo-url>
cd firebase-admin-dashboard-react

# Install dependencies
npm install
```

### 3. Firebase Configuration

Create a `.env.local` file in the root directory and add your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Running the Development Server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the dashboard.

---

## 📁 Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components (shadcn/ui, custom charts).
- `src/lib`: Utility functions and services (Firebase `DataService`, etc.).
- `src/hooks`: Custom React hooks.
- `public`: Static assets (images, fonts).

---

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

---

## 🤝 Contributing

1. Fork the project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git checkout push origin feature/AmazingFeature`)
5. Open a Pull Request

---

Developed with ❤️ by [Andre Martins](mailto:andremartins@example.com)
