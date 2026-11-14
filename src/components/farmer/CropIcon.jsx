import { Wheat, Flower2, Bean, Carrot, Sprout } from "lucide-react";
const icons = {
  wheat: Wheat,
  berseem: Flower2,
  faba_bean: Bean,
  sugar_beet: Carrot,
  maize: Wheat,
  sorghum: Wheat,
  soybean: Bean,
  sesame: Flower2,
  cowpea_nili: Sprout,
};
export default function CropIcon({ id, size = 22 }) {
  const Icon = icons[id] ?? Sprout;
  return (
    <span className={`crop-symbol crop-${id}`} aria-hidden="true">
      <Icon size={size} />
    </span>
  );
}
export const cropEmoji = {
  wheat: "🌾",
  berseem: "☘️",
  faba_bean: "🫘",
  sugar_beet: "🌱",
  maize: "🌽",
  sorghum: "🌾",
  soybean: "🫘",
  sesame: "🌼",
  cowpea_nili: "🌿",
};
