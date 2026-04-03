/**
 * Breadcrumbs Component - VHS-themed navigation trail
 *
 * Shows hierarchical navigation path:
 * Dashboard > Modules > Module Name > Submodule Name
 */

export interface BreadcrumbItem {
  label: string;
  href?: string; // If undefined, item is not clickable (current page)
  icon?: string; // Optional icon prefix
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs(
  { items, className = "" }: BreadcrumbsProps,
) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      class={`mb-6 ${className}`}
    >
      <ol class="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = !isLast && item.href;

          return (
            <li
              key={index}
              class="flex items-center gap-2"
            >
              {isClickable
                ? (
                  <a
                    href={item.href}
                    class="text-t-text-muted hover:text-t-accent transition-colors font-mono uppercase text-xs tracking-wide group"
                  >
                    {item.icon && (
                      <span class="text-t-text-muted group-hover:text-t-accent mr-1">
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </a>
                )
                : (
                  <span class="text-t-text font-mono uppercase text-xs tracking-wide font-bold">
                    {item.icon && (
                      <span class="text-t-accent mr-1">
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                  </span>
                )}

              {!isLast && (
                <span
                  class="text-t-text-muted text-xs"
                  aria-hidden="true"
                >
                  &gt;
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {/* Visual separator */}
      <div class="mt-3 h-[2px] bg-t-border" />
    </nav>
  );
}
