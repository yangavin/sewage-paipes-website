import { useRef } from "react";
import { useDrop } from "react-dnd";
import { PipeType } from "@/utils/csp/utils";

interface DroppableBoxProp {
  children?: React.ReactNode;
  onDrop: (pipe: PipeType, id?: string) => void;
}

export default function DroppableBox({ children, onDrop }: DroppableBoxProp) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "PIPE",
    drop: ({ pipe, id }: { pipe: PipeType; id?: string }) => onDrop(pipe, id),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
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
