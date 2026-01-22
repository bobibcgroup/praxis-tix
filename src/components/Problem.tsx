const Problem = () => {
  const problems = [
    "Too many options",
    "No context",
    "Endless scrolling",
    "Still unsure",
  ];

  return (
    <section id="problem" className="py-section-lg px-6">
      <div className="container max-w-2xl">
        <h2 className="font-serif text-heading text-foreground text-center mb-12">
          Choosing shouldn't be this hard
        </h2>
        
        <ul className="space-y-4 mb-12">
          {problems.map((problem, index) => (
            <li 
              key={problem}
              className="flex items-center gap-4 text-body-lg text-muted-foreground"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 flex-shrink-0" />
              {problem}
            </li>
          ))}
        </ul>
        
        <p className="text-body-lg text-foreground font-medium text-center border-t border-border pt-12">
          Praxis replaces chaos with clarity.
        </p>
      </div>
    </section>
  );
};

export default Problem;
