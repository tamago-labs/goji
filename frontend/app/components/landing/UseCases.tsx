"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  {
    id: "payroll",
    label: "Contributor Payroll",
    title: "Contributor Payroll",
    description:
      "Turn recurring payroll into a visual payment flow. Import a spreadsheet or describe your team in plain English, review every payment together, then settle salaries in USDC with attached payslips.",
  },
  {
    id: "payouts",
    label: "DAO Payouts",
    title: "DAO Payouts",
    description:
      "Map grants, contributor rewards, and operational expenses on a shared canvas. Every payout is visible before multisig approval, making treasury reviews faster and easier to understand.",
  },
  {
    id: "bonuses",
    label: "Bonuses & Incentives",
    title: "Bonuses & Incentives",
    description:
      "Reward contributors with one-off bonuses or milestone payments. Create, review, and approve distributions visually before funds leave the treasury.",
  },
  {
    id: "treasury",
    label: "Treasury Operations",
    title: "Treasury Operations",
    description:
      "Move funds between operational, payroll, and reserve wallets with a clear visual representation of every transfer before execution.",
  },
];

const image =
  "https://framerusercontent.com/images/xZnqD4ngWlNKrEWyolXWc79DUMs.png?scale-down-to=1024&width=5750&height=3234";

export default function UseCases() {
  const [active, setActive] = useState(0);

  return (
    <section className="max-w-[1320px] mx-auto px-5 md:px-13 py-16">
      <div className="flex justify-center mb-14">
        <div className="flex flex-wrap justify-center gap-1.5 bg-card rounded-xl md:rounded-full p-3 md:p-1.5 shadow-[0_2px_12px_rgba(43,36,64,0.06)] mx-4 md:mx-0">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActive(i)}
              className={`relative px-3 md:px-5 py-2 md:py-2.5 rounded-xl md:rounded-3xl text-xs md:text-sm font-medium transition-all ${
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[380px] px-4 md:px-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="font-display text-2xl md:text-3xl font-semibold mb-5 leading-tight">
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
