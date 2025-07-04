# Roomzi

## Project Overview

Roomzi is a modern web application that connects landlords and tenants in Toronto, making it easy to find rooms, apartments, and houses for rent or list your property. This project is developed as part of CSCC01 - Introduction to Software Engineering at the University of Toronto Scarborough.

### Project Goals

- Create a user-friendly platform for property listings and searches
- Implement an interactive map interface for property visualization
- Develop separate interfaces for landlords and tenants
- Enable comprehensive profile management for landlords and tenants
- Support image uploads and profile customization
- Ensure responsive design for all devices
- Follow software engineering best practices and methodologies

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher) or yarn
- Mapbox API key (for map functionality)
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/term-group-project-driven-devs.git
   cd term-group-project-driven-devs
   ```

2. Navigate to the application directory:

   ```bash
   cd frontend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. [Opitional] Create a `.env` file in the roomzi-home-finder directory:

   ```
   VITE_MAPBOX_TOKEN=your_mapbox_token_here
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:8080`

## Features

### 🏠 For Landlords

- **Profile Management**: Create and edit comprehensive landlord profiles
- **Property Listings**: Create, manage, and track rental property listings
- **Profile Pictures**: Upload and manage profile pictures with Supabase storage
- **Contact Information**: Manage phone numbers, addresses, and contact details
- **Role Switching**: Seamlessly switch between landlord and tenant roles

### 🏡 For Tenants

- **Property Search**: Browse available rental properties with advanced filtering
- **Profile Management**: Maintain tenant profiles with personal information
- **Property Matching**: Get matched with suitable rental properties
- **Interactive Maps**: View properties on an interactive map interface
- **Role Switching**: Switch to landlord role to list your own properties

### 🛠️ Technical Features

- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant updates for profile changes and uploads
- **Secure Authentication**: Supabase-powered authentication with role-based access
- **Image Storage**: Secure image upload and storage with Supabase Storage
- **Database Integration**: PostgreSQL database with Prisma ORM
- **Error Handling**: Comprehensive error handling and user feedback

## Backend Setup

To run the full application with backend functionality:

1. **Start the Backend Server:**

   ```bash
   cd backend
   npm install
   npm run dev
   ```

   Backend will be available at `http://localhost:3001`

2. **Configure Environment Variables:**
   Copy `backend/config.template.env` to `backend/.env` and fill in your values:

   ```
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=http://localhost:8080
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   DATABASE_URL=your_postgresql_connection_string
   DIRECT_URL=your_postgresql_direct_connection_string
   ```

3. **Initialize Database:**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

## Recent Updates

### ✨ Landlord Profile Implementation (Latest)

- **Complete Profile Management**: Full CRUD operations for landlord profiles
- **Profile Picture Upload**: Secure image upload with validation and storage
- **Edit Mode Interface**: Toggle between view and edit modes for profile information
- **Form Validation**: Client-side and server-side validation for all profile fields
- **Upsert Functionality**: Backend upsert operations to handle profile creation/updates
- **Storage Bucket Management**: Automatic creation of Supabase storage buckets

For detailed documentation on the landlord profile implementation, see [LANDLORD_PROFILE_IMPLEMENTATION.md](./LANDLORD_PROFILE_IMPLEMENTATION.md).
