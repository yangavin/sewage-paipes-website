import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import PlayableBoard from "./PlayableBoard";

export default function Playground() {
  const [n, setN] = useState<number>(4);

  console.log(n);

  return (
    <div>
      <div className="w-full flex justify-center gap-4 items-center mb-4">
        <h2>Board Dimension: </h2>
        <Select
          defaultValue="4"
          onValueChange={(value) => setN(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a number" />
          </SelectTrigger>
          <SelectContent className="max-h-[200px]">
            {Array.from({ length: 24 }, (_, i) => (
              <SelectItem key={i} value={`${i + 2}`}>
                {`${i + 2}x${i + 2}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Board */}
      <PlayableBoard n={n} />

      <div></div>
    </div>
  );
}
