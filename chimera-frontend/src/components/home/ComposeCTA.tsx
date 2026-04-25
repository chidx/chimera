'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function ComposeCTA() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          animate={{
            boxShadow: [
              '0 0 30px rgba(99,102,241,0.1)',
              '0 0 60px rgba(99,102,241,0.25)',
              '0 0 30px rgba(99,102,241,0.1)',
            ],
          }}
          transition={{
            boxShadow: { repeat: Infinity, duration: 3, ease: 'easeInOut' },
          }}
          className="rounded-2xl bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 p-8 sm:p-12 text-center"
        >
          <span className="text-4xl mb-4 block">🦁</span>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Compose Your Chimera
          </h2>
          <p className="text-white/60 max-w-md mx-auto mb-8">
            Combine 2 to 5 specialist agents into one composite entity. Each
            Chimera inherits the capabilities of all its members.
          </p>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/compose"
              className="inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold transition-colors"
            >
              Start Composing
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
