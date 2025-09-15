import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Plus, Pill } from 'lucide-react';

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

interface MedicineFormProps {
  onAddMedicine: (medicine: Medicine) => void;
  onClose: () => void;
}

const frequencyOptions = [
  { value: 'once-daily', label: 'Once Daily', times: 1 },
  { value: 'twice-daily', label: 'Twice Daily', times: 2 },
  { value: 'three-times-daily', label: 'Three Times Daily', times: 3 },
  { value: 'four-times-daily', label: 'Four Times Daily', times: 4 },
  { value: 'as-needed', label: 'As Needed', times: 0 }
];

const colors = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
];

export function MedicineForm({ onAddMedicine, onClose }: MedicineFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: ''
  });
  const [times, setTimes] = useState<string[]>(['']);
  const [selectedColor, setSelectedColor] = useState(colors[0]);

  const handleFrequencyChange = (frequency: string) => {
    setFormData(prev => ({ ...prev, frequency }));
    const option = frequencyOptions.find(opt => opt.value === frequency);
    if (option && option.times > 0) {
      setTimes(Array(option.times).fill(''));
    } else {
      setTimes(['']);
    }
  };

  const handleTimeChange = (index: number, time: string) => {
    const newTimes = [...times];
    newTimes[index] = time;
    setTimes(newTimes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.dosage || !formData.frequency) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.frequency !== 'as-needed' && times.some(time => !time)) {
      toast.error('Please set all medication times');
      return;
    }

    const medicine: Medicine = {
      id: Date.now().toString(),
      name: formData.name,
      dosage: formData.dosage,
      frequency: formData.frequency,
      times: formData.frequency === 'as-needed' ? [] : times,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      notes: formData.notes || undefined,
      color: selectedColor
    };

    onAddMedicine(medicine);
    toast.success('Medicine added successfully!');
    onClose();
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Medicine Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Medicine Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Lisinopril"
              className="h-12 touch-target"
            />
          </div>

          {/* Dosage */}
          <div className="space-y-2">
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
              placeholder="e.g., 10mg, 1 tablet"
              className="h-12"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency *</Label>
            <Select value={formData.frequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Times */}
          {formData.frequency && formData.frequency !== 'as-needed' && (
            <div className="space-y-3">
              <Label>Medication Times *</Label>
              <div className="grid gap-3">
                {times.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Label className="min-w-0 text-sm text-muted-foreground">
                      Dose {index + 1}:
                    </Label>
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      className="h-12"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="h-12"
              />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Medicine Color</Label>
            <div className="flex gap-2 flex-wrap">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    selectedColor === color ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional instructions or notes..."
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 touch-target">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 h-12 touch-target">
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}