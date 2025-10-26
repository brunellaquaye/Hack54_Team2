import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import UploadPrescription from "./pages/UploadPrescription";
import MedicineAvailability from "./pages/MedicineAvailability";
import PharmacyDetails from "./pages/PharmacyDetails";
import Checkout from "./pages/Checkout";
import DrugInfo from "./pages/DrugInfo";
import MyPrescriptions from "./pages/MyPrescriptions";
import PrescriptionDetail from "./pages/PrescriptionDetail";
import SetIntake from "./pages/SetIntake";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/upload-prescription" element={<UploadPrescription />} />
          <Route path="/medicine-availability" element={<MedicineAvailability />} />
          <Route path="/pharmacy-details" element={<PharmacyDetails />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/drug-info" element={<DrugInfo />} />
          <Route path="/my-prescriptions" element={<MyPrescriptions />} />
          <Route path="/prescription-detail" element={<PrescriptionDetail />} />
          <Route path="/set-intake" element={<SetIntake />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
