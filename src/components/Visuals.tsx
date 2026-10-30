import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { brl, isPromoActive } from "@shared/pricing";
import type { MenuItem } from "@shared/types";

/** Foto do produto; se não houver foto (ou o link quebrar), mostra um ícone. */
export function FoodImage({
  src,
  alt,
  className = "",
  loading,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`grid place-items-center bg-chip text-muted ${className}`}
      >
        <UtensilsCrossed size={28} />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

/** Preço do item: se houver promoção valendo, mostra o antigo riscado e o novo. */
export function Price({ item, className = "" }: { item: MenuItem; className?: string }) {
  if (isPromoActive(item)) {
    return (
      <span className={className} data-testid="price-promo">
        <s className="mr-2 text-sm font-medium text-muted">{brl(item.price)}</s>
        {brl(item.promoPrice as number)}
      </span>
    );
  }
  return <span className={className}>{brl(item.price)}</span>;
}

export function PromoPill() {
  return (
    <span className="inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
      Promoção
    </span>
  );
}
