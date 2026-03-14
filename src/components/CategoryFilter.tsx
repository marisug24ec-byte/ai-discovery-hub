import { Button } from '@/components/ui/button';
import { Palette, Code, Zap, BookOpen } from 'lucide-react';

const categories = [
  { id: 'all', label: 'All', icon: Zap },
  { id: 'Creative', label: 'Creative', icon: Palette },
  { id: 'Dev Tools', label: 'Dev Tools', icon: Code },
  { id: 'Productivity', label: 'Productivity', icon: Zap },
  { id: 'Research', label: 'Research', icon: BookOpen },
];

interface CategoryFilterProps {
  selected: string[];
  onChange: (categories: string[]) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const toggle = (id: string) => {
    if (id === 'all') {
      onChange([]);
      return;
    }
    if (selected.includes(id)) {
      onChange(selected.filter((c) => c !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={
            (cat.id === 'all' && selected.length === 0) || selected.includes(cat.id)
              ? 'neon'
              : 'glass'
          }
          size="sm"
          onClick={() => toggle(cat.id)}
          className="gap-2"
        >
          <cat.icon className="h-4 w-4" />
          {cat.label}
        </Button>
      ))}
    </div>
  );
}
