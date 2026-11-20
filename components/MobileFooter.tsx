import { LogoFX } from "@/components/fx/LogoFX";

// solo mobile: en desktop el logo va al lado del nombre
export function MobileFooter() {
  return (
    <footer className="flex justify-center pt-8 pb-16 md:hidden">
      <LogoFX size={56} />
    </footer>
  );
}
