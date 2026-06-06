import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter.jsx';

export default function StatCard({ icon: Icon, label, value }) {
  return (
    <motion.div className="surface p-5" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} whileHover={{ y: -4 }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black">{typeof value === 'number' ? <AnimatedCounter value={value} /> : value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-md bg-blue-50 text-primary dark:bg-blue-950/50">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
