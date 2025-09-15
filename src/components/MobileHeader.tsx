import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Pill, Bell, Moon, Sun, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
  color: string;
}

interface MobileHeaderProps {
  medicines: Medicine[];
  activeTab: string;
  className?: string;
}

export function MobileHeader({ medicines, activeTab, className = '' }: MobileHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(!isDarkMode);
  };

  const getUpcomingCount = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let count = 0;

    medicines.forEach(medicine => {
      if (medicine.frequency === 'as-needed') return;
      
      medicine.times.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const medicineMinutes = hours * 60 + minutes;
        
        if (medicineMinutes > currentMinutes && medicineMinutes <= currentMinutes + 120) {
          count++;
        }
      });
    });

    return count;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'home': return 'PillReminder';
      case 'upcoming': return 'Upcoming Doses';
      case 'history': return 'Medication History';
      case 'settings': return 'Settings';
      default: return 'PillReminder';
    }
  };

  const upcomingCount = getUpcomingCount();

  return (
    <div className={`sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border safe-area-inset-top ${className}`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <Pill className="h-7 w-7 text-primary" />
              <div>
                <h1 className="font-semibold text-lg">{getTabTitle(activeTab)}</h1>
                <p className="text-xs text-muted-foreground">{formatTime(currentTime)}</p>
              </div>
            </motion.div>
          </div>
          
          <div className="flex items-center gap-2">
            {upcomingCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1"
              >
                <Bell className="h-4 w-4 text-primary" />
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  {upcomingCount}
                </Badge>
              </motion.div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="h-9 w-9 p-0 touch-target"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats for Home Tab */}
        {activeTab === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-4"
          >
            <div className="text-center">
              <p className="text-xl font-bold">{medicines.length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}