import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Pill, Plus, Calendar, Bell, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

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

interface HeaderProps {
  medicines: Medicine[];
  onAddMedicine: () => void;
  className?: string;
}

export function Header({ medicines, onAddMedicine, className = '' }: HeaderProps) {
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

  const getUpcomingDoses = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    let upcomingCount = 0;

    medicines.forEach(medicine => {
      if (medicine.frequency === 'as-needed') return;
      
      medicine.times.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const medicineMinutes = hours * 60 + minutes;
        
        // Count upcoming doses in the next 2 hours
        if (medicineMinutes > currentMinutes && medicineMinutes <= currentMinutes + 120) {
          upcomingCount++;
        }
      });
    });

    return upcomingCount;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const upcomingDoses = getUpcomingDoses();

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Pill className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold">Time4Med</h1>
                <p className="text-sm text-muted-foreground">Your medication companion</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="h-8 w-8 p-0"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <Button onClick={onAddMedicine} className="h-10">
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatTime(currentTime)}</p>
              <p className="text-sm text-muted-foreground">{formatDate(currentTime)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{medicines.length} Active</span>
            </div>
            
            {upcomingDoses > 0 && (
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <Badge variant="secondary" className="text-xs">
                  {upcomingDoses} upcoming
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}