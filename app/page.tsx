import { ParticleField } from "@/components/ParticleField";
import { WelcomeContent } from "@/components/WelcomeContent";
import { WelcomePageShell } from "@/components/WelcomePageShell";

export default function WelcomePage() {
  return (
    <WelcomePageShell>
      <ParticleField />
      <WelcomeContent />
    </WelcomePageShell>
  );
}
