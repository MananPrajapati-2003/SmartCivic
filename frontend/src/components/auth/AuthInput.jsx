import { motion } from "framer-motion";

export const AuthInput = ({ icon: Icon, error, ...props }) => {
  return (
    <div>
      <div className="relative">
        <Icon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <input
          {...props}
          className={`w-full pl-10 pr-3 py-2 rounded-lg bg-black/40 border text-white placeholder:text-slate-500 focus:outline-none
          ${error ? "border-red-500" : "border-white/10 focus:border-indigo-500"}`}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-red-400 mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
