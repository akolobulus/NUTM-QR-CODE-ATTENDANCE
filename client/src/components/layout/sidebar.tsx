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
  X,
  Menu,
  ChevronLeft,
  ChevronRight,
  QrCode,
  Users
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface SidebarProps {
  setMobileMenuOpen: (open: boolean) => void;
  collapsed?: boolean;
  toggleCollapsed?: () => void;
}

export function Sidebar({ setMobileMenuOpen, collapsed = false, toggleCollapsed }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  // Update the internal collapse state when the prop changes
  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

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

  const handleCollapseToggle = () => {
    if (toggleCollapsed) {
      toggleCollapsed();
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#388E3C] transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
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
        
        {!isCollapsed ? (
          <>
            <img src="/images/NUTM Logo.png" alt="NUTM" className="h-10 w-auto mr-2" />
            <span className="ml-2 text-white font-semibold font-heading">Attendance System</span>
          </>
        ) : (
          <img src="/images/NUTM Logo.png" alt="NUTM" className="h-10 w-auto mx-auto" />
        )}
        
        {!isMobileView && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-2 text-white" 
            onClick={handleCollapseToggle}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>
      
      <div className="h-0 flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Button
            variant="ghost"
            className={`w-full justify-${isCollapsed ? 'center' : 'start'} text-white hover:bg-primary/80 ${
              location === '/admin-dashboard' ? 'bg-primary' : ''
            }`}
            onClick={() => navigate('/admin-dashboard')}
          >
            <LayoutDashboard className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-primary-light`} />
            {!isCollapsed && <span>Dashboard</span>}
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full justify-${isCollapsed ? 'center' : 'start'} text-white hover:bg-primary/80`}
            onClick={() => toast({ title: "Courses", description: "This section is under development" })}
          >
            <Book className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-primary-light`} />
            {!isCollapsed && <span>Courses</span>}
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full justify-${isCollapsed ? 'center' : 'start'} text-white hover:bg-primary/80`}
            onClick={() => toast({ title: "Real-Time Monitoring", description: "This section is under development" })}
          >
            <LineChart className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-primary-light`} />
            {!isCollapsed && <span>Monitoring</span>}
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full justify-${isCollapsed ? 'center' : 'start'} text-white hover:bg-primary/80`}
            onClick={() => toast({ title: "QR Scanner", description: "Use the QR scanner from the course list" })}
          >
            <QrCode className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-primary-light`} />
            {!isCollapsed && <span>QR Scanner</span>}
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full justify-${isCollapsed ? 'center' : 'start'} text-white hover:bg-primary/80`}
            onClick={() => toast({ title: "Students", description: "This section is under development" })}
          >
            <Users className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-primary-light`} />
            {!isCollapsed && <span>Students</span>}
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full justify-${isCollapsed ? 'center' : 'start'} text-white hover:bg-primary/80`}
            onClick={() => toast({ title: "Reports", description: "This section is under development" })}
          >
            <FileText className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-primary-light`} />
            {!isCollapsed && <span>Reports</span>}
          </Button>
          
          <Button
            variant="ghost"
            className={`w-full justify-${isCollapsed ? 'center' : 'start'} text-white hover:bg-primary/80`}
            onClick={() => toast({ title: "Profile", description: "This section is under development" })}
          >
            <UserCircle className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-primary-light`} />
            {!isCollapsed && <span>Profile</span>}
          </Button>
        </nav>
        
        <div className="px-2 py-4">
          <Button
            variant="ghost"
            className={`w-full justify-${isCollapsed ? 'center' : 'start'} text-white hover:bg-primary/80`}
            onClick={handleLogout}
          >
            <LogOut className={`${isCollapsed ? '' : 'mr-3'} h-5 w-5 text-primary-light`} />
            {!isCollapsed && <span>Logout</span>}
          </Button>
          
          {!isCollapsed && (
            <div className="mt-8 px-4 text-sm text-primary-light">
              <p>Logged in as:</p>
              <p className="font-bold">{user?.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
