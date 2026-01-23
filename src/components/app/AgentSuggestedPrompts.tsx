import { Button } from '@/components/ui/button';

interface AgentSuggestedPromptsProps {
  prompts: string[];
  onSelectPrompt: (prompt: string) => void;
}

export const AgentSuggestedPrompts = ({ prompts, onSelectPrompt }: AgentSuggestedPromptsProps) => {
  return (
    <div className="px-4 pb-2">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {prompts.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => onSelectPrompt(prompt)}
            className="shrink-0 whitespace-nowrap text-sm"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
};
