import { projects } from "@/content/projects";
import { ProjectRow } from "@/components/v1/ProjectRow";

export function ProjectList() {
  return (
    <section className="flex w-full flex-col items-start gap-3">
      <h3 className="text-md text-start text-white">latest projects i built:</h3>
      <ul className="w-full divide-y divide-white/[0.08]">
        {projects.map((project) => (
          <ProjectRow key={project.name} project={project} />
        ))}
      </ul>
    </section>
  );
}