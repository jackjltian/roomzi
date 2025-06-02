# Roomzi

## Overview

**Roomzi** is a React Native mobile application that streamlines long-term room rentals in Ontario by combining tenant discovery, rigorous screening, and lightweight property management in one intuitive interface. Landlords swipe through pre-vetted tenant profiles (credit checks, income verification, rental history, ID upload) and connect only when there's a mutual match. From there, Roomzi handles chat, lease agreements, rent tracking, maintenance tickets, and more—all from a single app.

---

## Table of Contents

1. [Frontend Setup (React Native)](#frontend-setup-react-native)  
   - [Initializing a New React Native Project](#initializing-a-new-react-native-project)  
   - [Folder Layout & Basic MVC Pattern](#folder-layout--basic-mvc-pattern)  
   - [Example: Login/Signup Form](#example-loginsignup-form)  
2. [Backend Recommendations](#backend-recommendations)  
   - [Node.js + Express + PostgreSQL](#option-a-nodejs--express--postgresql)  
3. [Frontend Authentication](#frontend-authentication)
4. [Client-Server Connection](#client-server-connection)
5. [MVC Model](#mvc-model)
6. [Installation Guide](#installation-guide)

---

## Frontend Authentication

The Roomzi app uses **Firebase Authentication** for secure user login and signup. The frontend integrates Firebase Auth via the Firebase Web SDK. User credentials are never stored locally; authentication tokens are managed securely by Firebase. The authentication logic is implemented in `frontend/src/config/firebase.js`, which exports helper functions like `signIn` and `signUp` for use in screens such as Login and Signup.

## Client-Server Connection

The frontend communicates with the backend server using RESTful API endpoints via the `fetch` API. All sensitive operations (e.g., fetching user data, posting listings) are routed through secure backend endpoints. The backend validates Firebase ID tokens to ensure requests are authenticated.

## MVC Model

The project follows a basic **MVC (Model-View-Controller)** pattern:
- **Model:** Data models and business logic (backend: Mongoose models, frontend: data structures)
- **View:** React Native components/screens (UI)
- **Controller:** Functions that handle user input, API calls, and state management (e.g., screen logic, Redux/Context actions)

## Installation Guide

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- Expo CLI (for React Native): `npm install -g expo-cli`

### Backend Setup
1. Navigate to the backend directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Set up your environment variables in a `.env` file (see `.env.example` if provided).
4. Start the backend server:
   ```sh
   npm start
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   # or
   yarn install
   ```
3. Configure Firebase:
   - Copy your Firebase config to `src/config/firebase.js`.
   - Ensure the file exports `auth`, `signIn`, and `signUp` functions for use in your screens.
4. Start the Expo development server:
   ```sh
   npx expo start
   ```
5. Run the app on your simulator or device (follow Expo instructions).

---

## Frontend (Mobile) 
  - **React Native** (latest stable)  
  - **TypeScript**  
  - **React Navigation** (for screen routing)  
  - **Context API** (for global state, especially auth state)  
  - **fetch** (for HTTP requests to backend)  
  - **Expo** (simplifies development, over-the-air updates, React Native libraries)

## Backend
  - **Main Stack**: Node.js + Express + PostgreSQL 
  - **Authentication**: Firebase Auth  
  - **Database**: MongoDB (NoSQL)  
  - **ORM/ODM**: Mongoose (for Node + MongoDB)  
  - **Hosting/Deployment**: Vercel


