import { lazy, Suspense, memo } from "react";
import { Circle, type LucideProps } from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

type IconName = keyof typeof dynamicIconImports;

interface DynamicLucideIconProps extends Omit<LucideProps, "ref"> {
  /** kebab-case lucide icon name (e.g. "check-square") */
  name: string;
  /** Fallback icon name if `name` doesn't exist. Defaults to Circle. */
  fallback?: IconName;
}

const cache = new Map<string, ReturnType<typeof lazy>>();

function getLazyIcon(name: string) {
  if (cache.has(name)) return cache.get(name)!;
  const importer = (dynamicIconImports as Record<string, () => Promise<any>>)[name];
  if (!importer) return null;
  const Comp = lazy(importer);
  cache.set(name, Comp);
  return Comp;
}

/**
 * Lazy-loads a Lucide icon by kebab-case name.
 * Each icon ships as its own tiny chunk — no full lucide bundle.
 */
export const DynamicLucideIcon = memo(function DynamicLucideIcon({
  name,
  fallback,
  ...props
}: DynamicLucideIconProps) {
  const LazyIcon = getLazyIcon(name) ?? (fallback ? getLazyIcon(fallback) : null);
  if (!LazyIcon) return <Circle {...props} />;
  return (
    <Suspense fallback={<Circle {...props} className={`${props.className ?? ""} opacity-30`} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
});

/** Convert PascalCase/camelCase to kebab-case (helper for legacy code paths). */
export function toKebabIconName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}