"use client";

import { useState } from "react";
import { generateSolution } from "@/utils/csp/main";
import { Button } from "@/components/ui/button";

export default function TestCSPDirectPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [currentTest, setCurrentTest] = useState<string>("");

  const addResult = (message: string) => {
    setResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  const testSingleGeneration = async (boardSize: number, timeoutMs: number = 15000) => {
    setCurrentTest(`Testing ${boardSize}x${boardSize} puzzle generation...`);
    addResult(`🎯 Starting ${boardSize}x${boardSize} puzzle generation`);
    
    const startTime = performance.now();
    
    // Create a timeout to detect freezing
    const timeoutId = setTimeout(() => {
      const elapsed = performance.now() - startTime;
      addResult(`🚨 TIMEOUT after ${elapsed.toFixed(0)}ms - CSP solver appears frozen!`);
      addResult(`❌ This indicates an infinite loop or exponential complexity in the CSP solver`);
      setCurrentTest("TIMEOUT DETECTED - CSP Freeze Bug Confirmed!");
    }, timeoutMs);
    
    try {
      const result = await generateSolution(boardSize);
      clearTimeout(timeoutId);
      
      const elapsed = performance.now() - startTime;
      
      if (result && result !== "No solution found") {
        addResult(`✅ Success in ${elapsed.toFixed(0)}ms - Solution found`);
        if (elapsed > 5000) {
          addResult(`⚠️  Slow performance (${elapsed.toFixed(0)}ms) - may indicate issues`);
        }
      } else {
        addResult(`❌ No solution found in ${elapsed.toFixed(0)}ms`);
      }
      
      setCurrentTest("");
      return { success: true, duration: elapsed };
      
    } catch (error) {
      clearTimeout(timeoutId);
      const elapsed = performance.now() - startTime;
      addResult(`❌ Error after ${elapsed.toFixed(0)}ms: ${error}`);
      setCurrentTest("");
      return { success: false, duration: elapsed, error: String(error) };
    }
  };

  const runProgressiveTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    addResult("🚀 Starting Progressive CSP Bug Test");
    addResult("Testing progressively larger board sizes to find freeze point...");
    
    const testSizes = [5, 10, 15, 20, 25];
    
    for (const size of testSizes) {
      addResult(`\n${'='.repeat(40)}`);
      addResult(`📏 Testing ${size}x${size} board`);
      addResult(`${'='.repeat(40)}`);
      
      const result = await testSingleGeneration(size, 20000); // 20 second timeout
      
      if (!result.success && result.duration > 15000) {
        addResult(`\n🎯 BUG REPRODUCTION SUCCESSFUL!`);
        addResult(`Found freezing behavior at ${size}x${size} board size`);
        addResult(`This confirms the CSP solver has infinite loop issues`);
        break;
      }
      
      // Add delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    addResult(`\n📊 Test completed`);
    setIsRunning(false);
  };

  const testSpecificSize = async (size: number) => {
    setIsRunning(true);
    
    addResult(`\n🎯 Direct test of ${size}x${size} board`);
    await testSingleGeneration(size, 30000); // 30 second timeout for single test
    
    setIsRunning(false);
  };

  const runStressTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    addResult("🔥 Starting Stress Test - Multiple 25x25 generations");
    addResult("This will repeatedly attempt 25x25 puzzle generation to catch intermittent freezing...");
    
    for (let i = 1; i <= 10; i++) {
      addResult(`\n--- Iteration ${i}/10 ---`);
      
      const result = await testSingleGeneration(25, 15000); // 15 second timeout
      
      if (!result.success && result.duration > 10000) {
        addResult(`\n🚨 FREEZE BUG DETECTED on iteration ${i}!`);
        addResult(`This proves the bug is intermittent and occurs with 25x25 boards`);
        break;
      }
      
      // Short delay between iterations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunning(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Direct CSP Bug Reproduction Test</h1>
      
      <div className="space-y-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <Button 
            onClick={runProgressiveTest} 
            disabled={isRunning}
            variant="default"
          >
            Run Progressive Test (5x5 → 25x25)
          </Button>
          
          <Button 
            onClick={runStressTest} 
            disabled={isRunning}
            variant="destructive"
          >
            Run Stress Test (10x 25x25)
          </Button>
          
          <Button 
            onClick={() => testSpecificSize(25)} 
            disabled={isRunning}
            variant="outline"
          >
            Test 25x25 Only
          </Button>
          
          <Button 
            onClick={() => testSpecificSize(30)} 
            disabled={isRunning}
            variant="outline"
          >
            Test 30x30 (High Risk)
          </Button>
        </div>
        
        {isRunning && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
              <span className="font-medium">Running Test...</span>
            </div>
            {currentTest && (
              <p className="text-sm text-blue-700 mt-2">{currentTest}</p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 border rounded-lg">
          <h3 className="font-semibold mb-2">Test Instructions</h3>
          <ul className="text-sm space-y-1">
            <li>• <strong>Progressive Test:</strong> Tests increasing board sizes to find where freezing starts</li>
            <li>• <strong>Stress Test:</strong> Repeatedly tests 25x25 to catch intermittent freezing</li>
            <li>• <strong>25x25 Test:</strong> Single test of the most problematic size</li>
            <li>• <strong>30x30 Test:</strong> Even larger size that&apos;s almost guaranteed to freeze</li>
            <li>• Watch browser DevTools console for additional debugging info</li>
            <li>• If the page becomes unresponsive, that confirms the bug</li>
          </ul>
        </div>

        {results.length > 0 && (
          <div className="border rounded-lg">
            <div className="p-3 bg-gray-50 border-b font-semibold">
              Test Results Log
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {results.join('\n')}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• This test directly calls the CSP generation function</li>
          <li>• If the browser tab becomes unresponsive, the bug is reproduced</li>
          <li>• Timeouts indicate the CSP solver is stuck in infinite loops</li>
          <li>• Use this page to test fixes - successful tests should complete quickly</li>
          <li>• Keep browser DevTools open to monitor memory usage and console output</li>
        </ul>
      </div>
    </div>
  );
}