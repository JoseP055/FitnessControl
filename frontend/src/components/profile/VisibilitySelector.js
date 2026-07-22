import { Globe2, Lock, Users } from "lucide-react";

const OPTIONS = [
  { value: "private", label: "Privado", icon: Lock },
  { value: "friends", label: "Amigos", icon: Users },
  { value: "public", label: "Publico", icon: Globe2 },
];

function VisibilitySelector({ value, onChange, disabled = false }) {
  return (
    <div className="fc-option-grid fc-option-grid--compact">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`fc-option-card ${selected ? "is-selected" : ""}`}
            onClick={() => onChange(option.value)}
            disabled={disabled}
          >
            <span className="fc-option-card__icon">
              <Icon size={16} />
            </span>
            <span className="fc-option-card__label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default VisibilitySelector;
