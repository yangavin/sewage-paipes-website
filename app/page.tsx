"use client";

import Playground from "./Playground";

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold my-8 text-center">Sewage pAIpes</h1>
      </div>
      <Playground />
    </>
  );
}
