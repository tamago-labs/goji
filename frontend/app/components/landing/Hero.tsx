import CardCanvas from "./CardCanvas";

export default function Hero() {
  return (
    <section className="relative max-w-[1320px] mx-auto px-13 py-[70px] pb-[140px] grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
      <div>
        <span className="inline-block bg-coral text-white text-xs font-medium px-3 py-[5px] rounded-[20px] mb-[22px]">
          for DAOs &amp; small web3 teams
        </span>
        <h1 className="font-display text-[50px] font-semibold leading-[1.12] mb-[22px]">
          Payroll,
          <br />
          <span className="underline decoration-mint decoration-[6px] underline-offset-[4px]">
            sketched out.
          </span>
        </h1>
        <p className="text-[17px] leading-[1.6] text-ink/70 max-w-[420px] mb-[34px]">
          Drag a wallet. Connect a contributor. Attach the invoice. Your
          contributor payments, laid out like they actually work — then sent
          straight from your Safe.
        </p>
        <div className="flex gap-3.5">
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
        </div>
      </div>

      <CardCanvas />
    </section>
  );
}
