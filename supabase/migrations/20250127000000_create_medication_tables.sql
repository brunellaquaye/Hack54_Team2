-- Create medication_schedules table
CREATE TABLE IF NOT EXISTS public.medication_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    frequency TEXT NOT NULL,
    start_time TIME NOT NULL,
    times_per_day INTEGER NOT NULL DEFAULT 1,
    interval_hours INTEGER NOT NULL DEFAULT 24,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, prescription_id, medicine_name)
);

-- Create medication_reminders table
CREATE TABLE IF NOT EXISTS public.medication_reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_taken BOOLEAN NOT NULL DEFAULT false,
    taken_at TIMESTAMP WITH TIME ZONE,
    frequency TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, prescription_id, medicine_name, scheduled_time)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medication_schedules_user_id ON public.medication_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_prescription_id ON public.medication_schedules(prescription_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_active ON public.medication_schedules(is_active);

CREATE INDEX IF NOT EXISTS idx_medication_reminders_user_id ON public.medication_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_scheduled_time ON public.medication_reminders(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_taken ON public.medication_reminders(is_taken);

-- Enable Row Level Security (RLS)
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medication_schedules
CREATE POLICY "Users can view their own medication schedules" ON public.medication_schedules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medication schedules" ON public.medication_schedules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication schedules" ON public.medication_schedules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication schedules" ON public.medication_schedules
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for medication_reminders
CREATE POLICY "Users can view their own medication reminders" ON public.medication_reminders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own medication reminders" ON public.medication_reminders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medication reminders" ON public.medication_reminders
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication reminders" ON public.medication_reminders
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_medication_schedules_updated_at 
    BEFORE UPDATE ON public.medication_schedules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
