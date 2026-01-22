import { Check } from "lucide-react";

const WhyDifferent = () => {
  const differences = [
    "No feeds",
    "No endless scrolling",
    "Confidence-first",
    "Built for everyday moments",
  ];

  return (
    <section className="py-section-lg px-6">
      <div className="container max-w-2xl">
        <h2 className="font-serif text-heading text-foreground text-center mb-12">
          Why it's different
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-4">
          {differences.map((item) => (
            <div 
              key={item}
              className="flex items-center gap-3 p-4 rounded-xl bg-accent-soft"
            >
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-primary" />
              </div>
              <span className="text-body text-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;
