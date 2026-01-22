import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

const Hero = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center pt-16 px-6">
      <div className="container max-w-3xl text-center">
        <h1 className="font-serif text-display-sm md:text-display text-foreground opacity-0 animate-fade-up text-balance">
          From indecision to confidence, in minutes.
        </h1>
        <p className="mt-6 text-body-lg text-muted-foreground max-w-xl mx-auto opacity-0 animate-fade-up animation-delay-100">
          Get dressed right, in under a minute.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-up animation-delay-200">
          <Button 
            variant="cta" 
            size="xl"
            asChild
          >
            <Link to="/app">Try It Now</Link>
          </Button>
          <Button 
            variant="outline" 
            size="xl"
            onClick={() => document.getElementById('early-access')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Request Early Access
          </Button>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-12 opacity-0 animate-fade-in animation-delay-400">
        <button 
          onClick={() => document.getElementById('problem')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-muted-foreground hover:text-foreground transition-colors p-2"
          aria-label="Scroll to learn more"
        >
          <ArrowDown className="w-5 h-5 animate-bounce" />
        </button>
      </div>
    </section>
  );
};

export default Hero;
