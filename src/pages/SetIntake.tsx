import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Clock, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Medicine {
  name: string;
  dosage: string;
  frequency?: string;
  amount?: string;
}

interface IntakeSchedule {
  medicineName: string;
  frequency: string;
  startTime: string;
  timesPerDay?: number;
  intervalHours?: number;
  isActive: boolean;
}

const SetIntake = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { prescriptionId, prescriptionName, medicines } = location.state || {};

  const [intakeSchedules, setIntakeSchedules] = useState<IntakeSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!prescriptionId || !medicines) {
      navigate("/my-prescriptions");
      return;
    }

    // Initialize intake schedules for each medicine
    const initialSchedules: IntakeSchedule[] = medicines.map((medicine: Medicine) => ({
      medicineName: medicine.name,
      frequency: "once_daily",
      startTime: "08:00",
      timesPerDay: 1,
      intervalHours: 24,
      isActive: false,
    }));
    setIntakeSchedules(initialSchedules);
  }, [prescriptionId, medicines, navigate]);

  const updateSchedule = (index: number, field: keyof IntakeSchedule, value: any) => {
    const updated = [...intakeSchedules];
    updated[index] = { ...updated[index], [field]: value };
    
    // Update dependent fields based on frequency
    if (field === 'frequency') {
      switch (value) {
        case 'once_daily':
          updated[index].timesPerDay = 1;
          updated[index].intervalHours = 24;
          break;
        case 'twice_daily':
          updated[index].timesPerDay = 2;
          updated[index].intervalHours = 12;
          break;
        case 'three_times_daily':
          updated[index].timesPerDay = 3;
          updated[index].intervalHours = 8;
          break;
        case 'every_6_hours':
          updated[index].timesPerDay = 4;
          updated[index].intervalHours = 6;
          break;
        case 'every_8_hours':
          updated[index].timesPerDay = 3;
          updated[index].intervalHours = 8;
          break;
        case 'every_12_hours':
          updated[index].timesPerDay = 2;
          updated[index].intervalHours = 12;
          break;
        case 'custom':
          // Keep existing values for custom
          break;
      }
    }
    
    setIntakeSchedules(updated);
  };

  const calculateNextIntakeTimes = (schedule: IntakeSchedule) => {
    if (!schedule.isActive) return [];
    
    const startTime = new Date();
    const [hours, minutes] = schedule.startTime.split(':').map(Number);
    startTime.setHours(hours, minutes, 0, 0);
    
    const times = [];
    for (let i = 0; i < schedule.timesPerDay!; i++) {
      const intakeTime = new Date(startTime);
      intakeTime.setHours(startTime.getHours() + (i * schedule.intervalHours!));
      times.push(intakeTime);
    }
    
    return times;
  };

  const handleSaveSchedules = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to save intake schedules");
        return;
      }

      // Save each active schedule
      const activeSchedules = intakeSchedules.filter(schedule => schedule.isActive);
      
      for (const schedule of activeSchedules) {
        const { error } = await supabase
          .from('medication_schedules')
          .upsert({
            user_id: user.id,
            prescription_id: prescriptionId,
            medicine_name: schedule.medicineName,
            frequency: schedule.frequency,
            start_time: schedule.startTime,
            times_per_day: schedule.timesPerDay,
            interval_hours: schedule.intervalHours,
            is_active: true,
            created_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,prescription_id,medicine_name'
          });

        if (error) throw error;
      }

      toast.success("Intake schedules saved successfully!");
      navigate("/my-prescriptions");
    } catch (error) {
      console.error("Error saving schedules:", error);
      toast.error("Failed to save intake schedules");
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: { [key: string]: string } = {
      'once_daily': 'Once Daily',
      'twice_daily': 'Twice Daily',
      'three_times_daily': 'Three Times Daily',
      'every_6_hours': 'Every 6 Hours',
      'every_8_hours': 'Every 8 Hours',
      'every_12_hours': 'Every 12 Hours',
      'custom': 'Custom',
    };
    return labels[frequency] || frequency;
  };

  if (!prescriptionId || !medicines) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/my-prescriptions")}
              className="rounded-full"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Set Intake Schedule</h1>
              <p className="text-sm text-muted-foreground">{prescriptionName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {intakeSchedules.map((schedule, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{schedule.medicineName}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={schedule.isActive ? "default" : "secondary"}>
                      {schedule.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateSchedule(index, 'isActive', !schedule.isActive)}
                    >
                      <Check className={`w-4 h-4 ${schedule.isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`frequency-${index}`}>Frequency</Label>
                    <Select
                      value={schedule.frequency}
                      onValueChange={(value) => updateSchedule(index, 'frequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once_daily">Once Daily</SelectItem>
                        <SelectItem value="twice_daily">Twice Daily</SelectItem>
                        <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
                        <SelectItem value="every_6_hours">Every 6 Hours</SelectItem>
                        <SelectItem value="every_8_hours">Every 8 Hours</SelectItem>
                        <SelectItem value="every_12_hours">Every 12 Hours</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`startTime-${index}`}>Start Time</Label>
                    <Input
                      id={`startTime-${index}`}
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                    />
                  </div>

                  {schedule.frequency === 'custom' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor={`timesPerDay-${index}`}>Times Per Day</Label>
                        <Input
                          id={`timesPerDay-${index}`}
                          type="number"
                          min="1"
                          max="12"
                          value={schedule.timesPerDay}
                          onChange={(e) => updateSchedule(index, 'timesPerDay', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`intervalHours-${index}`}>Interval (Hours)</Label>
                        <Input
                          id={`intervalHours-${index}`}
                          type="number"
                          min="1"
                          max="24"
                          value={schedule.intervalHours}
                          onChange={(e) => updateSchedule(index, 'intervalHours', parseInt(e.target.value))}
                        />
                      </div>
                    </>
                  )}
                </div>

                {schedule.isActive && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Next Intake Times</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {calculateNextIntakeTimes(schedule).map((time, i) => (
                        <div key={i}>
                          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {i < calculateNextIntakeTimes(schedule).length - 1 && ', '}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-4 pt-6">
            <Button
              onClick={handleSaveSchedules}
              disabled={loading || intakeSchedules.every(s => !s.isActive)}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Schedules
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/my-prescriptions")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetIntake;
