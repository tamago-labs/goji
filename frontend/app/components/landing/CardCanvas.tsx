export default function CardCanvas() {
  return (
    <div className="relative h-[420px]">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 420"
        fill="none"
      >
        <path
          d="M 100 60 Q 140 100 130 190"
          stroke="#8B7FD6"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M 200 210 Q 260 190 280 100"
          stroke="#8B7FD6"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M 200 230 Q 240 280 300 260"
          stroke="#8B7FD6"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M 190 250 Q 200 300 240 340"
          stroke="#8B7FD6"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>

      <div className="absolute top-[10px] left-0 w-[150px] bg-card rounded-2xl p-4 text-[13px] shadow-[0_10px_30px_rgba(43,36,64,0.08)] -rotate-3">
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-[10px] mb-2 bg-mint/25 text-[#1B7A50]">
          wallet
        </span>
        <div>
          Ops Multisig<br />
          <b>$18,400</b>
        </div>
      </div>

      <div className="absolute top-[150px] left-[60px] w-[150px] bg-card rounded-2xl p-4 text-[13px] shadow-[0_10px_30px_rgba(43,36,64,0.08)] rotate-2">
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-[10px] mb-2 bg-violet/20 text-[#5A4FB8]">
          contributor
        </span>
        <div>
          alix.eth<br />
          <b>$4,200 / mo</b>
        </div>
      </div>

      <div className="absolute top-[40px] right-[10px] w-[150px] bg-card rounded-2xl p-4 text-[13px] shadow-[0_10px_30px_rgba(43,36,64,0.08)] rotate-4">
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-[10px] mb-2 bg-coral/20 text-[#C24E33]">
          doc
        </span>
        <div>
          Contract<br />
          alix-q3.pdf
        </div>
      </div>

      <div className="absolute top-[230px] right-[40px] w-[150px] bg-card rounded-2xl p-4 text-[13px] shadow-[0_10px_30px_rgba(43,36,64,0.08)] -rotate-2">
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-[10px] mb-2 bg-violet/20 text-[#5A4FB8]">
          contributor
        </span>
        <div>
          devon.eth<br />
          <b>$1,900</b>
        </div>
      </div>

      <div className="absolute top-[330px] left-[120px] w-[150px] bg-card rounded-2xl p-4 text-[13px] shadow-[0_10px_30px_rgba(43,36,64,0.08)] rotate-1">
        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-[10px] mb-2 bg-coral/20 text-[#C24E33]">
          doc
        </span>
        <div>
          Payslip<br />
          auto-generated
        </div>
      </div>
    </div>
  );
}
