import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, FileText, MapPin, Pill, Home, ScanLine, Activity, User, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import QuickActionCard from "@/components/QuickActionCard";
import MedicationCard from "@/components/MedicationCard";
import ReminderCard from "@/components/ReminderCard";
import MedicationReminder from "@/components/MedicationReminder";
import { useMedicationReminders } from "@/hooks/useMedicationReminders";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  amount: string;
}

interface Prescription {
  id: string;
  prescription_name: string;
  medicines: Medicine[];
  created_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingDrugInfo, setIsLoadingDrugInfo] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Medication reminders
  const { reminders, loading: remindersLoading, refetch: refetchReminders, generateNextReminder } = useMedicationReminders();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (session) {
          fetchPrescriptions();
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/onboarding");
      } else {
        fetchPrescriptions();
      }
    });

    // Click outside handler for search suggestions
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [navigate]);

  const fetchPrescriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrescriptions((data || []) as unknown as Prescription[]);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysLeft = (createdAt: string, frequency: string) => {
    const startDate = new Date(createdAt);
    const today = new Date();
    const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Default to 30 days prescription duration
    const totalDays = 30;
    const daysLeft = Math.max(0, totalDays - daysPassed);
    return { daysLeft, totalDays };
  };

  const getUserDisplayName = () => {
    if (!session?.user) return "there";
    
    // Try to get name from user metadata first
    const metadata = session.user.user_metadata;
    if (metadata?.full_name) return metadata.full_name;
    if (metadata?.name) return metadata.name;
    
    // Fallback to email username
    if (session.user.email) {
      return session.user.email.split('@')[0];
    }
    
    return "there";
  };

  const getAllMedicines = () => {
    const allMeds: Array<Medicine & { prescriptionDate: string }> = [];
    prescriptions.forEach(prescription => {
      if (prescription.medicines && Array.isArray(prescription.medicines)) {
        prescription.medicines.forEach((med: Medicine) => {
          allMeds.push({
            ...med,
            prescriptionDate: prescription.created_at
          });
        });
      }
    });
    return allMeds;
  };

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('drug-autocomplete', {
          body: { query: value }
        });

        if (error) throw error;
        
        if (data?.suggestions && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching autocomplete:', error);
      }
    }, 300);
  };

  const handleDrugSelect = async (drugName: string) => {
    setSearchQuery(drugName);
    setShowSuggestions(false);
    setIsLoadingDrugInfo(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/drug-info`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ medicineName: drugName })
        }
      );

      if (!response.ok || !response.body) {
        throw new Error('Failed to fetch drug information');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let drugInfo = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                drugInfo += content;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

      navigate('/drug-info', {
        state: { medicineName: drugName, drugInfo }
      });
    } catch (error) {
      console.error('Error fetching drug info:', error);
      toast.error('Failed to fetch drug information');
    } finally {
      setIsLoadingDrugInfo(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-[image:var(--gradient-header)] text-white px-6 pt-8 pb-8 rounded-b-[2rem]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm opacity-90 mb-1">WELCOME</p>
            <h1 className="text-2xl font-bold">{getUserDisplayName()}</h1>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <Bell className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div ref={searchContainerRef} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Search for medication"
            className="pl-12 h-12 bg-white border-0 rounded-2xl text-foreground placeholder:text-muted-foreground"
            disabled={isLoadingDrugInfo}
          />
          {isLoadingDrugInfo && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
          )}
          
          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-border max-h-60 overflow-y-auto z-20">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleDrugSelect(suggestion)}
                  className="w-full text-left px-4 py-3 hover:bg-muted transition-colors first:rounded-t-2xl last:rounded-b-2xl border-b border-border last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <Pill className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 -mt-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <QuickActionCard icon={FileText} label="My Prescriptions" onClick={() => navigate("/my-prescriptions")} />
          <QuickActionCard icon={MapPin} label="Nearby Pharmacies" onClick={() => window.open('https://maps.app.goo.gl/8XBc7qqyTtDiXa419', '_blank')} />
          <QuickActionCard icon={Pill} label="AI Drug Info" onClick={() => navigate("/drug-info")} />
        </div>

        {/* Current Medications */}
        <section className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Current Medications</h2>
            <button 
              onClick={() => navigate("/my-prescriptions")}
              className="text-primary text-sm font-medium"
            >
              See all
            </button>
          </div>
          {loading ? (
            <div className="bg-card rounded-2xl p-6 text-center text-muted-foreground">
              Loading medications...
            </div>
          ) : getAllMedicines().length > 0 ? (
            <div className="space-y-3">
              {getAllMedicines().slice(0, 2).map((med, index) => {
                const { daysLeft, totalDays } = calculateDaysLeft(med.prescriptionDate, med.frequency);
                return (
                  <MedicationCard
                    key={index}
                    name={med.name}
                    dosage={med.dosage}
                    instructions={`${med.amount} ${med.frequency}`}
                    daysLeft={daysLeft}
                    totalDays={totalDays}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-6 text-center">
              <p className="text-muted-foreground mb-3">No active medications</p>
              <button
                onClick={() => navigate("/upload-prescription")}
                className="text-primary text-sm font-medium"
              >
                Upload a prescription to get started
              </button>
            </div>
          )}
        </section>

        {/* Medication Reminders */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Today's Medication Reminders</h2>
            <button 
              onClick={() => navigate("/my-prescriptions")}
              className="text-primary text-sm font-medium"
            >
              Manage Schedules
            </button>
          </div>
          {remindersLoading ? (
            <div className="bg-card rounded-2xl p-6 text-center text-muted-foreground">
              Loading reminders...
            </div>
          ) : (
            <MedicationReminder 
              reminders={reminders} 
              onReminderUpdate={refetchReminders}
              onGenerateNextReminder={generateNextReminder}
            />
          )}
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button 
            onClick={() => navigate("/upload-prescription")}
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <ScanLine className="w-6 h-6" />
            <span className="text-xs">Scan</span>
          </button>
          <button 
            onClick={() => navigate("/insights")}
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <Activity className="w-6 h-6" />
            <span className="text-xs">Insights</span>
          </button>
          <button 
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center gap-1 text-muted-foreground"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Index;
