import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { GraduationCap, Book, Users, Star, Library, Brain, Sparkles, BookOpen } from "lucide-react";

const InteractiveHero = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse move effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (event: React.MouseEvent) => {
        const { clientX, clientY } = event;
        const { innerWidth, innerHeight } = window;
        mouseX.set(clientX / innerWidth - 0.5);
        mouseY.set(clientY / innerHeight - 0.5);
    };

    const springConfig = { damping: 25, stiffness: 150 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

    // Education icons to use as nodes
    const eduIcons = [
        { Icon: GraduationCap, color: "#643ae5" },
        { Icon: Book, color: "#3b82f6" },
        { Icon: Users, color: "#a259ff" },
        { Icon: Star, color: "#f59e0b" },
        { Icon: Library, color: "#10b981" },
        { Icon: Brain, color: "#ec4899" },
        { Icon: Sparkles, color: "#8b5cf6" },
        { Icon: BookOpen, color: "#06b6d4" },
    ];

    // Ultra-minimal systematic node positions
    const systematicPositions = [
        { x: 10, y: 30 }, { x: 30, y: 70 }, { x: 50, y: 20 },
        { x: 70, y: 80 }, { x: 90, y: 30 }, { x: 110, y: 70 }
    ];

    // Generate nodes
    const nodes = systematicPositions.map((pos, i) => {
        const iconData = eduIcons[i % eduIcons.length];
        return {
            id: i,
            x: pos.x - 5, // Mapping to the 110% spread
            y: pos.y,
            size: 55, // Slightly larger for emphasis in minimal layout
            duration: 5 + (i % 2),
            ...iconData
        };
    });

    // Generate minimal connections (only to immediate neighbors)
    const connections = [];
    for (let i = 0; i < nodes.length - 1; i++) {
        connections.push({ from: nodes[i], to: nodes[i + 1], id: `${i}-${i + 1}` });
    }

    return (
        <motion.div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            style={{
                perspective: 1200,
                rotateX,
                rotateY,
            }}
            className="relative w-[110%] left-[-5%] aspect-[21/6] mx-auto overflow-visible bg-transparent group"
        >
            {/* Neural Connections (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                {connections.map((conn) => (
                    <motion.line
                        key={conn.id}
                        x1={`${conn.from.x}%`}
                        y1={`${conn.from.y}%`}
                        x2={`${conn.to.x}%`}
                        y2={`${conn.to.y}%`}
                        stroke="#000000"
                        strokeWidth="1.5"
                        strokeOpacity="0.25"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 0.25 }}
                        transition={{ duration: 2, delay: 0.5 }}
                    />
                ))}
            </svg>

            {/* Floating Educational Icons */}
            {nodes.map((node) => {
                const Icon = node.Icon;
                return (
                    <motion.div
                        key={node.id}
                        className="absolute flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        style={{
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            width: node.size,
                            height: node.size,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: [1, 1.05, 1],
                            opacity: [0.8, 1, 0.8],
                            y: [0, -20, 0],
                            rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                            duration: node.duration,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                            delay: Math.random() * 2,
                        }}
                    >
                        <Icon size={node.size * 0.5} color="white" strokeWidth={2} className="relative z-10 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />

                        {/* Colored Glow behind icon */}
                        <div
                            className="absolute inset-0 rounded-2xl blur-lg opacity-40 mix-blend-screen"
                            style={{ backgroundColor: node.color }}
                        />
                    </motion.div>
                );
            })}

            {/* Subtle center focus */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    className="w-[80%] h-[80%] rounded-full bg-gradient-to-r from-[#643ae5] to-[#3b82f6] blur-[150px]"
                />
            </div>

        </motion.div>
    );
};

export default InteractiveHero;
