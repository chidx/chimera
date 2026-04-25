'use client';

const MISSION_TYPES = [
  { type: 'Finance', emoji: '💰' },
  { type: 'Governance', emoji: '🏛️' },
  { type: 'Labor', emoji: '🔧' },
  { type: 'Gaming', emoji: '🎮' },
  { type: 'DevOps', emoji: '⚙️' },
  { type: 'Real World', emoji: '🌍' },
];

interface MissionTypeSelectorProps {
  selected: string | null;
  onSelect: (type: string) => void;
}

export default function MissionTypeSelector({ selected, onSelect }: MissionTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {MISSION_TYPES.map(({ type, emoji }) => {
        const isSelected = selected === type;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all
              ${isSelected
                ? 'border-white ring-2 ring-white opacity-100 bg-white/10'
                : 'border-white/20 opacity-40 hover:opacity-60 bg-white/5'
              }`}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-sm font-medium text-white">{type}</span>
          </button>
        );
      })}
    </div>
  );
}
