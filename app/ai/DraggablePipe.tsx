import Image from "next/image";
import { useDrag } from "react-dnd";
import { getPipeType } from "@/utils/Pipes";
import { useRef } from "react";
import { PipeType } from "@/utils/csp/utils";

interface DraggablePipeProps {
  id: string;
  pipe: PipeType;
  rotation: number;
  onTurn: () => void;
  onDelete: () => void;
  isTemplate: boolean;
}

export default function DraggablePipe({
  id,
  pipe,
  rotation,
  onTurn,
  onDelete,
  isTemplate,
}: DraggablePipeProps) {
  const pipeType = getPipeType(pipe);

  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "PIPE",
    item: { pipe, id: isTemplate ? undefined : id }, // Only pass id if it's not a template
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));
  const ref = useRef<HTMLDivElement>(null);
  dragRef(ref);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete();
  };

  return (
    <div ref={ref} onClick={onTurn} onContextMenu={handleContextMenu}>
      <Image
        src={`/type${pipeType}.svg`}
        className="w-full h-full transition-transform duration-200"
        alt={`Pipe type ${pipeType}`}
        style={{
          transform: `rotate(${rotation * 90}deg)`,
          opacity: isDragging ? 0.5 : 1,
        }}
        width={100}
        height={100}
      />
    </div>
  );
}
