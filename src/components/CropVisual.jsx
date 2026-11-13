import { Wheat, Bean, Leaf, Sprout, Flower2, Carrot } from "lucide-react";
const icons = {
  wheat: Wheat,
  maize: Wheat,
  sorghum: Wheat,
  berseem: Leaf,
  faba_bean: Bean,
  soybean: Bean,
  cowpea_nili: Sprout,
  sugar_beet: Carrot,
  sesame: Flower2,
};
export default function CropVisual({ id, size = 23 }) {
  const Icon = icons[id] || Sprout;
  return <Icon size={size} aria-hidden="true" />;
}
