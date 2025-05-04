import * as ort from "onnxruntime-web";

export async function runInference(inputArray: number[]): Promise<number[]> {
  if (inputArray.length !== 64) {
    throw new Error("Input array must have exactly 64 floats.");
  }

  // Load the model
  const session = await ort.InferenceSession.create("/model.onnx");

  // Prepare input tensor
  const tensor = new ort.Tensor(
    "float32",
    Float32Array.from(inputArray),
    [1, 64]
  ); // Shape [1, 64]

  // Run inference
  const feeds: Record<string, ort.Tensor> = {};
  feeds[session.inputNames[0]] = tensor; // Use the model's first input name

  const results = await session.run(feeds);

  // Assume the model has a single output
  const outputTensor = results[session.outputNames[0]];

  if (!outputTensor) {
    throw new Error("No output tensor found.");
  }

  // Return output as simple JavaScript array
  return Array.from(outputTensor.data as Float32Array);
}
