import { site } from "@/content/site";
import { SocialLinks } from "@/components/SocialLinks";

const inlineLinkClass =
  "underline decoration-white/25 underline-offset-4 transition-all duration-300 hover:bg-gradient-to-br hover:from-purple-600 hover:to-purple-400 hover:bg-clip-text hover:text-transparent";

export function Hero() {
  return (
    <>
      <h1 className="text-start text-xl text-white">{site.name}</h1>
      <h2 className="text-md text-start text-white">
        {site.rolePrefix}{" "}
        <a
          href={site.building.href}
          target="_blank"
          rel="noopener noreferrer"
          className={inlineLinkClass}
        >
          {site.building.name}
        </a>
      </h2>
      <p className="text-md text-start text-white">
        {site.paragraphs[0]}
        <br />
        <br />
        {site.paragraphs[1]}
      </p>
      <SocialLinks />
    </>
  );
}