"use client";

// Home: header y marquee fijos; el bloque del medio
// se desliza horizontalmente al detalle del proyecto.
import { useEffect, useState } from "react";
import { site } from "@/content/site";
import { projects, type Project } from "@/content/projects";
import { SocialLinks } from "@/components/SocialLinks";
import { LogoFX } from "@/components/fx/LogoFX";
import { TextFX } from "@/components/fx/TextFX";
import { MobileFooter } from "@/components/MobileFooter";
import { TechMarquee } from "@/components/fx/TechMarquee";

const MAX_PROJECTS = 4; // corto para que no choque con la marquee

// Campos opcionales para el detalle (se pueden sumar en content/projects.ts):
//   loom: id o link de Loom (ej. "https://www.loom.com/share/abc123")
//   details: texto más largo de lo que se hizo
type ProjectV2 = Project & { loom?: string; details?: string };

const inlineLinkClass =
  "underline decoration-white/25 underline-offset-4 transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-600 hover:to-purple-400 hover:bg-clip-text hover:text-transparent";

function loomEmbed(loom?: string) {
  if (!loom) return null;
  const id = loom.split("/").pop()?.split("?")[0];
  return id ? `https://www.loom.com/embed/${id}?hide_owner=true&hide_share=true&hide_title=true` : null;
}

function Icon({ project }: { project: Project }) {
  return (
    <span
      className="flex size-7 shrink-0 items-center justify-center rounded-sm text-xs font-medium text-white"
      style={{ backgroundColor: project.iconBg }}
      aria-hidden
    >
      {project.iconLabel}
    </span>
  );
}

export function Home({ nameClassName = "" }: { nameClassName?: string }) {
  const list = projects.slice(0, MAX_PROJECTS) as ProjectV2[];
  const [active, setActive] = useState<number | null>(null);
  // guardamos el último abierto para que no se vacíe mientras vuelve la animación
  const [shown, setShown] = useState(0);
  const open = active !== null;
  const project = list[active ?? shown];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const meta = (p: Project) => (p.stats?.length ? p.stats.join(" · ") : p.status);
  const embed = project ? loomEmbed(project.loom) : null;

  return (
    <>
      <div className="flex min-h-screen w-full flex-col overflow-x-hidden px-5 pt-10 pb-10 md:px-14 md:pt-14 md:pb-[170px]">
        {/* header centrado en x */}
        <header className="flex cursor-default justify-center pt-8 select-none md:pt-16">
          <div className="flex items-center gap-5">
            <LogoFX fitParent linkHover={false} className="relative hidden shrink-0 md:block" />
            <TextFX>
            <div className="flex flex-col gap-2">
              <h1 className={`text-start text-[72px] leading-none font-normal tracking-[-0.045em] text-white ${nameClassName}`}>
                {site.name}
              </h1>
              <h2 className="text-md text-start text-white">
                {site.rolePrefix.replace(/\s*currently building @\s*$/, "")}
                <br />
                building @{" "}
                <a href={site.building.href} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                  {site.building.name}
                </a>
              </h2>
            </div>
            </TextFX>
          </div>
        </header>

        {/* bloque del medio centrado en y */}
        <main className="-mx-5 mt-12 flex flex-1 items-center selection:bg-white selection:text-black md:-mx-14 md:mt-0">
          {/* ancho completo: el slide llega hasta el borde de la pantalla */}
          <div className="w-full overflow-hidden">
            <div
              className="flex w-[200%] items-center transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
              style={{ transform: open ? "translateX(-50%)" : "translateX(0)" }}
            >
              {/* panel 1: home */}
              <div className="w-1/2 px-5 md:px-14" inert={open} aria-hidden={open}>
              <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
                <section className="flex flex-col gap-6">
                  {site.paragraphs.map((p) => (
                    <p key={p} className="text-md text-start text-white selection:bg-white selection:text-black">{p}</p>
                  ))}
                  <div className="flex flex-col gap-3 select-none">
                    <span className="text-sm text-white/50">reach out</span>
                    <div className="[&>div]:justify-start">
                      <SocialLinks />
                    </div>
                  </div>
                </section>

                <section className="flex w-full flex-col items-start gap-3">
                  <h3 className="text-md text-start text-white">latest projects i built:</h3>
                  <ul className="w-full divide-y divide-white/[0.08]">
                    {list.map((p, i) => (
                      <li key={`${p.name}-${i}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setShown(i);
                            setActive(i);
                          }}
                          className="group flex w-full cursor-pointer items-center gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                        >
                          <Icon project={p} />
                          <TextFX hoverParent className="min-w-0 flex-1">
                          <span className="flex items-center gap-3">
                          <span className="min-w-0 flex-1 truncate font-medium text-white/90 underline decoration-white/25 underline-offset-4 transition-colors group-hover:text-white group-hover:decoration-white/50">
                            {p.name}
                          </span>
                          {meta(p) ? (
                            <span className="whitespace-nowrap font-light text-white/60 tabular-nums">{meta(p)}</span>
                          ) : null}
                          <span
                            aria-hidden
                            className="text-white/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white/80"
                          >
                            →
                          </span>
                          </span>
                          </TextFX>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              </div>
              {/* panel 2: detalle */}
              <div className="w-1/2 px-5 md:px-14" inert={!open} aria-hidden={!open}>
              <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-14">
                {project ? (
                  <>
                    <section className="flex flex-col items-start gap-5">
                      <button
                        type="button"
                        onClick={() => setActive(null)}
                        className="group inline-flex cursor-pointer items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
                      >
                        <TextFX hoverParent>
                          <span className="inline-flex items-center gap-2">
                            <span aria-hidden>←</span>
                            back
                          </span>
                        </TextFX>
                      </button>
                      <div className="flex items-center gap-3">
                        <Icon project={project} />
                        <h3 className="text-2xl font-normal tracking-[-0.01em] text-white">{project.name}</h3>
                      </div>
                      {meta(project) ? (
                        <span className="text-sm font-light text-white/50">{meta(project)}</span>
                      ) : null}
                      <p className="text-md text-start text-white/90 selection:bg-white selection:text-black">{project.details ?? project.description}</p>
                      {project.href ? (
                        <a href={project.href} target="_blank" rel="noopener noreferrer" className={`text-sm text-white ${inlineLinkClass}`}>
                          visit project ↗
                        </a>
                      ) : null}
                    </section>

                    <div className="aspect-video w-full overflow-hidden rounded-xl bg-white/5">
                      {embed && open ? (
                        <iframe
                          src={embed}
                          title={`${project.name} demo`}
                          allow="fullscreen; autoplay"
                          allowFullScreen
                          className="size-full border-0"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-sm text-white/30">
                          loom demo
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <MobileFooter />
      <TechMarquee className="hidden md:block" />
    </>
  );
}
