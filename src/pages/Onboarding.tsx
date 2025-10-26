import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const onboardingSteps = [
  {
    title: "Access verified medicines anywhere in Ghana.",
    image: "/onb1.jpg"
  },
  {
    title: "Personalized recommendations from your health data.",
    image: "/onb2.jpg"
  },
  {
    title: "Connect directly with licensed pharmacies.",
    image: "/onb3.jpg"
  }
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate("/signup");
    }
  };

  const handleSkip = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between p-6">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full">
        {/* Image */}
        <div className="w-full aspect-square rounded-3xl mb-8 overflow-hidden shadow-lg">
          <img 
            src={onboardingSteps[currentStep].image} 
            alt={`Onboarding step ${currentStep + 1}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title */}
        <p className="text-foreground text-center text-lg mb-12 px-4">
          {onboardingSteps[currentStep].title}
        </p>

        {/* Progress indicators */}
        <div className="flex gap-2 mb-12">
          {onboardingSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="w-full max-w-md space-y-4">
        <Button
          onClick={handleNext}
          className="w-full h-14 text-base"
          size="lg"
        >
          {currentStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
          {currentStep < onboardingSteps.length - 1 && <ChevronRight className="ml-2" />}
        </Button>

        {currentStep < onboardingSteps.length - 1 && (
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            Skip
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
