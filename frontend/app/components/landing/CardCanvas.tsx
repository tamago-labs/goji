"use client";

import { motion } from "framer-motion";

const cardVariants = [
  { initial: { opacity: 0, y: 30, rotate: -3 }, rotate: "-3deg" },
  { initial: { opacity: 0, y: 30, rotate: 2 }, rotate: "2deg" },
  { initial: { opacity: 0, y: 30, rotate: 4 }, rotate: "4deg" },
  { initial: { opacity: 0, y: 30, rotate: -2 }, rotate: "-2deg" },
  { initial: { opacity: 0, y: 30, rotate: 1 }, rotate: "1deg" },
];

const cards = [
  { top: "10px", left: "0", tag: "wallet", tagColor: "bg-mint/25 text-[#1B7A50]", label: "Ops Multisig", value: "$18,400" },
  { top: "150px", left: "160px", tag: "contributor", tagColor: "bg-violet/20 text-[#5A4FB8]", label: "alix.eth", value: "$4,200 / mo" },
  { top: "40px", right: "70px", tag: "doc", tagColor: "bg-coral/20 text-[#C24E33]", label: "Contract", value: "alix-q3.pdf" },
  { top: "230px", right: "50px", tag: "contributor", tagColor: "bg-violet/20 text-[#5A4FB8]", label: "devon.eth", value: "$1,900" },
  { top: "330px", left: "120px", tag: "doc", tagColor: "bg-coral/20 text-[#C24E33]", label: "Payslip", value: "auto-generated" },
];

export default function CardCanvas() {
  return (
    <div className="relative h-[420px]">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 420"
        fill="none"
      >
        <path d="M 50 60 Q 140 100 130 190" stroke="#8B7FD6" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <path d="M 200 210 Q 260 190 280 100" stroke="#8B7FD6" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <path d="M 200 230 Q 240 280 300 260" stroke="#8B7FD6" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        <path d="M 190 250 Q 100 200 140 340" stroke="#8B7FD6" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      </svg>

      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={cardVariants[i].initial}
          animate={{ opacity: 1, y: 0, rotate: parseFloat(cardVariants[i].rotate) }}
          transition={{ duration: 0.5, delay: 0.6 + i * 0.12, ease: "easeOut" }}
          className="absolute w-[150px] bg-card rounded-2xl p-4 text-[13px] shadow-[0_10px_30px_rgba(43,36,64,0.08)]"
          style={{ top: card.top, left: card.left, right: card.right, rotate: cardVariants[i].rotate }}
        >
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-[10px] mb-2 ${card.tagColor}`}>
            {card.tag}
          </span>
          <div>
            {card.label}<br />
            <b>{card.value}</b>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
