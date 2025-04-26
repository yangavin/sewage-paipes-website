import { type PyodideInterface } from "./types";

let pyodide: PyodideInterface | null = null;

const REQUIRED_PYTHON_FILES = [
  "/python/main.py",
  "/python/combined.py",
  "/python/pipes_utils.py",
  "/python/csp.py",
  "/python/constraints/no_cycles.py",
  "/python/constraints/no_half_connections.py",
  "/python/constraints/connected.py",
];

export async function initPyodide() {
  if (pyodide) return pyodide;

  // @ts-expect-error Pyodide is loaded from CDN
  pyodide = await loadPyodide();

  if (!pyodide) {
    throw new Error("Failed to initialize Pyodide");
  }

  // Create constraints directory
  await pyodide.runPythonAsync(`
import os
os.makedirs('constraints', exist_ok=True)
with open('constraints/__init__.py', 'w') as f:
    f.write('')
`);

  // Load all required Python files
  const fileContents = await Promise.all(
    REQUIRED_PYTHON_FILES.map(async (file) => {
      const response = await fetch(file);
      const content = await response.text();
      return {
        path: file.replace("/python/", ""),
        content,
      };
    })
  );

  // Write files to Pyodide's virtual filesystem
  for (const { path, content } of fileContents) {
    await pyodide.runPythonAsync(`
with open('${path}', 'w') as f:
    f.write('''${content}''')
`);
  }

  // Load the main script
  await pyodide.runPythonAsync(`
import sys
sys.path.append('.')
`);

  return pyodide;
}

export async function generatePipesState(size: number): Promise<string> {
  const py = await initPyodide();

  // Create a Python function that simulates command line arguments
  const setupCode = `
import sys
from io import StringIO
import contextlib
from main import main

def run_main_with_size(size):
    # Capture stdout
    output = StringIO()
    with contextlib.redirect_stdout(output):
        sys.argv = ['main.py', '-n', str(size)]
        main()
    return output.getvalue().strip()
`;

  await py.runPythonAsync(setupCode);

  // Run the main function with the specified size
  const result = await py.runPythonAsync(`run_main_with_size(${size})`);
  return result as string;
}
