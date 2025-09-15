import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Clock, Pill, Calendar, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
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

interface MedicineCardProps {
  medicine: Medicine;
  onDelete: (id: string) => void;
  onTakeMedicine: (id: string, time: string) => void;
}

export function MedicineCard({ medicine, onDelete, onTakeMedicine }: MedicineCardProps) {
  const [takenTimes, setTakenTimes] = useState<string[]>([]);
  const { playSuccessSound } = useSoundManager();
  
  const currentTime = new Date();
  const currentTimeString = currentTime.toTimeString().slice(0, 5);

  const getNextDose = () => {
    if (medicine.frequency === 'as-needed') return null;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    for (const time of medicine.times) {
      const [hours, minutes] = time.split(':').map(Number);
      const medicineMinutes = hours * 60 + minutes;
      
      if (medicineMinutes > currentMinutes) {
        return time;
      }
    }
    
    // If no more doses today, return first dose of tomorrow
    return medicine.times[0];
  };

  const isDueNow = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const medicineTime = new Date();
    medicineTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const diffMinutes = Math.abs(now.getTime() - medicineTime.getTime()) / (1000 * 60);
    
    return diffMinutes <= 15; // Within 15 minutes
  };

  const isOverdue = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const medicineTime = new Date();
    medicineTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    return now > medicineTime && !takenTimes.includes(time);
  };

  const handleTakeMedicine = (time: string) => {
    setTakenTimes(prev => [...prev, time]);
    onTakeMedicine(medicine.id, time);
    playSuccessSound();
    toast.success(`Marked ${medicine.name} as taken for ${time}`);
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'once-daily': return 'Once Daily';
      case 'twice-daily': return 'Twice Daily';
      case 'three-times-daily': return '3x Daily';
      case 'four-times-daily': return '4x Daily';
      case 'as-needed': return 'As Needed';
      default: return frequency;
    }
  };

  const nextDose = getNextDose();

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: medicine.color }}
            />
            <div>
              <h3 className="font-medium">{medicine.name}</h3>
              <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(medicine.id)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {/* Frequency and Next Dose */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {getFrequencyLabel(medicine.frequency)}
            </Badge>
            {nextDose && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Next: {nextDose}
              </Badge>
            )}
          </div>

          {/* Scheduled Times */}
          {medicine.frequency !== 'as-needed' && medicine.times.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Today's Schedule:</p>
              <div className="grid gap-2">
                {medicine.times.map((time, index) => {
                  const isTaken = takenTimes.includes(time);
                  const isDue = isDueNow(time);
                  const overdue = isOverdue(time);
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        isDue 
                          ? 'border-primary bg-primary/5' 
                          : overdue 
                          ? 'border-destructive bg-destructive/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isTaken ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : overdue ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={`text-sm ${isTaken ? 'line-through text-muted-foreground' : ''}`}>
                          {time}
                        </span>
                        {isDue && !isTaken && (
                          <Badge variant="default" className="text-xs">
                            Due Now
                          </Badge>
                        )}
                        {overdue && !isTaken && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      {!isTaken && (
                        <Button
                          size="sm"
                          variant={isDue ? "default" : "outline"}
                          onClick={() => handleTakeMedicine(time)}
                          className="h-10 px-4 text-sm touch-target"
                        >
                          <Pill className="h-4 w-4 mr-2" />
                          Take
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* As Needed Medicine */}
          {medicine.frequency === 'as-needed' && (
            <Button
              variant="outline"
              className="w-full h-12 touch-target"
              onClick={() => handleTakeMedicine(currentTimeString)}
            >
              <Pill className="h-4 w-4 mr-2" />
              Take Now
            </Button>
          )}

          {/* Notes */}
          {medicine.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">{medicine.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}