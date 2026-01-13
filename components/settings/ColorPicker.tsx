"use client";

import { presetColors } from "@/data/mockSettings";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">
        Widget Color
      </label>

      <div className="flex items-center gap-2 mb-3">
        {presetColors.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={cn(
              "w-8 h-8 rounded-full transition-all cursor-pointer",
              selectedColor === color && "ring-2 ring-white ring-offset-2 ring-offset-[#141414]"
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      <input
        type="text"
        value={selectedColor}
        onChange={(e) => onColorChange(e.target.value)}
        placeholder="#6366f1"
        className="w-[120px] bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}

