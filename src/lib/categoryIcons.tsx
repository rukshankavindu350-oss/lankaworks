import {
  BookOpen,
  Hammer,
  Laptop,
  Paintbrush,
  Sparkles,
  Trees,
  Truck,
  Wind,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Wrench,
  Zap,
  Wind,
  Sparkles,
  Hammer,
  Paintbrush,
  Trees,
  Laptop,
  BookOpen,
  Truck,
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return ICON_MAP[iconName] || Wrench;
}
