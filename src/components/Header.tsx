import { Button } from "@/components/ui/button";
import { useUser, UserButton, SignInButton } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MobileNavMenu } from "@/components/app/MobileNavMenu";

const Header = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isFlowPage = location.pathname === '/';
  const isMobile = useIsMobile();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/30">
      <div className="px-4 md:px-6 h-14 flex items-center w-full">
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex flex-col items-start py-2 hover:opacity-80 transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          >
            <span className="font-serif text-xl font-medium text-foreground tracking-wide">Praxis</span>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Get dressed right, in under a minute.
            </p>
          </button>
          
          <div className="flex items-center gap-3">
            {/* Navigation - Desktop */}
            {isLoaded && user && !isMobile && (
              <nav className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="px-4"
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/history')}
                  className="px-4"
                >
                  History
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/favorites')}
                  className="px-4"
                >
                  Favorites
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="px-4"
                >
                  My Style
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/settings')}
                  className="px-4"
                >
                  Settings
                </Button>
              </nav>
            )}

            {/* Mobile Menu */}
            {isLoaded && user && isMobile && (
              <MobileNavMenu navigate={navigate} />
            )}
            
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* User actions */}
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
