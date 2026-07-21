"use client";

import { useState, useCallback } from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import Canvas from "./Canvas";
import CanvasCard from "./CanvasCard";
import CanvasLines from "./CanvasLines";
import Toolbar from "./Toolbar";
import AddCardPopover from "./AddCardPopover";
import { type FlowCard, type Connection, type CardCategory } from "./types";

let nextId = 1;
function genId() {
  return "card-" + nextId++;
}

let connId = 1;
function genConnId() {
  return "conn-" + connId++;
}

interface FlowBuilderProps {
  initialCards?: FlowCard[];
  initialConnections?: Connection[];
  flowName?: string;
}

export default function FlowBuilder({
  initialCards = [],
  initialConnections = [],
  flowName = "Untitled flow",
}: FlowBuilderProps) {
  const [cards, setCards] = useState<FlowCard[]>(initialCards);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [selected, setSelected] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [name, setName] = useState(flowName);
  const [zoom, setZoom] = useState(1);
  const [showAddCard, setShowAddCard] = useState(false);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { delta, active } = event;
      const placementId = active.data.current?.placementId;
      if (!placementId) return;
      setCards((prev) =>
        prev.map((c) =>
          c.id === placementId ? { ...c, x: c.x + delta.x, y: c.y + delta.y } : c
        )
      );
    },
    []
  );

  const addCard = useCallback((category: CardCategory) => {
    const id = genId();
    const templates: Record<CardCategory, { title: string; fields: Record<string, string> }> = {
      wallet: { title: "Wallet", fields: { address: "", balance: "" } },
      recipient: { title: "Recipient", fields: { address: "", amount: "", doc: "" } },
      gate: { title: "Multisig Gate", fields: { required: "2", total: "3" } },
    };
    const t = templates[category];
    setCards((prev) => [
      ...prev,
      {
        id,
        category,
        title: t.title,
        x: 200 + Math.random() * 100,
        y: 150 + Math.random() * 100,
        fields: { ...t.fields },
      },
    ]);
  }, []);

  const deleteCard = useCallback(
    (id: string) => {
      setCards((prev) => prev.filter((c) => c.id !== id));
      setConnections((prev) => prev.filter((c) => c.from !== id && c.to !== id));
      if (selected === id) setSelected(null);
    },
    [selected]
  );

  const handlePortClick = useCallback(
    (cardId: string, portType: "input" | "output") => {
      if (portType === "output") {
        setConnectFrom(cardId);
        return;
      }
      if (connectFrom && portType === "input" && connectFrom !== cardId) {
        const fromCard = cards.find((c) => c.id === connectFrom);
        const toCard = cards.find((c) => c.id === cardId);
        if (!fromCard || !toCard) { setConnectFrom(null); return; }

        // Validate connection rules
        const valid =
          (fromCard.category === "wallet" && (toCard.category === "gate" || toCard.category === "recipient")) ||
          (fromCard.category === "gate" && toCard.category === "recipient");

        if (valid) {
          const exists = connections.some((c) => c.from === connectFrom && c.to === cardId);
          if (!exists) {
            setConnections((prev) => [
              ...prev,
              { id: genConnId(), from: connectFrom, fromPort: "output", to: cardId, toPort: "input" },
            ]);
          }
        }
        setConnectFrom(null);
      }
    },
    [connectFrom, connections, cards]
  );

  const deleteConnection = useCallback((id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <div className="h-screen flex flex-col bg-lavender">
      <div className="relative">
        <Toolbar
          flowName={name}
          onNameChange={setName}
          onAddCard={() => setShowAddCard(!showAddCard)}
          zoom={zoom}
          onZoomChange={setZoom}
        />
        <AddCardPopover isOpen={showAddCard} onClose={() => setShowAddCard(false)} onAdd={addCard} />
      </div>

      {connectFrom && (
        <div className="bg-mint/10 border-b border-mint/20 px-4 py-2 text-[#1B7A50] text-xs font-medium flex items-center justify-between">
          <span>Click an input port to connect — press Esc to cancel</span>
          <button onClick={() => setConnectFrom(null)} className="text-mint hover:text-[#1B7A50] text-xs">
            Cancel
          </button>
        </div>
      )}

      <div className="flex-1 relative overflow-hidden">
        <DndContext onDragEnd={handleDragEnd}>
          <Canvas zoom={zoom} onZoomChange={setZoom}>
            <div className="relative">
              <CanvasLines cards={cards} connections={connections} onDeleteConnection={deleteConnection} />
              {cards.map((card) => (
                <CanvasCard
                  key={card.id}
                  card={card}
                  isSelected={selected === card.id}
                  onSelect={setSelected}
                  onDelete={deleteCard}
                  onPortClick={handlePortClick}
                  connectFrom={connectFrom}
                />
              ))}
            </div>
          </Canvas>
        </DndContext>

        {cards.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-ink/20 text-lg mb-2">Click &quot;+ Add Card&quot; to start building</div>
              <div className="text-ink/10 text-sm">or choose a template from the start page</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
