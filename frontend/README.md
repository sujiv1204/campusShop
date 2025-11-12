# Campus Shop Frontend

React + Vite frontend for the Campus Shop marketplace.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

-   User authentication (register, login, email verification)
-   Item listings and bidding
-   Real-time notifications
-   User profiles with email preferences
-   Responsive design with Tailwind CSS

## Environment

The frontend connects to the backend API at `http://localhost:8080/api` by default.

Configure in `src/services/api.js` if needed.

## Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components (routes)
├── services/       # API integration
└── assets/         # Static assets
```

## Tech Stack

-   React 18
-   Vite
-   Tailwind CSS
-   Axios for API calls
