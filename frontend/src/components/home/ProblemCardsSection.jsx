import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Construction,
  Trash2,
  Lightbulb,
  Droplets,
  Volume2,
} from "lucide-react";

const problems = [
  {
    id: 1,
    title: "Road Maintenance",
    description: "Potholes, damaged pavement, and road obstructions.",
    icon: <Construction className="w-16 h-16 text-amber-500" />,
    color: "bg-amber-500/10 border-amber-500/50",
  },
  {
    id: 2,
    title: "Waste Management",
    description: "Overflowing bins, illegal dumping, and street litter.",
    icon: <Trash2 className="w-16 h-16 text-emerald-500" />,
    color: "bg-emerald-500/10 border-emerald-500/50",
  },
  {
    id: 3,
    title: "Street Lighting",
    description: "Broken streetlights, poor visibility, and electrical issues.",
    icon: <Lightbulb className="w-16 h-16 text-yellow-500" />,
    color: "bg-yellow-500/10 border-yellow-500/50",
  },
  {
    id: 4,
    title: "Water Supply",
    description: "Leakages, no supply, and contaminated water reports.",
    icon: <Droplets className="w-16 h-16 text-blue-500" />,
    color: "bg-blue-500/10 border-blue-500/50",
  },
  {
    id: 5,
    title: "Noise Pollution",
    description:
      "Loud construction work, industrial noise, and public disturbance.",
    icon: <Volume2 className="w-16 h-16 text-rose-500" />,
    color: "bg-rose-500/10 border-rose-500/50",
  },
];

const ProblemCardsSection = () => {
  const [activeIndex, setActiveIndex] = useState(2); // Start at middle

  const nextCard = () => {
    setActiveIndex((prev) => (prev + 1) % problems.length);
  };

  const prevCard = () => {
    setActiveIndex((prev) => (prev - 1 + problems.length) % problems.length);
  };

  const getVisibleIndex = (offset) => {
    return (activeIndex + offset + problems.length) % problems.length;
  };

  return (
    <section className="w-full py-24  text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <span className="text-cyan-400 font-bold uppercase tracking-widest text-sm">
            Services
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-2 text-white">
            Types of Problems We Resolve
          </h2>
        </motion.div>

        <div className="relative h-[500px] flex items-center justify-center">
          {/* Buttons */}
          <div className="absolute inset-0 flex items-center justify-between px-4 md:px-32 pointer-events-none z-30">
            <button
              onClick={prevCard}
              className="pointer-events-auto p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all border border-white/10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={nextCard}
              className="pointer-events-auto p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all border border-white/10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Cards */}
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence mode="popLayout">
              {[-1, 0, 1].map((offset) => {
                const index = getVisibleIndex(offset);
                const item = problems[index];

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{
                      scale: 0.8,
                      x: offset * 100 + "%", // Move based on percentage of container largely
                      opacity: 0,
                    }}
                    animate={{
                      scale: offset === 0 ? 1 : 0.85,
                      x: offset * 320, // Pixel offset for desktop
                      opacity: offset === 0 ? 1 : 0.4,
                      zIndex: offset === 0 ? 10 : 0,
                      rotateY: offset * 15,
                    }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`
                        absolute w-72 h-72 md:w-80 md:h-80 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 cursor-pointer
                        backdrop-blur-xl border-2 shadow-2xl transition-colors duration-500
                        ${
                          offset === 0
                            ? `bg-gray-900/80 ${item.color} shadow-[0_0_30px_rgba(255,255,255,0.1)]`
                            : "bg-gray-900/40 border-gray-800"
                        }
                      `}
                    onClick={() => {
                      if (offset === -1) prevCard();
                      if (offset === 1) nextCard();
                    }}
                  >
                    <div className="p-4 rounded-2xl bg-black/20">
                      {item.icon}
                    </div>
                    <h3 className="text-2xl font-bold">{item.title}</h3>
                    <p className="text-gray-400">{item.description}</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemCardsSection;
