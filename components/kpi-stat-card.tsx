"use client";

import { motion } from 'framer-motion';

interface KPIStatCardProps {
  title: string;
  value: string;
  color: string;
}

export function KPIStatCard({ title, value, color }: KPIStatCardProps) {
  return (
    <motion.div 
      className="text-center"
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className={`text-2xl md:text-3xl font-bold mb-2 ${color}`}>
        {value}
      </div>
      <div className="text-sm text-gray-400">{title}</div>
    </motion.div>
  );
}