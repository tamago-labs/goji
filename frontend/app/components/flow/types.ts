export type CardCategory = "wallet" | "recipient" | "gate";

export interface FlowCard {
  id: string;
  category: CardCategory;
  title: string;
  x: number;
  y: number;
  fields: Record<string, string>;
}

export interface Connection {
  id: string;
  from: string;
  fromPort: "output";
  to: string;
  toPort: "input";
  label?: string;
}

export interface CanvasState {
  cards: FlowCard[];
  connections: Connection[];
}

export interface CardTemplate {
  category: CardCategory;
  title: string;
  fields: Record<string, string>;
}

export const CARD_WIDTH = 220;
export const CARD_HEIGHTS: Record<CardCategory, number> = {
  wallet: 130,
  recipient: 140,
  gate: 120,
};

export const CATEGORY_COLORS: Record<CardCategory, { border: string; bg: string; badge: string; badgeText: string }> = {
  wallet: { border: "#7FD9B0", bg: "bg-mint/10", badge: "bg-mint/20", badgeText: "text-[#1B7A50]" },
  recipient: { border: "#8B7FD6", bg: "bg-violet/10", badge: "bg-violet/20", badgeText: "text-[#5A4FB8]" },
  gate: { border: "#FF8A73", bg: "bg-coral/10", badge: "bg-coral/20", badgeText: "text-[#C24E33]" },
};

export const CARD_TEMPLATES: CardTemplate[] = [
  { category: "wallet", title: "Wallet", fields: { address: "", balance: "" } },
  { category: "recipient", title: "Recipient", fields: { address: "", amount: "", doc: "" } },
  { category: "gate", title: "Multisig Gate", fields: { required: "2", total: "3" } },
];
