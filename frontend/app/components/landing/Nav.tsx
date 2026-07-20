export default function Nav() {
  return (
    <nav className="flex items-center justify-between px-13 py-6 max-w-[1320px] mx-auto">
      <div className="font-display text-2xl font-semibold flex items-center gap-2">
        <span className="w-[22px] h-[22px] rounded-full bg-mint inline-block" />
        goji
      </div>
      <div className="hidden md:flex gap-8">
        {["Product", "How it works", "For DAOs", "Docs"].map((item) => (
          <a
            key={item}
            href="#"
            className="text-ink/65 text-[15px] font-medium hover:opacity-100 transition-opacity"
          >
            {item}
          </a>
        ))}
      </div>
      <a
        href="#"
        className="bg-ink text-lavender px-[22px] py-[11px] rounded-3xl text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Try it free
      </a>
    </nav>
  );
}
