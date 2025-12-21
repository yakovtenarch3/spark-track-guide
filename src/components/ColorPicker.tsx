import { Label } from "@/components/ui/label";

const COLORS = [
  { value: "#4A90E2", label: "כחול" },
  { value: "#50C878", label: "ירוק" },
  { value: "#FF6B6B", label: "אדום" },
  { value: "#FFD93D", label: "צהוב" },
  { value: "#A78BFA", label: "סגול" },
  { value: "#F472B6", label: "ורוד" },
  { value: "#FFA500", label: "כתום" },
  { value: "#20B2AA", label: "טורקיז" },
  { value: "#8B4513", label: "חום" },
  { value: "#708090", label: "אפור" },
];

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export const ColorPicker = ({ selectedColor, onColorChange }: ColorPickerProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-base">בחר צבע</Label>
      <div className="grid grid-cols-5 gap-3">
        {COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onColorChange(color.value)}
            className={`
              w-full aspect-square rounded-lg transition-all
              ${selectedColor === color.value ? "ring-2 ring-primary ring-offset-2" : ""}
              hover:scale-110
            `}
            style={{ backgroundColor: color.value }}
            title={color.label}
          />
        ))}
      </div>
    </div>
  );
};
