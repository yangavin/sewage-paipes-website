"use client";

import { useState } from "react";
import { generateSolution } from "@/utils/csp/main";
import { Button } from "@/components/ui/button";

interface TestResult {
  iteration: number;
  boardSize: number;
  duration: number;
  success: boolean;
  error?: string;
}

export default function TestCSPPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [boardSize, setBoardSize] = useState(25);
  const [iterations, setIterations] = useState(10);
  const [timeoutMs, setTimeoutMs] = useState(15000);

  /**
   * Test puzzle generation with timeout to catch freezing
   */
  async function testPuzzleGeneration(n: number, timeoutMs: number = 10000): Promise<TestResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          iteration: 0,
          boardSize: n,
          duration: Date.now() - startTime,
          success: false,
          error: `TIMEOUT after ${timeoutMs}ms - likely frozen`
        });
      }, timeoutMs);

      generateSolution(n)
        .then((solutionStr) => {
          clearTimeout(timeout);
          const duration = Date.now() - startTime;
          
          if (solutionStr && solutionStr !== "No solution found") {
            resolve({
              iteration: 0,
              boardSize: n,
              duration,
              success: true
            });
          } else {
            resolve({
              iteration: 0,
              boardSize: n,
              duration,
              success: false,
              error: "No solution found"
            });
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          resolve({
            iteration: 0,
            boardSize: n,
            duration: Date.now() - startTime,
            success: false,
            error: error.message || String(error)
          });
        });
    });
  }

  /**
   * Run multiple test iterations
   */
  async function runTests() {
    setIsRunning(true);
    setResults([]);
    
    console.log(`\n=== Testing CSP Puzzle Generation ===`);
    console.log(`Board size: ${boardSize}x${boardSize}`);
    console.log(`Iterations: ${iterations}`);
    console.log(`Timeout: ${timeoutMs}ms`);
    console.log(`=====================================\n`);
    
    const testResults: TestResult[] = [];
    let successCount = 0;
    let timeoutCount = 0;
    let errorCount = 0;
    
    for (let i = 1; i <= iterations; i++) {
      console.log(`\n--- Iteration ${i}/${iterations} ---`);
      
      const result = await testPuzzleGeneration(boardSize, timeoutMs);
      result.iteration = i;
      testResults.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`✅ Success in ${result.duration}ms`);
      } else if (result.error?.includes('TIMEOUT')) {
        timeoutCount++;
        console.log(`❌ TIMEOUT/FREEZE detected after ${result.duration}ms`);
        console.log(`🔍 This indicates the CSP solver got stuck in an infinite loop or very slow computation`);
      } else {
        errorCount++;
        console.log(`❌ Error: ${result.error} (${result.duration}ms)`);
      }
      
      // Update UI with current results
      setResults([...testResults]);
      
      // Add small delay between iterations to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Print summary
    console.log(`\n=== Test Results Summary ===`);
    console.log(`Total iterations: ${iterations}`);
    console.log(`Successes: ${successCount} (${(successCount/iterations*100).toFixed(1)}%)`);
    console.log(`Timeouts/Freezes: ${timeoutCount} (${(timeoutCount/iterations*100).toFixed(1)}%)`);
    console.log(`Other errors: ${errorCount} (${(errorCount/iterations*100).toFixed(1)}%)`);
    
    if (timeoutCount > 0) {
      console.log(`\n⚠️  FREEZE BUG DETECTED! ${timeoutCount} out of ${iterations} iterations froze.`);
      console.log(`This confirms there's a bug in the CSP solver that causes infinite loops or very slow computation.`);
    } else {
      console.log(`\n✅ No freezing detected in ${iterations} iterations.`);
    }
    
    setIsRunning(false);
  }

  const successCount = results.filter(r => r.success).length;
  const timeoutCount = results.filter(r => r.error?.includes('TIMEOUT')).length;
  const errorCount = results.filter(r => !r.success && !r.error?.includes('TIMEOUT')).length;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">CSP Puzzle Generation Bug Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Board Size</label>
          <input
            type="number"
            value={boardSize}
            onChange={(e) => setBoardSize(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
            min="2"
            max="50"
            disabled={isRunning}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Iterations</label>
          <input
            type="number"
            value={iterations}
            onChange={(e) => setIterations(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
            min="1"
            max="100"
            disabled={isRunning}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Timeout (ms)</label>
          <input
            type="number"
            value={timeoutMs}
            onChange={(e) => setTimeoutMs(parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
            min="1000"
            max="60000"
            disabled={isRunning}
          />
        </div>
      </div>

      <Button 
        onClick={runTests} 
        disabled={isRunning}
        className="mb-6"
      >
        {isRunning ? 'Running Tests...' : 'Run CSP Bug Test'}
      </Button>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">Successes</h3>
              <p className="text-2xl font-bold text-green-600">{successCount}</p>
              <p className="text-sm text-green-600">
                {results.length > 0 ? `${(successCount/results.length*100).toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800">Timeouts/Freezes</h3>
              <p className="text-2xl font-bold text-red-600">{timeoutCount}</p>
              <p className="text-sm text-red-600">
                {results.length > 0 ? `${(timeoutCount/results.length*100).toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Other Errors</h3>
              <p className="text-2xl font-bold text-yellow-600">{errorCount}</p>
              <p className="text-sm text-yellow-600">
                {results.length > 0 ? `${(errorCount/results.length*100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Test Results</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : result.error?.includes('TIMEOUT')
                      ? 'bg-red-50 border-red-200'
                      : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      Iteration {result.iteration} ({result.boardSize}x{result.boardSize})
                    </span>
                    <span className="text-sm">
                      {result.duration}ms
                    </span>
                  </div>
                  {result.error && (
                    <p className="text-sm text-red-600 mt-1">
                      {result.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Instructions</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• This test repeatedly generates CSP puzzles to identify freezing bugs</li>
          <li>• Check the browser console for detailed logs</li>
          <li>• If timeouts occur, it indicates the CSP solver is getting stuck</li>
          <li>• Large board sizes (25x25) are more likely to trigger the bug</li>
          <li>• Use this to test fixes by running before and after code changes</li>
        </ul>
      </div>
    </div>
  );
}