import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Suspense, lazy } from "react";
import { SEO } from "@/components/SEO";
import { AddToHomeScreen } from "@/components/AddToHomeScreen";
import Flow from "./pages/Flow";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import History from "./pages/History";
import Profile from "./pages/Profile";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

// Design lab: isolated redesign prototypes, never shipped unless explicitly enabled.
const designLabEnabled = import.meta.env.DEV || import.meta.env.VITE_DESIGN_LAB === "1";
const DesignLab = designLabEnabled ? lazy(() => import("./design-lab/DesignLab")) : null;

// Clerk authentication setup
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// App version: Testing auto-deploy after reconnect

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
    <ClerkProvider publishableKey={clerkPublishableKey || ""}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SEO />
            <AddToHomeScreen />
            <Routes>
              <Route path="/" element={<Flow />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {DesignLab && (
                <Route
                  path="/__design/*"
                  element={
                    <Suspense fallback={null}>
                      <DesignLab />
                    </Suspense>
                  }
                />
              )}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </ThemeProvider>
);

export default App;
