import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

export const useMedicationReminders = () => {
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get today's reminders
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data, error } = await supabase
        .from('medication_reminders')
        .select(`
          *,
          prescriptions!inner(prescription_name)
        `)
        .eq('user_id', user.id)
        .gte('scheduled_time', startOfDay.toISOString())
        .lt('scheduled_time', endOfDay.toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      const formattedReminders = data?.map(reminder => ({
        ...reminder,
        prescription_name: reminder.prescriptions?.prescription_name || 'Unknown Prescription'
      })) || [];

      setReminders(formattedReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReminders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get active medication schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('medication_schedules')
        .select(`
          *,
          prescriptions!inner(prescription_name)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (schedulesError) throw schedulesError;

      if (!schedules || schedules.length === 0) return;

      const today = new Date();
      const remindersToCreate = [];

      for (const schedule of schedules) {
        const startTime = new Date();
        const [hours, minutes] = schedule.start_time.split(':').map(Number);
        startTime.setHours(hours, minutes, 0, 0);

        // Generate reminders for today
        for (let i = 0; i < schedule.times_per_day; i++) {
          const reminderTime = new Date(startTime);
          reminderTime.setHours(startTime.getHours() + (i * schedule.interval_hours));

          // Only create if it's today and not in the past
          if (reminderTime.getDate() === today.getDate() && 
              reminderTime.getMonth() === today.getMonth() && 
              reminderTime.getFullYear() === today.getFullYear() &&
              reminderTime > new Date()) {
            
            remindersToCreate.push({
              user_id: user.id,
              prescription_id: schedule.prescription_id,
              medicine_name: schedule.medicine_name,
              scheduled_time: reminderTime.toISOString(),
              is_taken: false,
              frequency: schedule.frequency,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      if (remindersToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('medication_reminders')
          .upsert(remindersToCreate, {
            onConflict: 'user_id,prescription_id,medicine_name,scheduled_time'
          });

        if (insertError) {
          // If it's a duplicate key error, that's okay - just continue
          if (insertError.code !== '23505') {
            throw insertError;
          }
        }
      }

      // Refresh reminders
      await fetchReminders();
    } catch (error) {
      console.error('Error generating reminders:', error);
    }
  };

  const generateNextReminder = async (prescriptionId: string, medicineName: string) => {
    // For now, just refresh the reminders without generating next ones
    // This prevents the duplicate key error
    await fetchReminders();
  };

  useEffect(() => {
    fetchReminders();
    
    // Generate reminders for today if they don't exist
    generateReminders();
  }, []);

  return {
    reminders,
    loading,
    refetch: fetchReminders,
    generateNextReminder,
  };
};
