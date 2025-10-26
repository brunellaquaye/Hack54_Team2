# Medi-Fi - Your Personal Medication Manager

## Project Overview

Medi-Fi is a comprehensive medication management application that helps users track their medications, set reminders, and manage prescriptions with ease.

## Features

- **Prescription Management**: Upload and manage your prescriptions digitally
- **Medication Tracking**: Keep track of your medications and dosages
- **Reminder System**: Set up medication reminders to never miss a dose
- **Pharmacy Integration**: Find nearby pharmacies and check medicine availability
- **Health Insights**: Get personalized insights about your medication patterns
- **Drug Information**: Access detailed information about medications

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

Follow these steps to set up the project locally:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd medi-fi

# Step 3: Install the necessary dependencies
npm install

# Step 4: Start the development server
npm run dev
```

### Development

The application will be available at `http://localhost:5173` by default.

## Technologies Used

This project is built with modern web technologies:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - Modern UI library
- **shadcn/ui** - Beautiful and accessible UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend-as-a-Service for database and authentication
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Application pages/routes
├── hooks/         # Custom React hooks
├── lib/           # Utility functions
├── integrations/  # External service integrations
└── assets/        # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
