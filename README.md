# Mini-Mission Micro Tasking and Earning Platform


[💻Live Project](https://mini-missions.netlify.app)

## Admin Login:
- **Username**: mini@mission.com
- **Password**: Mini12345678@

## Features:
- **User Authentication**: Sign in using email/password or Google Sign-In.
- **Role-Based Access Control**: Distinct roles for Worker, Buyer, and Admin with appropriate permissions.
- **Task Management**: Workers can view available tasks and submit their work. Buyers can create, manage, and review tasks.
- **Payment Integration**: Supports Stripe for coin purchases and withdrawal functionality for workers.
- **Notification System**: Real-time updates for task status, submission approvals, and withdrawal requests.
- **Dashboard**: Fully responsive dashboard for Workers, Buyers, and Admins with role-specific navigation and data.
- **Task Submission**: Workers can submit tasks with proof and track their earnings and submissions.
- **Responsive Design**: The website is optimized for mobile, tablet, and desktop devices.
- **Data Storage**: All data is securely stored and handled in MongoDB, with Firebase for authentication.
- **Coin System**: Each user has a coin balance, with workers earning coins and buyers purchasing them via Stripe.

## Project Overview:
The **Micro Tasking and Earning Platform** allows users to complete small tasks and earn rewards. There are three primary roles:

- **Worker**: Completes tasks and earns coins. Can withdraw earnings after meeting the minimum coin balance.
- **Buyer**: Manages tasks and payments. Can create tasks, review submissions, and pay workers.
- **Admin**: Oversees platform operations, manages users, and tasks, and processes withdrawal requests.

---

## Project Setup

### Requirements:
- **Node.js** (v14 or later)
- **React** (v17 or later)
- **TailwindCSS**
- **React Router** for navigation
- **Firebase Authentication**
- **Stripe** for Payments (Stripe demo if integration is not possible)


## Key Components:

### 1. Homepage:
- **Hero Section**: Includes a responsive slider with three different banners.
- **Best Workers**: Displays the top 6 workers based on their coin balance.
- **Testimonial Section**: Displays feedback from users with a swiper slider.
- **Additional Sections**: Three extra sections for engaging content.

### 2. User Authentication System:
- Users can register with their name, email, profile picture, and select their role (Worker or Buyer).
- Validation is implemented for email format and password strength.
- Users can log in via email/password or Google Sign-In.
- Upon successful login or registration, the user is redirected to the Dashboard.

### 3. Dashboard Layout:
- **Role-Specific Views**: Workers, Buyers, and Admins each have their own dashboard with appropriate sections and information.
  - **Workers**: View tasks, submit work, check earnings, and request withdrawals.
  - **Buyers**: Manage tasks, review submissions, approve or reject work, and purchase coins.
  - **Admins**: Manage users, tasks, and withdrawal requests.

### 4. Task Management:
- **Task Creation**: Buyers can create tasks, specify the required number of workers, and set the payable amount.
- **Task List**: Workers can browse available tasks, view details, and submit work.
- **Task Approval**: Buyers can approve or reject submissions, affecting the worker's coin balance.

### 5. Payment System:
- **Coin Purchases**: Buyers can purchase coins via Stripe.
- **Withdrawals**: Workers can request withdrawals once they have enough coins (minimum 200 coins).

### 6. Notifications:
- Real-time notifications inform users about submission status changes, task updates, and payment/withdrawal activities.

---

## Development Guidelines:
- **GitHub Commits**: Make regular, meaningful commits. A minimum of 20 notable client-side commits and 12 server-side commits is required.
- **Responsive Design**: Ensure the platform works seamlessly across mobile, tablet, and desktop devices. Test responsiveness using TailwindCSS utilities.
- **Avoid Lorem Ipsum**: All text on the website should be real and meaningful. Replace any placeholder text with actual content.
- **Environment Variables**: Use `.env` files to securely store Firebase credentials and MongoDB details.
- **Styling**: Use TailwindCSS for styling and ensure that your app is visually appealing and user-friendly.

---

## Important Notes:
- **Dashboard**: The dashboard should be dynamic, responsive, and role-specific.
- **Payment History**: Display a list of all payments made by the buyer.
- **Withdrawals**: Handle withdrawals in accordance with the business logic (20 coins = 1 dollar for workers).
- **Admin Role**: Admin should have the ability to delete users and manage tasks.

---

## Dependencies Used:
- **React**: For building the user interface.
- **React Router**: For navigation between pages.
- **Firebase Authentication**: For secure user authentication.
- **Stripe**: For handling coin purchases and payments (dummy if not integrated).
- **TailwindCSS**: For styling the website.
- **Swiper**: For responsive carousels.
