import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Users,
  Zap,
  Globe,
} from "lucide-react";

const benefits = [
  {
    id: 1,
    title: "Quick Resolution",
    description:
      "Get your civic issues resolved faster with our streamlined process.",
    icon: <Zap className="w-12 h-12 text-cyan-400" />,
  },
  {
    id: 2,
    title: "Transparency",
    description: "Track the status of your complaints in real-time.",
    icon: <Shield className="w-12 h-12 text-purple-400" />,
  },
  {
    id: 3,
    title: "Community Impact",
    description: "Contribute to a better living environment for everyone.",
    icon: <Users className="w-12 h-12 text-blue-400" />,
  },
  {
    id: 4,
    title: "24/7 Access",
    description: "Report issues anytime, anywhere from any device.",
    icon: <Clock className="w-12 h-12 text-green-400" />,
  },
  {
    id: 5,
    title: "Direct Connection",
    description: "Connect directly with local authorities without middlemen.",
    icon: <Globe className="w-12 h-12 text-indigo-400" />,
  },
];

const BenefitsSection = () => {
  return (
    <section className="w-full py-24 text-white overflow-hidden relative bg-black">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-cyan-500/50 to-transparent"></div>

      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-400 mb-6">
            Benefits for Citizens
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
             Experience a modern, transparent, and efficient way to resolving civic issues.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 50, rotateY: 90 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.1, 
                  type: "spring", 
                  bounce: 0.4 
                }}
                className="group relative h-full"
              >
                <div className="h-full p-8 rounded-3xl bg-gray-900/50 border border-white/10 hover:border-cyan-500/50 hover:bg-gray-900 transition-all duration-500 flex flex-col items-center text-center gap-6 shadow-xl hover:shadow-cyan-500/10">
                   {/* Icon Container with Glow */}
                   <div className="relative p-4 rounded-2xl bg-gray-800/50 ring-1 ring-white/10 group-hover:ring-cyan-500/50 transition-all duration-500 group-hover:scale-110">
                      <div className="absolute inset-0 bg-cyan-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
                      <div className="relative z-10">
                        {item.icon}
                      </div>
                   </div>
                   
                   <div>
                     <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                       {item.title}
                     </h3>
                     <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                       {item.description}
                     </p>
                   </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
