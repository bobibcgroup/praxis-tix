const WhoItsFor = () => {
  return (
    <section className="py-section-lg px-6 bg-surface-subtle">
      <div className="container max-w-2xl text-center">
        <h2 className="font-serif text-heading text-foreground mb-8">
          Who it's for
        </h2>
        
        <div className="space-y-8">
          <div>
            <p className="text-body-lg text-foreground mb-2">
              People who are busy, overwhelmed, or just want clarity.
            </p>
            <p className="text-body text-muted-foreground">
              Less deciding. More living.
            </p>
          </div>
          
          <div className="pt-8 border-t border-border">
            <p className="text-small text-muted-foreground uppercase tracking-wider mb-2">
              Coming soon
            </p>
            <p className="text-body-lg text-foreground">
              For retailers: better decisions, fewer returns.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoItsFor;
