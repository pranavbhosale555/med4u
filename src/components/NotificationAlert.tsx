import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Bell, Clock, Pill, X, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSoundManager } from './SoundManager';

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

interface NotificationAlertProps {
  medicines: Medicine[];
  onTakeMedicine: (id: string, time: string) => void;
  onDismiss: (id: string, time: string) => void;
}

interface DueNotification {
  medicine: Medicine;
  time: string;
  id: string;
}

export function NotificationAlert({ medicines, onTakeMedicine, onDismiss }: NotificationAlertProps) {
  const [dueNotifications, setDueNotifications] = useState<DueNotification[]>([]);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasPlayedSound, setHasPlayedSound] = useState<string[]>([]);
  const { playAlarmSound, playSuccessSound } = useSoundManager();

  useEffect(() => {
    const checkForDueMedicines = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const newDueNotifications: DueNotification[] = [];

      medicines.forEach(medicine => {
        if (medicine.frequency === 'as-needed') return;

        medicine.times.forEach(time => {
          const [hours, minutes] = time.split(':').map(Number);
          const medicineMinutes = hours * 60 + minutes;
          const timeDiff = Math.abs(currentMinutes - medicineMinutes);
          
          // Show notification within 5 minutes of scheduled time
          if (timeDiff <= 5) {
            const notificationId = `${medicine.id}-${time}`;
            if (!dismissedNotifications.includes(notificationId)) {
              newDueNotifications.push({
                medicine,
                time,
                id: notificationId
              });
            }
          }
        });
      });

      setDueNotifications(newDueNotifications);

      // Play alarm sound for new notifications
      if (soundEnabled && newDueNotifications.length > 0) {
        const newNotificationIds = newDueNotifications.map(n => n.id);
        const hasNewNotifications = newNotificationIds.some(id => !hasPlayedSound.includes(id));
        
        if (hasNewNotifications) {
          playAlarmSound();
          setHasPlayedSound(prev => [...prev, ...newNotificationIds]);
        }
      }
    };

    // Check immediately
    checkForDueMedicines();

    // Check every minute
    const interval = setInterval(checkForDueMedicines, 60000);

    return () => clearInterval(interval);
  }, [medicines, dismissedNotifications, soundEnabled, hasPlayedSound, playAlarmSound]);

  const handleTakeMedicine = (notification: DueNotification) => {
    onTakeMedicine(notification.medicine.id, notification.time);
    setDismissedNotifications(prev => [...prev, notification.id]);
    
    // Play success sound and vibration
    if (soundEnabled) {
      playSuccessSound();
    }
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const handleDismiss = (notification: DueNotification) => {
    onDismiss(notification.medicine.id, notification.time);
    setDismissedNotifications(prev => [...prev, notification.id]);
  };

  const handlePlayAlarmSound = () => {
    if (soundEnabled) {
      playAlarmSound();
    }
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  };

  if (dueNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 space-y-2">
      {/* Sound Toggle */}
      {dueNotifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-end mb-2"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="bg-background/80 backdrop-blur-sm"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 mr-2" />
            ) : (
              <VolumeX className="h-4 w-4 mr-2" />
            )}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </Button>
        </motion.div>
      )}
      
      <AnimatePresence>
        {dueNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary shadow-lg bg-primary/5 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ 
                        duration: 1,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }}
                    >
                      <Bell className="h-6 w-6 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="font-semibold text-primary">Medicine Reminder</h3>
                      <p className="text-sm text-muted-foreground">Time to take your medication</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(notification)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: notification.medicine.color }}
                    />
                    <div>
                      <p className="font-medium">{notification.medicine.name}</p>
                      <p className="text-sm text-muted-foreground">{notification.medicine.dosage}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Scheduled for {notification.time}</span>
                    <Badge variant="destructive" className="text-xs">
                      Due Now
                    </Badge>
                  </div>

                  {notification.medicine.notes && (
                    <p className="text-xs text-muted-foreground bg-secondary/50 p-2 rounded">
                      {notification.medicine.notes}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(notification)}
                      className="flex-1"
                    >
                      Dismiss
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleTakeMedicine(notification)}
                      className="flex-1"
                    >
                      <Pill className="h-4 w-4 mr-2" />
                      Mark as Taken
                    </Button>
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePlayAlarmSound}
                      className="text-xs"
                    >
                      <Volume2 className="h-3 w-3 mr-1" />
                      Play Alarm
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}