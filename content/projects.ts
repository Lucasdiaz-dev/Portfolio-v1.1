export type Project = {
  name: string;
  href: string;
  description: string;
  status?: string;
  stats?: string[];
  iconBg: string;
  iconLabel: string;
};

export const projects: Project[] = [
  {
    name: "example",
    href: "",
    description:
      "personal site with a full-viewport shader gradient background and minimal links.",
    status: "previous version",
    iconBg: "#b100e9",
    iconLabel: "p",
  },
  {
    name: "example",
    href: "",
    description:
      "this portfolio — next.js, minimal layout, project list, and editable content files.",
    status: "this site",
    iconBg: "#2225ca",
    iconLabel: "v",
  },
];