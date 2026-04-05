import { motion } from "framer-motion";

export const AuthLayout = ({ title, subtitle, children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl"
      >
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="text-slate-400 text-sm mt-1">{subtitle}</p>

        <div className="mt-6">{children}</div>
      </motion.div>
    </div>
  );
};
