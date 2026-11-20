import { site } from "@/content/site";
import {
  IconGitHub,
  IconInstagram,
  IconLinkedIn,
  IconMail,
} from "@/components/icons";

const pillClass =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-xs transition-all duration-300 hover:scale-95 hover:bg-white/15 has-[>svg]:px-4";

export function SocialLinks() {
  const { links } = site;

  return (
    <div className="flex flex-row flex-wrap items-center justify-center gap-2 md:gap-4">
      <a
        className={pillClass}
        href={links.resume}
        target="_blank"
        rel="noopener noreferrer"
      >
        resume
      </a>
      <a className={pillClass} href={`mailto:${links.email}`}>
        <IconMail className="size-3 shrink-0" />
        <span className="sr-only">Email</span>
      </a>
      <a
        className={pillClass}
        href={links.linkedin}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconLinkedIn className="size-3 shrink-0" />
        <span className="sr-only">LinkedIn</span>
      </a>
      <a
        className={pillClass}
        href={links.github}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconGitHub className="size-3 shrink-0" />
        <span className="sr-only">GitHub</span>
      </a>
      <a
        className={pillClass}
        href={links.instagram}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconInstagram className="size-3 shrink-0" />
        <span className="sr-only">Instagram</span>
      </a>
    </div>
  );
}