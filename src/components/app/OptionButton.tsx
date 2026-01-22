interface OptionButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

const OptionButton = ({ label, selected, onClick }: OptionButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full py-4 px-6 rounded-xl border text-left text-lg transition-all
        ${selected 
          ? 'border-primary bg-primary/5 text-foreground font-medium' 
          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30 text-foreground'
        }
      `}
    >
      {label}
    </button>
  );
};

export default OptionButton;
