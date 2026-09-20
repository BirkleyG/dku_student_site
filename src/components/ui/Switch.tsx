type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  color?: string;
};

export function Switch({ checked, onChange, label, color }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="focus-ring relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200"
      style={{ backgroundColor: checked ? (color ?? "var(--color-gold)") : "var(--color-paper-dim)" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: checked ? "translateX(18px)" : "translateX(3px)" }}
      />
    </button>
  );
}
