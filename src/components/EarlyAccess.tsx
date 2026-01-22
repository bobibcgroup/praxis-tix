import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";

const EarlyAccess = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setSubmitted(true);
    setIsLoading(false);
  };

  return (
    <section id="early-access" className="py-section-lg px-6">
      <div className="container max-w-md text-center">
        <h2 className="font-serif text-heading text-foreground mb-4">
          Get early access
        </h2>
        <p className="text-body text-muted-foreground mb-8">
          Be the first to experience clarity in getting dressed.
        </p>
        
        {submitted ? (
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-accent-soft">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-body text-foreground">You're on the list. We'll be in touch.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-surface-subtle border-border focus:border-primary"
            />
            <Button 
              type="submit" 
              variant="cta" 
              size="lg"
              disabled={isLoading}
              className="sm:flex-shrink-0"
            >
              {isLoading ? "Joining..." : "Join Early Access"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
};

export default EarlyAccess;
