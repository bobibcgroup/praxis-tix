import { Button } from "@/components/ui/button";
import { useUser, UserButton, SignInButton } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, History } from "lucide-react";

const Header = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isFlowPage = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex items-center justify-between h-16 px-4">
        <a 
          href="/" 
          className="font-serif text-xl tracking-tight hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
        >
          Praxis
        </a>
        
        <div className="flex items-center gap-3">
          {isLoaded && user && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/history')}
                className="hidden sm:flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/profile')}
                className="hidden sm:flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                My Style
              </Button>
              <UserButton afterSignOutUrl="/" />
            </>
          )}
          
          {isLoaded && !user && !isFlowPage && (
            <SignInButton mode="modal">
              <Button variant="cta" size="sm">
                Sign In
              </Button>
            </SignInButton>
          )}
          
          {!isFlowPage && (
            <Button 
              variant="cta" 
              size="sm"
              onClick={() => document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Request Access
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
