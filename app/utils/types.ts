export interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<string | number | null>;
}
