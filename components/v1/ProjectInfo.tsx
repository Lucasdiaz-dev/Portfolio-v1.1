import { IconInfo } from "@/components/icons";

type ProjectInfoProps = {
  description: string;
};

export function ProjectInfo({ description }: ProjectInfoProps) {
  return (
    <div className="group/info relative">
      <button
        type="button"
        aria-label="project details"
        className="relative inline-flex size-4 shrink-0 cursor-help touch-manipulation items-center justify-center text-white/45 outline-none transition-colors before:absolute before:inset-[-14px] before:content-[''] hover:text-white/75 focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:before:inset-[-6px]"
      >
        <IconInfo className="size-4 shrink-0" />
      </button>
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+12px)] right-0 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-md border border-white/10 bg-black/95 p-4 text-left text-xs font-light leading-snug text-white/90 normal-case opacity-0 shadow-lg transition-opacity duration-300 group-hover/info:opacity-100 group-focus-within/info:opacity-100"
      >
        {description}
      </div>
    </div>
  );
}