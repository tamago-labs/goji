"use client";

import { motion } from "framer-motion";
import CardCanvas from "./CardCanvas";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

export default function Hero() {
  return (
    <section className="relative max-w-[1320px] mx-auto px-13 py-[70px] pb-20 grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
      <div>
        <motion.span
          {...fadeUp(0)}
          className="inline-block bg-coral text-white text-xs font-medium px-3 py-[5px] rounded-[20px] mb-[22px]"
        >
          for DAOs &amp; small web3 teams
        </motion.span>
        <motion.h1
          {...fadeUp(0.1)}
          className="font-display text-[50px] font-semibold leading-[1.12] mb-[22px]"
        >
          Payroll,
          <br />
          <span className="underline decoration-mint decoration-[6px] underline-offset-[4px]">
            sketched out.
          </span>
        </motion.h1>
        <motion.p
          {...fadeUp(0.2)}
          className="text-[17px] leading-[1.6] text-ink/70 max-w-[420px] mb-[34px]"
        >
          Drag a wallet. Connect a contributor. Attach the invoice. Your
          contributor payments, laid out like they actually work — then sent
          straight from your Safe.
        </motion.p>
        <motion.div {...fadeUp(0.3)} className="flex gap-3.5">
          <a
            href="#"
            className="bg-ink text-lavender px-[26px] py-[15px] rounded-3xl text-[15px] font-medium hover:opacity-90 transition-opacity"
          >
            Start a board
          </a>
          <a
            href="#"
            className="text-ink text-[15px] font-medium py-[15px] px-2.5 hover:opacity-70 transition-opacity"
          >
            See an example →
          </a>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      >
        <CardCanvas />
      </motion.div>
    </section>
  );
}
