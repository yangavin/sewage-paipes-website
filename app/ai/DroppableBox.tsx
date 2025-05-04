import { useRef } from "react";
import { useDrop } from "react-dnd";

interface DroppableBoxProp {
  children?: React.ReactNode;
  onDrop: (pipe: boolean[], id?: string) => void;
}

export default function DroppableBox({ children, onDrop }: DroppableBoxProp) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "PIPE",
    drop: ({ pipe, id }: { pipe: boolean[]; id?: string }) => onDrop(pipe, id),
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
