import React from "react";
import svgPaths from "../imports/svg-ec7weuyjao";
import { motion } from "motion/react";

export function AnimatedProofitLogo() {
  return (
    <div className="relative w-full h-full">
      <svg className="block size-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 370 322">
        <g id="Frame 2">
          {/* Middle Bar - Pulse and scale */}
          <motion.rect 
            fill="#E6602E" 
            height="68" 
            rx="34" 
            width="370" 
            y="127"
            animate={{
              opacity: [1, 0.7, 1],
              scaleX: [1, 0.98, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Top Bar - Animate up and down with delay */}
          <motion.path 
            d={svgPaths.p1f09bd80} 
            fill="#E6602E"
            animate={{
              y: [0, -4, 0],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
          
          {/* Bottom Bar - Animate up and down with different delay */}
          <motion.path 
            d={svgPaths.p29e65300} 
            fill="#E6602E"
            animate={{
              y: [0, 4, 0],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
          />
        </g>
      </svg>
      
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 blur-xl opacity-30"
        animate={{
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 370 322">
          <g id="Frame 2">
            <rect fill="#E6602E" height="68" rx="34" width="370" y="127" />
            <path d={svgPaths.p1f09bd80} fill="#E6602E" />
            <path d={svgPaths.p29e65300} fill="#E6602E" />
          </g>
        </svg>
      </motion.div>
    </div>
  );
}
