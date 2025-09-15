import { Button } from './ui/button';
import { Plus, Home, Calendar, History, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface MobileBottomNavProps {
  activeTab: 'home' | 'upcoming' | 'history' | 'settings';
  onTabChange: (tab: 'home' | 'upcoming' | 'history' | 'settings') => void;
  onAddMedicine: () => void;
}

export function MobileBottomNav({ activeTab, onTabChange, onAddMedicine }: MobileBottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-1 h-16 px-3 rounded-lg touch-target ${
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/5 rounded-lg -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Button>
          );
        })}
        
        {/* Floating Add Button */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <Button
            onClick={onAddMedicine}
            size="sm"
            className="h-14 w-14 rounded-full shadow-lg touch-target"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}