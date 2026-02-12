import { ParticleField } from "@/components/ParticleField";
import { WelcomeContent } from "@/components/WelcomeContent";

export default function WelcomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0E0F11]">
      <ParticleField />
      <WelcomeContent />
    </div>
  );
}
