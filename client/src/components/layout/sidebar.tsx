import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  LayoutDashboard,
  Book,
  LineChart,
  FileText,
  UserCircle,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  setMobileMenuOpen: (open: boolean) => void;
}

export function Sidebar({ setMobileMenuOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: 'There was an error logging you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Check if we're in a mobile view
  const isMobileView = typeof setMobileMenuOpen === 'function';

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-[#388E3C] flex flex-col">
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-[#4CAF50] relative">
        {isMobileView && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 text-white" 
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        <img src="/images/NUTM Logo.png" alt="NUTM" className="h-10 w-auto mr-2" />
        <span className="ml-2 text-white font-semibold font-heading">Attendance System</span>
      </div>
      <div className="h-0 flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Button
            variant="ghost"
            className={`w-full justify-start text-white hover:bg-primary/80 ${
              location === '/admin-dashboard' ? 'bg-primary' : ''
            }`}
            onClick={() => navigate('/admin-dashboard')}
          >
            <LayoutDashboard className="mr-3 h-5 w-5 text-primary-light" />
            Dashboard
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-primary/80"
            onClick={() => toast({ title: "Courses", description: "This section is under development" })}
          >
            <Book className="mr-3 h-5 w-5 text-primary-light" />
            Courses
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-primary/80"
            onClick={() => toast({ title: "Real-Time Monitoring", description: "This section is under development" })}
          >
            <LineChart className="mr-3 h-5 w-5 text-primary-light" />
            Real-Time Monitoring
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-primary/80"
            onClick={() => toast({ title: "Reports", description: "This section is under development" })}
          >
            <FileText className="mr-3 h-5 w-5 text-primary-light" />
            Reports
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-primary/80"
            onClick={() => toast({ title: "Profile", description: "This section is under development" })}
          >
            <UserCircle className="mr-3 h-5 w-5 text-primary-light" />
            Profile
          </Button>
        </nav>
        
        <div className="px-2 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-primary/80"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5 text-primary-light" />
            Logout
          </Button>
          
          <div className="mt-8 px-4 text-sm text-primary-light">
            <p>Logged in as:</p>
            <p className="font-bold">{user?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
