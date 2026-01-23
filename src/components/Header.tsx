import { Button } from "@/components/ui/button";
import { useUser, UserButton, SignInButton } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, History, Heart, Settings, LayoutDashboard } from "lucide-react";

const Header = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isFlowPage = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
      <div className="container mx-auto px-4 md:px-6 h-14 flex items-center justify-center">
        <div className="flex items-center justify-between w-full max-w-6xl">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="font-serif text-xl tracking-tight text-foreground hover:opacity-80 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          >
            Praxis
          </button>
          
          {/* Navigation - Center aligned - show on all pages when signed in */}
          {isLoaded && user && (
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="px-4"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/history')}
                className="px-4"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/favorites')}
                className="px-4"
              >
                <Heart className="w-4 h-4 mr-2" />
                Favorites
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className="px-4"
              >
                <User className="w-4 h-4 mr-2" />
                My Style
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                className="px-4"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </nav>
          )}
          
          {/* Right side - User actions */}
          <div className="flex items-center gap-2">
            {isLoaded && user && (
              <UserButton afterSignOutUrl="/" />
            )}
            
            {isLoaded && !user && !isFlowPage && (
              <SignInButton mode="modal">
                <Button variant="cta" size="sm">
                  Sign In
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
