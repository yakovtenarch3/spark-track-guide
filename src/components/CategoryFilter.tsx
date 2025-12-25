import { Button } from "@/components/ui/button";

export const CATEGORIES = [
  { value: "all", label: "הכל", icon: "🎯" },
  { value: "health", label: "בריאות ופיטנס", icon: "💪" },
  { value: "learning", label: "למידה וידע", icon: "📚" },
  { value: "mindfulness", label: "מיינדפולנס", icon: "🧘" },
  { value: "organization", label: "סדר וארגון", icon: "🏠" },
  { value: "social", label: "חברתי", icon: "👥" },
  { value: "work", label: "עבודה", icon: "💼" },
  { value: "creativity", label: "יצירתיות", icon: "🎨" },
  { value: "other", label: "אחר", icon: "✨" },
];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center px-2 overflow-x-hidden">
      {CATEGORIES.map((category) => (
        <Button
          key={category.value}
          variant={selectedCategory === category.value ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.value)}
          className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 h-8 sm:h-9"
        >
          <span>{category.icon}</span>
          <span className="hidden xs:inline sm:inline">{category.label}</span>
        </Button>
      ))}
    </div>
  );
};
