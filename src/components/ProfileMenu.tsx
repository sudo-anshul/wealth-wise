
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  ChevronRight, 
  Sun, 
  Moon,
  User,
  Settings,
  HelpCircle,
  BellRing
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileMenu = ({ isOpen, onClose }: ProfileMenuProps) => {
  const { theme, toggleTheme } = useTheme();
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen || !user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate('/landing');
    } catch (error) {
      toast.error("Failed to logout. Please try again.");
    }
    onClose();
  };

  const menuItems = [
    { 
      label: 'Profile', 
      icon: <User size={18} />, 
      action: () => {
        navigate('/profile');
        onClose();
      },
      description: 'View and edit your profile'
    },
    { 
      label: 'Settings', 
      icon: <Settings size={18} />, 
      action: () => {
        navigate('/settings');
        onClose();
      },
      description: 'App preferences & security'
    },
    { 
      label: 'Help Center', 
      icon: <HelpCircle size={18} />, 
      action: () => {
        navigate('/help');
        onClose();
      },
      description: '24/7 customer support'
    },
    { 
      label: 'Notifications', 
      icon: <BellRing size={18} />, 
      action: () => {
        navigate('/notifications');
        onClose();
      },
      description: 'Configure your alerts'
    },
  ];

  return (
    <div 
      className="fixed right-4 top-16 w-80 z-50 shadow-lg rounded-xl overflow-hidden border"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="theme-dark:bg-secondary/80 theme-light:bg-white/95 backdrop-blur-lg">
        {/* User Profile Header */}
        <div className="p-4 border-b theme-dark:border-white/10 theme-light:border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12 cursor-pointer" onClick={() => { navigate('/profile'); onClose(); }}>
              {userProfile?.profilePictureUrl ? (
                <AvatarImage src={userProfile.profilePictureUrl} alt={userProfile.displayName || 'User'} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userProfile?.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium">{userProfile?.displayName || user.email?.split('@')[0] || 'User'}</h3>
              <p className="text-sm theme-dark:text-white/60 theme-light:text-gray-500 truncate max-w-[180px]">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-2">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center p-2 rounded-lg hover:bg-black/5 theme-dark:hover:bg-white/5 theme-light:hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={item.action}
            >
              <div className="w-8 h-8 rounded-full theme-dark:bg-white/10 theme-light:bg-gray-100 flex items-center justify-center mr-3">
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs theme-dark:text-white/60 theme-light:text-gray-500">{item.description}</p>
              </div>
              <ChevronRight size={16} className="theme-dark:text-white/40 theme-light:text-gray-400" />
            </div>
          ))}
        </div>
        
        {/* Footer Actions */}
        <div className="border-t theme-dark:border-white/10 theme-light:border-gray-200 p-3">
          {/* Theme Toggle */}
          <div 
            className="flex items-center p-2 rounded-lg hover:bg-black/5 theme-dark:hover:bg-white/5 theme-light:hover:bg-gray-100 transition-colors cursor-pointer mb-2"
            onClick={toggleTheme}
          >
            <div className="w-8 h-8 rounded-full theme-dark:bg-white/10 theme-light:bg-gray-100 flex items-center justify-center mr-3">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </div>
            <span className="flex-1 font-medium">
              {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </span>
          </div>
          
          {/* Logout Button */}
          <div 
            className="flex items-center p-2 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
            onClick={handleLogout}
          >
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center mr-3">
              <LogOut size={18} className="text-red-500" />
            </div>
            <span className="flex-1 font-medium text-red-500">Logout</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileMenu;
