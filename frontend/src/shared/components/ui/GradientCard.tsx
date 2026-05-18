import {
  AnchorHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  forwardRef,
} from "react";
import { Link, LinkProps } from "react-router-dom";
import { gradients, type GradientVariant } from "@/shared/theme/gradients";
import { cardBase } from "@/shared/theme/cardVariants";

interface CommonProps {
  variant?: GradientVariant;
  /** Apply the lift/scale hover effect. Default `true` for link cards. */
  interactive?: boolean;
  /** Adds a thin accent gradient stripe across the top edge. */
  accentStripe?: boolean;
  /** Stronger border in the variant's hue (used by SEE / featured surfaces). */
  bordered?: boolean;
  className?: string;
  children: ReactNode;
}

type LinkCardProps = CommonProps &
  Omit<LinkProps, "className" | "children"> & { to: LinkProps["to"] };
type AnchorCardProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
  };
type DivCardProps = CommonProps &
  Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

type GradientCardProps = LinkCardProps | AnchorCardProps | DivCardProps;

const RING_TO_BORDER: Record<string, string> = {
  "ring-rose-200": "border-rose-300",
  "ring-indigo-200": "border-indigo-300",
  "ring-blue-200": "border-blue-300",
  "ring-amber-200": "border-amber-300",
  "ring-emerald-200": "border-emerald-300",
  "ring-pink-200": "border-pink-300",
  "ring-violet-200": "border-violet-300",
  "ring-sky-200": "border-sky-300",
  "ring-teal-200": "border-teal-300",
  "ring-gray-200": "border-gray-300",
};

const buildBaseClasses = (
  variant: GradientVariant,
  interactive: boolean,
  bordered: boolean,
) => {
  const { bg, ring } = gradients[variant];
  return [
    cardBase.rest,
    bg,
    interactive ? cardBase.hover : "",
    bordered ? `border-2 ${RING_TO_BORDER[ring] ?? "border-gray-300"}` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

/**
 * Premium card primitive. Composes the soft gradient surface + the standard
 * card geometry (rounded-2xl, soft border, lift-on-hover). Pick a variant to
 * tint the surface; pick `accentStripe` for the featured look (a thin colour
 * band across the top edge — used by SEE / featured surfaces).
 */
const GradientCard = forwardRef<HTMLElement, GradientCardProps>(
  (props, ref) => {
    const variant: GradientVariant = props.variant ?? "neutral";
    const interactive = props.interactive ?? true;
    const accentStripe = props.accentStripe ?? false;
    const bordered = props.bordered ?? false;
    const className = props.className ?? "";
    const children = props.children;

    const base = buildBaseClasses(variant, interactive, bordered);
    const cls = `${base} ${className}`.trim();
    const stripeClass = gradients[variant].accent;

    const body = (
      <>
        {accentStripe && (
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${stripeClass}`}
          />
        )}
        {children}
      </>
    );

    if ("to" in props && props.to !== undefined) {
      const {
        variant: _v,
        interactive: _i,
        accentStripe: _a,
        bordered: _b,
        className: _c,
        children: _ch,
        ...linkRest
      } = props;
      void _v; void _i; void _a; void _b; void _c; void _ch;
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={cls}
          {...(linkRest as Omit<LinkProps, "className" | "children">)}
        >
          {body}
        </Link>
      );
    }
    if ("href" in props && props.href !== undefined) {
      const {
        variant: _v,
        interactive: _i,
        accentStripe: _a,
        bordered: _b,
        className: _c,
        children: _ch,
        ...anchorRest
      } = props;
      void _v; void _i; void _a; void _b; void _c; void _ch;
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={cls}
          {...(anchorRest as Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children">)}
        >
          {body}
        </a>
      );
    }
    const {
      variant: _v,
      interactive: _i,
      accentStripe: _a,
      bordered: _b,
      className: _c,
      children: _ch,
      ...divRest
    } = props as DivCardProps;
    void _v; void _i; void _a; void _b; void _c; void _ch;
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cls}
        {...(divRest as HTMLAttributes<HTMLDivElement>)}
      >
        {body}
      </div>
    );
  },
);

GradientCard.displayName = "GradientCard";
export default GradientCard;
