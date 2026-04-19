import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Report an Issue",
    description:
      "Take a photo, add a description, and tag the location. Our smart system categorizes the issue automatically and assigns it to the relevant department.",
    image: "/pothole.jpg", // Real image from public
    align: "left",
  },
  {
    id: 2,
    title: "Track Progress",
    description:
      "Get real-time updates as your issue gets verified, assigned, and resolved. Receive a notification once the work is completed.",
    image: "/progress.png", // Real image from public
    align: "right",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="w-full py-24 bg-black text-white px-4 relative overflow-hidden transition-colors duration-200">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 -left-64 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px]" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="text-cyan-400 font-semibold tracking-wider uppercase text-sm">
            Workflow
          </span>
          <h2 className="text-4xl md:text-6xl font-bold mt-2 bg-clip-text text-transparent bg-linear-to-r from-white to-slate-300">
            How It Works
          </h2>
        </motion.div>

        <div className="space-y-24">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col md:flex-row gap-12 items-center ${
                step.align === "right" ? "md:flex-row-reverse" : ""
              }`}
            >
              {/* Image Side */}
              <motion.div
                initial={{ opacity: 0, x: step.align === "left" ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full md:w-1/2"
              >
                <div
                  className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group border border-white/20"
                >
                  <img 
                    src={step.image} 
                    alt={step.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Overlay content */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20">
                        <ArrowRight className="w-6 h-6 text-white" />
                      </div>
                  </div>
                </div>
              </motion.div>

              {/* Text Side */}
              <motion.div
                initial={{ opacity: 0, x: step.align === "left" ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="w-full md:w-1/2 space-y-6"
              >
                <h3 className="text-3xl md:text-4xl font-bold text-white">{step.title}</h3>
                <p className="text-slate-300 text-lg leading-relaxed">
                  {step.description}
                </p>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                    <span>Instant verification</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-200">
                    <CheckCircle className="w-5 h-5 text-cyan-400" />
                    <span>Track status</span>
                  </li>
                </ul>

                <button className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors mt-8">
                  Know More
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
