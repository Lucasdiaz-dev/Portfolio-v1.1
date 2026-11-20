import { Hero } from "@/components/Hero";
import { MobileFooter } from "@/components/MobileFooter";
import { ProjectList } from "@/components/ProjectList";
import { TechMarquee } from "@/components/TechMarquee";

export default function HomeV1() {
  return (
    <>
    <main className="mx-auto flex min-h-screen w-full flex-col items-center justify-center p-4 md:w-2/4 md:p-8">
      <div className="mb-8 flex w-full flex-col items-start gap-4">
        <Hero />
      </div>
      <ProjectList />
    </main>
    <MobileFooter />
    <TechMarquee className="hidden md:block" />
    </>
  );
}