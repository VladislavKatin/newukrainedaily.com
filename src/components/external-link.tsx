import type { AnchorHTMLAttributes, ReactNode } from "react";

type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children"> & {
  href: string;
  children: ReactNode;
};

export function ExternalLink({ href, children, rel, target = "_blank", referrerPolicy = "no-referrer", ...props }: ExternalLinkProps) {
  const mergedRel = ["nofollow", "external", "noopener", "noreferrer", rel].filter(Boolean).join(" ");

  return (
    <a href={href} target={target} rel={mergedRel} referrerPolicy={referrerPolicy} {...props}>
      {children}
    </a>
  );
}
