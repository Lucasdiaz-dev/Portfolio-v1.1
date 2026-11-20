import { Hero } from "@/components/Hero";
import { ProjectList } from "@/components/ProjectList";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full flex-col items-center justify-center p-4 md:w-2/4 md:p-8">
      <div className="mb-8 flex w-full flex-col items-start gap-4">
        <Hero />
      </div>
      <ProjectList />
    </main>
  );
}