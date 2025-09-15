import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MobileHeader } from './components/MobileHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PWAInstaller } from './components/PWAInstaller';
import { MedicineForm } from './components/MedicineForm';
import { MedicineCard } from './components/MedicineCard';
import { NotificationAlert } from './components/NotificationAlert';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { Pill, Calendar, Clock, TrendingUp, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useSoundManager } from './components/SoundManager';
import { motion, AnimatePresence } from 'motion/react';

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

interface MedicineLog {
  medicineId: string;
  medicineName: string;
  time: string;
  takenAt: string;
  date: string;
}

export default function App() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [medicineLog, setMedicineLog] = useState<MedicineLog[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'upcoming' | 'history' | 'settings'>('home');
  const [isMobile, setIsMobile] = useState(false);
  const { playSuccessSound } = useSoundManager();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // PWA and mobile optimizations
  useEffect(() => {
    // Add viewport meta tag for proper mobile rendering
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
      document.head.appendChild(meta);
    }

    // Add manifest link
    const manifest = document.querySelector('link[rel="manifest"]');
    if (!manifest) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }

    // Add meta theme color
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#030213';
      document.head.appendChild(meta);
    }

    // Prevent zoom on form inputs on iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const style = document.createElement('style');
      style.textContent = `
        input[type="color"],
        input[type="date"],
        input[type="datetime"],
        input[type="datetime-local"],
        input[type="email"],
        input[type="month"],
        input[type="number"],
        input[type="password"],
        input[type="search"],
        input[type="tel"],
        input[type="text"],
        input[type="time"],
        input[type="url"],
        input[type="week"],
        select:focus,
        textarea {
          font-size: 16px !important;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedMedicines = localStorage.getItem('pillreminder-medicines');
    const savedLog = localStorage.getItem('pillreminder-log');
    
    if (savedMedicines) {
      try {
        setMedicines(JSON.parse(savedMedicines));
      } catch (error) {
        console.error('Error loading medicines from localStorage:', error);
      }
    }
    
    if (savedLog) {
      try {
        setMedicineLog(JSON.parse(savedLog));
      } catch (error) {
        console.error('Error loading log from localStorage:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever medicines or log changes
  useEffect(() => {
    localStorage.setItem('pillreminder-medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('pillreminder-log', JSON.stringify(medicineLog));
  }, [medicineLog]);

  const handleAddMedicine = (medicine: Medicine) => {
    setMedicines(prev => [...prev, medicine]);
    setShowForm(false);
    playSuccessSound();
  };

  const handleDeleteMedicine = (id: string) => {
    setMedicines(prev => prev.filter(med => med.id !== id));
    toast.success('Medicine removed successfully');
  };

  const handleTakeMedicine = (medicineId: string, time: string) => {
    const medicine = medicines.find(med => med.id === medicineId);
    if (medicine) {
      const logEntry: MedicineLog = {
        medicineId,
        medicineName: medicine.name,
        time,
        takenAt: new Date().toTimeString().slice(0, 5),
        date: new Date().toISOString().split('T')[0]
      };
      setMedicineLog(prev => [...prev, logEntry]);
    }
  };

  const handleDismissNotification = (medicineId: string, time: string) => {
    // In a real app, you might want to track dismissed notifications
    console.log(`Dismissed notification for medicine ${medicineId} at ${time}`);
  };

  const getTodaysLog = () => {
    const today = new Date().toISOString().split('T')[0];
    return medicineLog.filter(log => log.date === today);
  };

  const getUpcomingMedicines = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const upcoming = [];

    for (const medicine of medicines) {
      if (medicine.frequency === 'as-needed') continue;
      
      for (const time of medicine.times) {
        const [hours, minutes] = time.split(':').map(Number);
        const medicineMinutes = hours * 60 + minutes;
        
        if (medicineMinutes > currentMinutes) {
          upcoming.push({
            medicine,
            time,
            minutesUntil: medicineMinutes - currentMinutes
          });
        }
      }
    }

    return upcoming
      .sort((a, b) => a.minutesUntil - b.minutesUntil)
      .slice(0, 3);
  };

  const todaysLog = getTodaysLog();
  const upcomingMedicines = getUpcomingMedicines();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upcoming':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Next Doses</h2>
            {upcomingMedicines.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No upcoming doses in the next 2 hours</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingMedicines.slice(0, 10).map((item, index) => (
                  <motion.div
                    key={`${item.medicine.id}-${item.time}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: item.medicine.color }}
                            />
                            <div>
                              <p className="font-medium">{item.medicine.name}</p>
                              <p className="text-sm text-muted-foreground">{item.medicine.dosage}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.time}</p>
                            <p className="text-xs text-muted-foreground">
                              in {Math.floor(item.minutesUntil / 60)}h {item.minutesUntil % 60}m
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'history':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            {todaysLog.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No medications taken today</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {todaysLog.slice(-10).reverse().map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{log.medicineName}</p>
                            <p className="text-sm text-muted-foreground">
                              Scheduled: {log.time} • Taken: {log.takenAt}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            ✓ Done
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Settings</h2>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="text-center">
                  <Pill className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="font-medium mb-2">PillReminder</h3>
                  <p className="text-sm text-muted-foreground mb-4">Version 1.0.0</p>
                  <p className="text-xs text-muted-foreground">
                    Your personal medication reminder app. Stay healthy and never miss a dose.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4">
            {/* Quick Stats - Mobile Optimized */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-3 text-center">
                  <Pill className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-xl font-bold">{medicines.length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 text-center">
                  <Clock className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xl font-bold">{todaysLog.length}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 text-center">
                  <TrendingUp className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                  <p className="text-xl font-bold">{upcomingMedicines.length}</p>
                  <p className="text-xs text-muted-foreground">Next</p>
                </CardContent>
              </Card>
            </div>

            {/* Current Medicines */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Medicines</h2>
                {medicines.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {medicines.length} active
                  </Badge>
                )}
              </div>

              {medicines.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No medicines added yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Tap the + button to add your first medicine
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {medicines.map((medicine, index) => (
                    <motion.div
                      key={medicine.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <MedicineCard
                        medicine={medicine}
                        onDelete={handleDeleteMedicine}
                        onTakeMedicine={handleTakeMedicine}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        {/* Form Header */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border safe-area-inset-top">
          <div className="px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowForm(false)}
              className="h-9 w-9 p-0 touch-target"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg">Add Medicine</h1>
          </div>
        </div>
        
        <div className="p-4 pb-20">
          <MedicineForm 
            onAddMedicine={handleAddMedicine}
            onClose={() => setShowForm(false)}
          />
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mobile-scroll">
      {/* Notifications */}
      <NotificationAlert
        medicines={medicines}
        onTakeMedicine={handleTakeMedicine}
        onDismiss={handleDismissNotification}
      />
      
      <div className="pb-20 min-h-screen">
        {/* Mobile Header */}
        {isMobile ? (
          <MobileHeader 
            medicines={medicines}
            activeTab={activeTab}
          />
        ) : (
          <div className="px-4 py-6">
            <Header 
              medicines={medicines}
              onAddMedicine={() => setShowForm(true)}
            />
          </div>
        )}

        <div className="px-4 space-y-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {isMobile ? renderTabContent() : (
                <div className="space-y-6">
                  {/* Desktop Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Pill className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="text-2xl font-bold">{medicines.length}</p>
                            <p className="text-sm text-muted-foreground">Active Medicines</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Clock className="h-8 w-8 text-green-500" />
                          <div>
                            <p className="text-2xl font-bold">{todaysLog.length}</p>
                            <p className="text-sm text-muted-foreground">Taken Today</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="h-8 w-8 text-orange-500" />
                          <div>
                            <p className="text-2xl font-bold">{upcomingMedicines.length}</p>
                            <p className="text-sm text-muted-foreground">Upcoming Doses</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Next Doses */}
                  {upcomingMedicines.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Next Doses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-3">
                          {upcomingMedicines.map((item, index) => (
                            <div
                              key={`${item.medicine.id}-${item.time}`}
                              className="flex items-center justify-between p-3 rounded-lg border"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: item.medicine.color }}
                                />
                                <div>
                                  <p className="font-medium">{item.medicine.name}</p>
                                  <p className="text-sm text-muted-foreground">{item.medicine.dosage}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{item.time}</p>
                                <p className="text-xs text-muted-foreground">
                                  in {Math.floor(item.minutesUntil / 60)}h {item.minutesUntil % 60}m
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Current Medicines */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Your Medicines</h2>
                      {medicines.length > 0 && (
                        <Badge variant="secondary">
                          {medicines.length} active
                        </Badge>
                      )}
                    </div>

                    {medicines.length === 0 ? (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No medicines added yet</h3>
                          <p className="text-muted-foreground mb-4">
                            Start by adding your first medicine to receive reminders
                          </p>
                          <Button onClick={() => setShowForm(true)}>
                            Add Your First Medicine
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {medicines.map(medicine => (
                          <MedicineCard
                            key={medicine.id}
                            medicine={medicine}
                            onDelete={handleDeleteMedicine}
                            onTakeMedicine={handleTakeMedicine}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Today's Log */}
                  {todaysLog.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Today's Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="space-y-2">
                          {todaysLog.slice(-5).reverse().map((log, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 rounded border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20"
                            >
                              <div>
                                <p className="font-medium">{log.medicineName}</p>
                                <p className="text-sm text-muted-foreground">
                                  Scheduled: {log.time} • Taken: {log.takenAt}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                Completed
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onAddMedicine={() => setShowForm(true)}
        />
      )}

      {/* PWA Installer */}
      <PWAInstaller />

      <Toaster />
    </div>
  );
}