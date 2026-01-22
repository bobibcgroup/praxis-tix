const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Tell us the occasion",
      description: "Wedding, interview, date night—whatever's next.",
    },
    {
      number: "02", 
      title: "Add your preferences",
      description: "Style, comfort, budget. We listen.",
    },
    {
      number: "03",
      title: "Get 3 clear choices",
      description: "Curated outfits with reasoning. Pick one, move on.",
    },
  ];

  return (
    <section className="py-section-lg px-6 bg-surface-subtle">
      <div className="container max-w-4xl">
        <h2 className="font-serif text-heading text-foreground text-center mb-16">
          How it works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((step) => (
            <div key={step.number} className="text-center md:text-left">
              <span className="text-small font-medium text-primary mb-3 block">
                {step.number}
              </span>
              <h3 className="font-serif text-subheading text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-body text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
