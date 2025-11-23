import { useRef } from "react";
import { useDrop } from "react-dnd";
import { Openings } from "@/utils/csp/utils";

interface DroppableBoxProp {
  children?: React.ReactNode;
  isSolving: boolean;
  onDrop: (pipe: Openings) => void;
}

export default function DroppableBox({
  children,
  isSolving,
  onDrop,
}: DroppableBoxProp) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "PIPE",
    drop: ({ pipe }: { pipe: Openings }) => onDrop(pipe),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));
  const ref = useRef<HTMLDivElement>(null);
  drop(ref);

  const bgColor = isSolving
    ? "bg-muted/50"
    : isOver
    ? "bg-accent/40"
    : "bg-background";

  return (
    <div
      className={`border border-grid-line ${bgColor} ${
        !isSolving ? "cursor-pointer hover:bg-accent/20" : ""
      } transition-all duration-200 relative group`}
      ref={ref}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
