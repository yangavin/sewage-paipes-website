import { useRef } from "react";
import { useDrop } from "react-dnd";
import { Openings } from "@/utils/csp/utils";

interface DroppableBoxProp {
  children?: React.ReactNode;
  isLocked: boolean;
  onDrop: (pipe: Openings) => void;
  onClick?: () => void;
}

export default function DroppableBox({
  children,
  isLocked,
  onDrop,
  onClick,
}: DroppableBoxProp) {
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "PIPE",
      canDrop: () => !isLocked,
      drop: ({ pipe }: { pipe: Openings }) => {
        if (!isLocked) {
          onDrop(pipe);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver() && monitor.canDrop(),
      }),
    }),
    [isLocked, onDrop]
  );
  const ref = useRef<HTMLDivElement>(null);
  drop(ref);

  const bgColor = isLocked
    ? "bg-muted/50"
    : isOver
    ? "bg-accent/40"
    : "bg-background";

  return (
    <div
      className={`border border-grid-line ${bgColor} ${
        !isLocked
          ? "cursor-pointer hover:bg-accent/20"
          : "cursor-not-allowed"
      } transition-all duration-200 relative group`}
      ref={ref}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (!isLocked) {
          onClick?.();
        }
      }}
      aria-disabled={isLocked}
    >
      {children}
      {isLocked && (
        <div className="absolute inset-0 z-10 bg-black/10 pointer-events-none" />
      )}
    </div>
  );
}
