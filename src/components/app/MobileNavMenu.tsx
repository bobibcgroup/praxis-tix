import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, History, Heart, User, Settings, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface MobileNavMenuProps {
  navigate: (path: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const MobileNavMenu = ({ navigate, open: controlledOpen, onOpenChange }: MobileNavMenuProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="px-2">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px]">
        <nav className="flex flex-col gap-2 mt-6">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => handleNavigate('/dashboard')}
            className="w-full justify-start"
          >
            <LayoutDashboard className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => handleNavigate('/history')}
            className="w-full justify-start"
          >
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => handleNavigate('/favorites')}
            className="w-full justify-start"
          >
            <Heart className="w-4 h-4 mr-2" />
            Favorites
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => handleNavigate('/profile')}
            className="w-full justify-start"
          >
            <User className="w-4 h-4 mr-2" />
            My Style
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => handleNavigate('/settings')}
            className="w-full justify-start"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          
          <Separator className="my-2" />
          
          {/* Theme Toggle */}
          <div className="px-2 py-1">
            <div className="text-sm font-medium text-muted-foreground mb-2">Theme</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Appearance</span>
              <ThemeToggle />
            </div>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
