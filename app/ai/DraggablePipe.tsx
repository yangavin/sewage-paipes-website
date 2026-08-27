import Image from "next/image";
import { useDrag } from "react-dnd";
import { getPipeType } from "@/utils/Pipes";
import { useRef } from "react";
import { Openings } from "@/utils/csp/utils";

interface DraggablePipeProps {
  pipe: Openings;
  rotations: number;
  isLocked: boolean;
  onTurn: () => void;
  onDelete: () => void;
}

export default function DraggablePipe({
  pipe,
  rotations,
  isLocked,
  onTurn,
  onDelete,
}: DraggablePipeProps) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: "PIPE",
      item: { pipe: [...pipe] },
      canDrag: !isLocked,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [pipe, rotations, isLocked]
  );
  const ref = useRef<HTMLDivElement>(null);
  dragRef(ref);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) return;
    onDelete();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLocked) return;
    onTurn();
  };

  const pipeType = getPipeType(pipe);
  return (
    <div
      ref={ref}
      className="h-full w-full"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      <Image
        src={`/type${pipeType}.svg`}
        className="w-full h-full transition-transform duration-200"
        alt={`Pipe type ${pipeType}`}
        draggable={false}
        style={{
          transform: `rotate(${rotations * 90}deg)`,
          opacity: isDragging ? 0.5 : 1,
        }}
        width={100}
        height={100}
      />
    </div>
  );
}
