import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Problem from "@/components/Problem";
import HowItWorks from "@/components/HowItWorks";
import WhyDifferent from "@/components/WhyDifferent";
import WhoItsFor from "@/components/WhoItsFor";
import EarlyAccess from "@/components/EarlyAccess";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Problem />
        <HowItWorks />
        <WhyDifferent />
        <WhoItsFor />
        <EarlyAccess />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
