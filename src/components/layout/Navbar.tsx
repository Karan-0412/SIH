import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { LogOut, User } from 'lucide-react';
import NotificationsDropdown from '../dashboard/student/NotificationsDropdown';

const Navbar = () => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Signed out successfully!',
      });
    }
  };

  const location = useLocation();
  const tabsRef = React.useRef<HTMLDivElement | null>(null);
  const btnRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = React.useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const items = [
    { label: 'Courses', to: '/courses' },
    { label: 'Dashboard', to: '/' },
    { label: 'Schedule', to: '/schedule' },
    { label: 'Message', to: '/messages' },
    { label: 'Support', to: '/support' },
  ];

  React.useLayoutEffect(() => {
    const active = items.find((i) => i.to === location.pathname) || items[1];
    const container = tabsRef.current;
    const btn = btnRefs.current[active.label];
    if (container && btn) {
      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      setIndicator({ left: bRect.left - cRect.left, width: bRect.width });
    }
  }, [location.pathname]);

  return (
    <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity">mondly</Link>
          </div>

          <div ref={tabsRef} className="relative hidden md:flex items-center gap-1 bg-gray-100 rounded-full p-1">
            <span className="absolute top-1 bottom-1 rounded-full bg-[#111827] shadow-sm transition-all duration-300 ease-out" style={{ left: indicator.left, width: indicator.width }} />
            {items.map((item) => (
              <button
                key={item.label}
                ref={(el) => (btnRefs.current[item.label] = el)}
                onClick={() => (window.location.href = item.to)}
                className={`relative z-10 px-4 py-1.5 rounded-full text-sm transition-colors duration-200 ${location.pathname === item.to ? 'text-white' : 'text-gray-700 hover:text-gray-900'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {profile?.role === 'student' && <NotificationsDropdown />}
            {profile && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700 transition-colors">
                <User className="h-4 w-4" />
                <span className="font-medium">{profile.full_name}</span>
                <span className="text-xs capitalize">({profile.role})</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut} className="transition-all duration-200 hover:-translate-y-0.5">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
