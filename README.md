
# InvestAI Assistant

A modern investment guidance platform with AI-powered insights, portfolio management, and market analysis tools.

## Project Overview

InvestAI Assistant is designed to help users make informed investment decisions through:

- AI-powered investment guidance
- Portfolio tracking and management
- Market analysis and trend visualization
- Educational resources for investors of all levels

## Getting Started

### Prerequisites

- Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Firebase account for authentication and database
- Cloudinary account for image storage

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Setup

Create a `.env` file in the root of your project with the following variables:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_UPLOAD_PRESET=user_profiles
```

## Project Structure

- `src/components/` - React components
- `src/contexts/` - Context providers (Auth, Theme)
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and configuration
- `src/pages/` - Application pages
- `src/types/` - TypeScript type definitions
- `docs/` - Project documentation

## Features

- **User Authentication**: Secure login/signup via Firebase
- **Profile Management**: User profiles with customizable settings and profile pictures
- **Portfolio Tracking**: Track and manage investment portfolios
- **Market Analysis**: Visual analysis of market trends and indices
- **AI Guidance**: AI-powered investment recommendations and insights
- **Learning Center**: Educational resources for investors

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication & Database**: Firebase
- **Image Storage**: Cloudinary
- **State Management**: React Context API, TanStack Query
- **Data Visualization**: Recharts
- **Routing**: React Router

## Deployment

This project can be deployed using:

1. **GitHub Pages**: Deploy directly from your GitHub repository
2. **Netlify**: Connect your GitHub repository for automatic deployments
3. **Vercel**: Import your project for seamless deployment

## Contributing

Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
