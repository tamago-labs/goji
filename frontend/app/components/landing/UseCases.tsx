"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  {
    id: "research",
    label: "Research",
    title: "Turn research into a shared direction",
    description:
      "Pull outputs from Claude, NotebookLM, or any research tool into one canvas. Your team reviews the findings together, surfaces what matters, and commits to a direction — then flow the insights back out to your roadmap, specs, or next AI prompt.",
  },
  {
    id: "roadmaps",
    label: "Roadmaps",
    title: "Build a roadmap your whole team owns",
    description:
      "Connect your backlog, company priorities, strategy docs, and voice of customer tools to the canvas. Work through the tradeoffs as a team, build a shared roadmap, and push it back out as context for your sprint planning tools — so everyone's building in the same direction.",
  },
  {
    id: "diagrams",
    label: "Diagrams",
    title: "Map systems visually",
    description:
      "Coming soon — sketch architecture, flows, and system diagrams on an infinite canvas. Connect nodes, add context, and share with your team.",
  },
  {
    id: "workshops",
    label: "Workshops",
    title: "Facilitate sessions that stick",
    description:
      "Coming soon — run retros, design sprints, and brainstorming workshops. Capture ideas, vote, and turn outcomes into trackable work.",
  },
];

const image =
  "https://framerusercontent.com/images/xZnqD4ngWlNKrEWyolXWc79DUMs.png?scale-down-to=1024&width=5750&height=3234";

export default function UseCases() {
  const [active, setActive] = useState(0);

  return (
    <section className="max-w-[1320px] mx-auto px-13 py-16">
      <div className="flex justify-center mb-14">
        <div className="inline-flex gap-1.5 bg-card rounded-full p-1.5 shadow-[0_2px_12px_rgba(43,36,64,0.06)]">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActive(i)}
              className={`relative px-5 py-2.5 rounded-3xl text-sm font-medium transition-all ${
                active === i
                  ? "bg-ink text-lavender shadow-[0_4px_16px_rgba(43,36,64,0.15)]"
                  : "text-ink hover:bg-ink/[0.05]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="font-display text-3xl font-semibold mb-5 leading-tight">
              {tabs[active].title}
            </h3>
            <p className="text-ink/55 text-[17px] leading-relaxed max-w-[440px]">
              {tabs[active].description}
            </p>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={`${tabs[active].label} preview`}
              className="w-full h-auto"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
