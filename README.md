# Roomzi

## Overview

**Roomzi** is a React Native mobile application that streamlines long-term room rentals in Ontario by combining tenant discovery, rigorous screening, and lightweight property management in one intuitive interface. Landlords swipe through pre-vetted tenant profiles (credit checks, income verification, rental history, ID upload) and connect only when there’s a mutual match. From there, Roomzi handles chat, lease agreements, rent tracking, maintenance tickets, and more—all from a single app.

---

## Table of Contents

1. [Frontend Setup (React Native)](#frontend-setup-react-native)  
   - [Initializing a New React Native Project](#initializing-a-new-react-native-project)  
   - [Folder Layout & Basic MVC Pattern](#folder-layout--basic-mvc-pattern)  
   - [Example: Login/Signup Form](#example-loginsignup-form)  
2. [Backend Recommendations](#backend-recommendations)  
   - [Node.js + Express + PostgreSQL](#option-a-nodejs--express--postgresql)  


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


