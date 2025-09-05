import { useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// useScrollFloat: returns a ref and a y motion value for scroll-based float effect
export function useScrollFloat(range = [0, 1], output = [0, -40]) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, range, output);
  return { ref, y };
} 