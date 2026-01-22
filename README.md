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

### Vercel Deployment Steps

1. **Push to GitHub** (already done)
2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Configure Environment Variables** in Vercel:
   - `VITE_CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `VITE_OPENAI_API_KEY` - Your OpenAI API key
   - `REPLICATE_API_TOKEN` - Your Replicate API token (server-side)

4. **Configure Clerk for Production**:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Navigate to your application → **Domains**
   - Add your Vercel domain: `praxis-tix.vercel.app` (or your custom domain)
   - This fixes the Clerk deployment warning

5. **Set Up Supabase Storage**:
   - Go to your Supabase Dashboard → **Storage**
   - Create a new bucket named `images`
   - Set it to **Public** (or configure RLS policies)
   - This fixes the "Bucket not found" error

### Troubleshooting

**Clerk Warning**: Add your Vercel domain to Clerk Dashboard → Domains

**Supabase Storage Error**: Create the `images` bucket in Supabase Storage

**Replicate 404 Errors**: The virtual try-on models may be unavailable. Check [Replicate.com](https://replicate.com) for current model availability and update `src/lib/virtualTryOnService.ts` if needed.

## License

Private project
