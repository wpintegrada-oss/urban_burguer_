import {
  Award,
  Banknote,
  Boxes,
  CreditCard,
  Flame,
  GlassWater,
  Layers,
  QrCode,
  Sparkles,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Flame,
  Award,
  UtensilsCrossed,
  Sparkles,
  Layers,
  Boxes,
  Zap,
  GlassWater,
};

export const PAYMENT_ICONS: Record<string, LucideIcon> = { QrCode, CreditCard, Banknote };
