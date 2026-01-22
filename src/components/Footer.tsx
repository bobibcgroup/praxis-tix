const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-border">
      <div className="container max-w-4xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="font-serif text-lg text-foreground">Praxis</span>
            <p className="text-small text-muted-foreground mt-1">
              The decision layer of fashion
            </p>
          </div>
          
          <div className="flex items-center gap-6 text-small text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
        
        <p className="text-center text-small text-muted-foreground/60 mt-8">
          © {new Date().getFullYear()} Praxis. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
