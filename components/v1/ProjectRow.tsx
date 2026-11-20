import { ProjectInfo } from "@/components/v1/ProjectInfo";
import type { Project } from "@/content/projects";

type ProjectRowProps = {
  project: Project;
};

const projectLinkClass =
  "min-w-0 truncate font-medium text-white/90 underline decoration-white/25 underline-offset-4 outline-none transition-colors hover:text-white hover:decoration-white/50 sm:overflow-visible sm:text-clip";

export function ProjectRow({ project }: ProjectRowProps) {
  const meta = project.stats?.length
    ? project.stats.join(" · ")
    : project.status;

  return (
    <li className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-0.5 py-3 sm:grid-cols-[2.75rem_minmax(0,1fr)_auto_auto_auto] sm:gap-x-3">
      <div className="row-span-2 flex size-8 shrink-0 items-center justify-center sm:row-span-1">
        <span
          className="flex size-7 items-center justify-center rounded-sm text-xs font-medium text-white"
          style={{ backgroundColor: project.iconBg }}
          aria-hidden
        >
          {project.iconLabel}
        </span>
      </div>
      <a
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        className={projectLinkClass}
      >
        {project.name}
      </a>
      {meta ? (
        <div className="col-start-2 flex min-w-0 items-center gap-2 font-light text-white/80 tabular-nums sm:col-start-3 sm:contents">
          <span className="max-sm:hidden whitespace-nowrap sm:min-w-[8rem] sm:text-right" />
          <span className="whitespace-nowrap sm:min-w-[8rem] sm:text-right">
            {meta}
          </span>
        </div>
      ) : null}
      <div className="col-start-3 row-start-1 flex justify-end sm:col-start-5">
        <ProjectInfo description={project.description} />
      </div>
    </li>
  );
}