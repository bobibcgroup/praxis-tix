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
      className={`w-full py-5 px-6 rounded-lg border-2 text-left text-lg transition-all duration-200 min-h-[56px] flex items-center
        ${selected 
          ? 'border-primary bg-primary/5 text-foreground font-medium' 
          : 'border-border bg-background hover:border-primary/50 hover:bg-muted/30 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        }
      `}
    >
      {label}
    </button>
  );
};

export default OptionButton;
