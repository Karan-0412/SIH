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

  return (
    <nav className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-lg font-semibold tracking-tight">mondly</Link>
          </div>

          <ul className="hidden md:flex items-center gap-1 bg-gray-100 rounded-full p-1">
            {['Courses','Dashboard','Schedule','Message','Support'].map((item) => (
              <li key={item}>
                <button
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${item==='Dashboard' ? 'bg-[#111827] text-white' : 'text-gray-700 hover:bg-white'}`}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3">
            {profile?.role === 'student' && <NotificationsDropdown />}
            {profile && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span className="font-medium">{profile.full_name}</span>
                <span className="text-xs capitalize">({profile.role})</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleSignOut}>
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
