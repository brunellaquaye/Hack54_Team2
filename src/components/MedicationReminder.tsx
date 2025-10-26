import { useState, useEffect } from "react";
import { Clock, Check, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface MedicationReminder {
  id: string;
  medicine_name: string;
  scheduled_time: string;
  is_taken: boolean;
  taken_at?: string;
  prescription_id: string;
  prescription_name: string;
  frequency: string;
  created_at: string;
}

interface MedicationReminderProps {
  reminders: MedicationReminder[];
  onReminderUpdate: () => void;
  onGenerateNextReminder?: (prescriptionId: string, medicineName: string) => void;
}

const MedicationReminder = ({ reminders, onReminderUpdate, onGenerateNextReminder }: MedicationReminderProps) => {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleMarkTaken = async (reminderId: string) => {
    setUpdating(reminderId);
    try {
      // First, get the reminder details
      const reminder = reminders.find(r => r.id === reminderId);
      if (!reminder) return;

      // Delete the reminder instead of just marking it as taken
      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      toast.success("Medication marked as taken!");
      
      // Generate next reminder if function is provided
      if (onGenerateNextReminder) {
        await onGenerateNextReminder(reminder.prescription_id, reminder.medicine_name);
      } else {
        onReminderUpdate();
      }
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast.error("Failed to mark medication as taken");
    } finally {
      setUpdating(null);
    }
  };

  const handleMarkMissed = async (reminderId: string) => {
    setUpdating(reminderId);
    try {
      // Delete the reminder when marked as missed
      const { error } = await supabase
        .from('medication_reminders')
        .delete()
        .eq('id', reminderId);

      if (error) throw error;

      toast.success("Medication marked as missed");
      onReminderUpdate();
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast.error("Failed to update reminder");
    } finally {
      setUpdating(null);
    }
  };

  const getTimeStatus = (scheduledTime: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledTime);
    const diffMinutes = Math.floor((now.getTime() - scheduled.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) {
      return { status: 'upcoming', text: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (diffMinutes <= 30) {
      return { status: 'due', text: 'Due Now', color: 'bg-green-100 text-green-800' };
    } else if (diffMinutes <= 60) {
      return { status: 'overdue', text: 'Overdue', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'missed', text: 'Missed', color: 'bg-red-100 text-red-800' };
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (reminders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No pending medication reminders</p>
          <p className="text-sm text-muted-foreground mt-2">All medications for today have been taken!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => {
        const timeStatus = getTimeStatus(reminder.scheduled_time);
        const isUpdating = updating === reminder.id;
        
        return (
          <Card key={reminder.id} className={`transition-all ${reminder.is_taken ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{reminder.medicine_name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {reminder.prescription_name}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(reminder.scheduled_time)}</span>
                    </div>
                    <Badge className={timeStatus.color}>
                      {timeStatus.text}
                    </Badge>
                    {reminder.is_taken && (
                      <div className="flex items-center gap-1 text-green-600">
                        <Check className="w-4 h-4" />
                        <span>Taken at {formatTime(reminder.taken_at!)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {!reminder.is_taken && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleMarkTaken(reminder.id)}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isUpdating ? (
                        <Clock className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkMissed(reminder.id)}
                      disabled={isUpdating}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MedicationReminder;
