import type { AnchorHTMLAttributes, ReactNode } from "react";

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
  href: string;
  children: ReactNode;
};

export function ExternalLink({ href, children, rel, target = "_blank", ...props }: ExternalLinkProps) {
  const mergedRel = ["nofollow", "noopener", "noreferrer", rel].filter(Boolean).join(" ");

  return (
    <a href={href} target={target} rel={mergedRel} {...props}>
      {children}
    </a>
  );
}
