"use client";
import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BoxesCore = ({ className, ...rest }: { className?: string }) => {
  const rows = new Array(50).fill(1);
  const cols = new Array(50).fill(1);
  const [hoveredBoxes, setHoveredBoxes] = useState<Set<string>>(new Set());
  
  // Vibrant colors matching the app's design system
  const colors = [
    "rgb(96 165 250)",   // blue-400
    "rgb(45 212 191)",   // teal-400
    "rgb(244 114 182)",  // pink-400
    "rgb(251 146 60)",   // orange-400
    "rgb(167 139 250)",  // violet-400
    "rgb(74 222 128)",   // green-400
    "rgb(250 204 21)",   // yellow-400
    "rgb(248 113 113)",  // red-400
    "rgb(129 140 248)",  // indigo-400
  ];

  const getRandomColor = useCallback(() => {
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  const handleMouseEnter = useCallback((key: string) => {
    setHoveredBoxes(prev => new Set([...prev, key]));
    // Auto-remove after animation
    setTimeout(() => {
      setHoveredBoxes(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }, 500);
  }, []);

  return (
    <div
      style={{
        transform: `translate(-40%,-60%) skewX(-48deg) skewY(14deg) scale(0.675) rotate(0deg) translateZ(0)`,
      }}
      className={cn(
        "absolute left-1/4 p-4 -top-1/4 flex -translate-x-1/2 -translate-y-1/2 w-full h-full",
        className
      )}
      {...rest}
    >
      {rows.map((_, i) => (
        <div
          key={`row` + i}
          className="w-16 h-8 border-l border-white/[0.08] relative"
        >
          {cols.map((_, j) => {
            const key = `${i}-${j}`;
            const isHovered = hoveredBoxes.has(key);
            return (
              <motion.div
                key={`col` + j}
                onMouseEnter={() => handleMouseEnter(key)}
                animate={{
                  backgroundColor: isHovered ? getRandomColor() : "transparent",
                }}
                transition={{ duration: isHovered ? 0 : 0.5 }}
                className="w-16 h-8 border-r border-t border-white/[0.08] relative cursor-crosshair"
              >
                {j % 2 === 0 && i % 2 === 0 ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="absolute h-6 w-10 -top-[14px] -left-[22px] text-white/[0.06] stroke-[1px] pointer-events-none"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m6-6H6"
                    />
                  </svg>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const Boxes = React.memo(BoxesCore);

