import React from "react";
import { motion } from "framer-motion";
import { Send, Mail, MapPin, Phone } from "lucide-react";

const ContactSection = () => {
  return (
    <section className="w-full py-24 text-white relative overflow-hidden">
      {/* Background Gradient Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-4 relative z-10 flex flex-col md:flex-row gap-20">
        {/* Left Side: Text Info */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="w-full md:w-1/2 space-y-8"
        >
          <div>
            <span className="text-cyan-400 font-bold uppercase tracking-widest text-sm">
              Get in Touch
            </span>
            <h2 className="text-5xl font-bold mt-2 mb-6">Connect With Us</h2>
            <p className="text-gray-400 text-lg">
              Have questions or suggestions? We'd love to hear from you. Reach
              out to us and let's build a smarter city together.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors">
              <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-200">Email Us</h4>
                <p className="text-gray-400">contact@smartcivic.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors">
              <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-200">Call Us</h4>
                <p className="text-gray-400">+1 (555) 123-4567</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-colors">
              <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-200">Visit Us</h4>
                <p className="text-gray-400">
                  123 Smart City Avenue, Tech District
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="w-full md:w-1/2"
        >
          <form className="p-8 md:p-10 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium ml-1">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-gray-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium ml-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium ml-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium ml-1">
                Message
              </label>
              <textarea
                rows="4"
                placeholder="How can we help you?"
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-white placeholder-gray-600 resize-none"
              ></textarea>
            </div>

            <button
              type="button"
              className="w-full py-4 bg-linear-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-shadow flex items-center justify-center gap-2 group"
            >
              Send Message
              <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
