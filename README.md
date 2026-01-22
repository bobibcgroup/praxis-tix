# Praxis Tix

A modern outfit recommendation and styling application built with React, TypeScript, and Vite.

## Features

- AI-powered outfit recommendations
- Virtual try-on capabilities
- Style analysis and personalization
- User authentication with Clerk
- Outfit history and management

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Authentication**: Clerk
- **Database**: Supabase
- **AI**: OpenAI, Replicate
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun

### Installation

```bash
# Install dependencies
npm install

# Or with bun
bun install
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
# Add other required environment variables
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment

This project is configured for deployment on Vercel. The `vercel.json` file contains the necessary configuration.

## License

Private project
