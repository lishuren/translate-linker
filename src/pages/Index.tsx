
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/hooks/use-redux";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user?.isLoggedIn) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col items-center"
    >
      <div className="max-w-3xl text-center mb-16">
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-block px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full mb-4">
            Intelligent Document Translation
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Translate Documents with Precision and Speed
          </h1>
          <p className="text-xl text-muted-foreground">
            TranslateLinker uses advanced AI to translate your documents accurately 
            while preserving the original formatting and context.
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full px-8">
            <a href="#features">Learn More</a>
          </Button>
        </motion.div>
      </div>

      <motion.div
        variants={itemVariants}
        className="bg-glass rounded-2xl overflow-hidden shadow-lg w-full max-w-5xl mb-24"
      >
        <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <div className="text-center p-12">
            <h3 className="text-2xl font-semibold mb-4">Intelligent Document Translation</h3>
            <p className="text-muted-foreground">Preview image of document translation interface</p>
          </div>
        </div>
      </motion.div>

      <div id="features" className="w-full max-w-6xl py-12">
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Key Features</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our platform offers powerful translation capabilities with advanced features
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Multiple Language Support",
              description: "Translate your documents to and from a wide variety of languages with high accuracy."
            },
            {
              title: "Format Preservation",
              description: "Our system maintains the original document formatting throughout the translation process."
            },
            {
              title: "Fast Processing",
              description: "Get your translated documents quickly with our optimized processing pipeline."
            },
            {
              title: "Smart Duplication Detection",
              description: "Our checksum technology prevents duplicate translations, saving you time and resources."
            },
            {
              title: "Email Notifications",
              description: "Receive convenient email alerts when your translations are ready for download."
            },
            {
              title: "Secure Storage",
              description: "Your documents are safely stored with enterprise-grade security and encryption."
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-glass rounded-xl p-6 transition-all duration-300 hover:shadow-md"
            >
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div variants={itemVariants} className="w-full max-w-3xl py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to translate your documents?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Get started today and experience the power of intelligent document translation.
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link to="/login">Create an Account</Link>
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default Index;
