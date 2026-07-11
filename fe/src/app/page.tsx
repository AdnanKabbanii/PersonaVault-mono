"use client";

import { StarField } from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Brain,
    Database,
    FileText,
    Film,
    Globe,
    Image,
    Lock,
    Shield,
    Sparkles,
    Zap
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-purple-950/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold gradient-text">PERSONAVAULT</div>
          <div className="hidden md:flex space-x-8 text-base font-medium">
            <a href="#features" className="hover:text-purple-400 transition text-lg">Features</a>
            <a href="#how-it-works" className="hover:text-purple-400 transition text-lg">How It Works</a>
            <a href="#integration" className="hover:text-purple-400 transition text-lg">AI Integration</a>
            <a href="#pricing" className="hover:text-purple-400 transition text-lg">Pricing</a>
          </div>
          <Link href="/auth">
            <Button variant="outline" className="border-purple-500/50 hover:bg-purple-500/10 text-lg px-6 py-3">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <StarField />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-background"></div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-6 text-center z-10"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Building the Future of
            <br />
            <span className="gradient-text">AI-Powered Knowledge</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your personal vault for documents, files, and data. Professionally indexed and seamlessly connected to your LLMs for always up-to-date AI intelligence.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                Start Your Vault <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-purple-500/50 hover:bg-purple-500/10">
              Learn More
            </Button>
          </div>
        </motion.div>

        {/* Floating UI Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-4xl"
        >
          <div className="relative h-96 glow-purple">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 to-transparent rounded-t-3xl"></div>
          </div>
        </motion.div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-bold mb-4">Vault Features</h2>
            <p className="text-muted-foreground">Everything you need to manage your knowledge base</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Upload Feature */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 rounded-2xl"
            >
              <h3 className="text-3xl font-bold mb-4">UNIVERSAL FILE SUPPORT</h3>
              <p className="text-muted-foreground mb-6">
                Upload any file type - documents, PDFs, images, videos, audio files, and more. Our AI automatically extracts and indexes all content.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="glass-card p-4 rounded-lg text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm">Documents</p>
                </div>
                <div className="glass-card p-4 rounded-lg text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm">Images</p>
                </div>
                <div className="glass-card p-4 rounded-lg text-center">
                  <Film className="h-8 w-8 mx-auto mb-2 text-pink-400" />
                  <p className="text-sm">Videos</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-purple-400">→</span>
                  <span><strong>Smart OCR</strong> — Extract text from images and scanned documents</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400">→</span>
                  <span><strong>Audio Transcription</strong> — Convert speech to searchable text</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400">→</span>
                  <span><strong>Metadata Extraction</strong> — Automatically tag and categorize files</span>
                </div>
              </div>
            </motion.div>

            {/* AI Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="glass-card p-8 rounded-2xl h-full">
                <h3 className="text-xl font-semibold mb-4">INTELLIGENT INDEXING</h3>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Content Analysis</span>
                      <span className="text-purple-400">Real-time</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full w-4/5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Semantic Search</span>
                      <span className="text-blue-400">AI-Powered</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Knowledge Graph</span>
                      <span className="text-pink-400">Connected</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full w-5/6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <Brain className="h-10 w-10 text-purple-400" />
                    <div>
                      <p className="font-semibold">Neural Processing</p>
                      <p className="text-sm text-muted-foreground">Advanced AI understands context and relationships</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Integration Advantage */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-5xl font-bold mb-6">AI Integration Advantage</h2>
              <div className="glass-card p-6 rounded-2xl mb-6">
                <h3 className="text-2xl font-semibold mb-4 uppercase">
                  Connect Any LLM Instantly
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your PersonaVault becomes the knowledge backbone for any Large Language Model.
                  Keep ChatGPT, Claude, or custom models always updated with your latest documents.
                </p>
                <p className="font-semibold text-purple-400">
                  10x faster responses. 100% accurate context.
                </p>
              </div>

              <div className="space-y-4">
                <p>
                  Traditional knowledge management systems take days to update. PersonaVault syncs in
                  <span className="text-purple-400 font-semibold"> real-time</span>, giving your AI instant access to new information.
                </p>
                <p>
                  <span className="text-purple-400 font-semibold">API-first design</span> means seamless integration
                  with any AI workflow, from chatbots to research assistants.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative glass-card p-8 rounded-3xl">
                <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-20 w-20 text-purple-400" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section id="how-it-works" className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-purple-500/30 rounded-full blur-3xl"></div>
            <h2 className="text-5xl font-bold mb-4 relative">What We Do</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              PersonaVault is pioneering the future of <span className="text-purple-400 font-semibold">AI-powered knowledge management</span>.
              Our goal is to build intelligent systems that enable individuals and organizations to harness their data effectively.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="glass-card p-8 rounded-2xl h-full">
                <Database className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                <h3 className="text-2xl font-semibold mb-2 uppercase">Intelligent Storage</h3>
                <p className="text-muted-foreground">Smart indexing and categorization</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="glass-card p-8 rounded-2xl h-full">
                <Zap className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-2xl font-semibold mb-2 uppercase">Real-time Sync</h3>
                <p className="text-muted-foreground">Instant updates to connected AIs</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="glass-card p-8 rounded-2xl h-full">
                <Shield className="h-12 w-12 mx-auto mb-4 text-pink-400" />
                <h3 className="text-2xl font-semibold mb-2 uppercase">Enterprise Security</h3>
                <p className="text-muted-foreground">Your data, always protected</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground">
              By bridging the gap between your data and AI capabilities, we are laying the groundwork for the next era of intelligent computing.
            </p>
            <Button className="mt-6" variant="outline" size="lg">
              Explore Our Technology <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>
            <h2 className="text-5xl font-bold mb-4 relative">Why This Matters</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              The future of work is AI-augmented. By making your knowledge instantly accessible to AI systems,
              we empower innovation, accelerate research, and unlock human potential.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="glass-card p-8 rounded-2xl h-full">
                <Globe className="h-12 w-12 mx-auto mb-4 text-purple-400" />
                <h3 className="text-2xl font-semibold mb-2 uppercase">Global Knowledge</h3>
                <p className="text-muted-foreground">Breaking down information silos</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="glass-card p-8 rounded-2xl h-full">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-2xl font-semibold mb-2 uppercase">AI Evolution</h3>
                <p className="text-muted-foreground">Enabling smarter AI systems</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="glass-card p-8 rounded-2xl h-full">
                <Lock className="h-12 w-12 mx-auto mb-4 text-pink-400" />
                <h3 className="text-2xl font-semibold mb-2 uppercase">Data Sovereignty</h3>
                <p className="text-muted-foreground">You control your information</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-muted-foreground">
              This will define the future of human-AI collaboration and ensure knowledge remains accessible and actionable.
            </p>
            <Button className="mt-6" variant="outline" size="lg">
              Read More About Our Vision <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="text-5xl font-bold mb-4">Stay Updated</h2>
            <p className="text-muted-foreground mb-8">
              Join our community and be the first to hear about new features, AI integrations, and product updates.
            </p>
            <form className="flex gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 bg-secondary/50 border-purple-500/20 focus:border-purple-500/50"
              />
              <Button type="submit" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                Sign Up <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10">
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="container mx-auto px-6 py-12 relative">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <div className="text-2xl font-bold gradient-text mb-2">PERSONAVAULT</div>
              <p className="text-sm text-muted-foreground">
                Pioneering the future of AI-powered knowledge management
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              <a href="#" className="hover:text-purple-400 transition">Home</a>
              <a href="#" className="hover:text-purple-400 transition">About Us</a>
              <a href="#" className="hover:text-purple-400 transition">Features</a>
              <a href="#" className="hover:text-purple-400 transition">Pricing</a>
              <a href="#" className="hover:text-purple-400 transition">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-muted-foreground">
            <p>© 2025 PersonaVault - All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
