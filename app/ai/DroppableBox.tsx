import { useRef } from "react";
import { useDrop } from "react-dnd";
import { Openings } from "@/utils/csp/utils";

interface DroppableBoxProp {
  children?: React.ReactNode;
  onDrop: (pipe: Openings) => void;
}

export default function DroppableBox({ children, onDrop }: DroppableBoxProp) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "PIPE",
    drop: ({ pipe }: { pipe: Openings }) => onDrop(pipe),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));
  const ref = useRef<HTMLDivElement>(null);
  drop(ref);

  return (
    <div
      className={`border border-gray-300 ${
        isOver ? "bg-gray-300" : "bg-white"
      } cursor-pointer`}
      ref={ref}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
}
