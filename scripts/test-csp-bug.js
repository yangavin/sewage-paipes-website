/**
 * Test script for reproducing CSP puzzle generation freezing bug
 * 
 * This script runs puzzle generation multiple times to identify freezing issues
 * that occur intermittently with large board dimensions (like 25x25).
 * 
 * Run with: node scripts/test-csp-bug.js [boardSize] [iterations] [timeoutMs]
 */

const { createPipesCSP } = require("../utils/csp/combined");

/**
 * Generate a string representation of a pipe state (from main.ts)
 */
function generateOneStateStr(state) {
  let output = "";
  for (const pipe of state) {
    for (let dir = 0; dir < 4; dir++) {
      output += pipe[dir] ? "1" : "0";
    }
  }
  return output;
}

/**
 * Test puzzle generation with timeout to catch freezing
 */
async function testPuzzleGeneration(n, timeoutMs = 10000) {
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

    try {
      console.log(`Starting puzzle generation for ${n}x${n} board...`);
      
      // Create CSP
      const csp = createPipesCSP(n);
      
      // Find single solution using GAC
      const solutions = new Set();
      const solutionCount = csp.gacAll(solutions, 1, false, true);
      
      clearTimeout(timeout);
      
      const duration = Date.now() - startTime;
      
      if (solutionCount > 0) {
        // Generate solution string like the main.ts does
        const solutionArr = Array.from(solutions);
        const solution = JSON.parse(solutionArr[0]);
        const solutionStr = generateOneStateStr(solution);
        
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
    } catch (error) {
      clearTimeout(timeout);
      resolve({
        iteration: 0,
        boardSize: n,
        duration: Date.now() - startTime,
        success: false,
        error: error.message || String(error)
      });
    }
  });
}

/**
 * Run multiple test iterations
 */
async function runTests(boardSize, iterations, timeoutMs = 10000) {
  console.log(`\n=== Testing CSP Puzzle Generation ===`);
  console.log(`Board size: ${boardSize}x${boardSize}`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Timeout: ${timeoutMs}ms`);
  console.log(`=====================================\n`);
  
  const results = [];
  let successCount = 0;
  let timeoutCount = 0;
  let errorCount = 0;
  
  for (let i = 1; i <= iterations; i++) {
    console.log(`\n--- Iteration ${i}/${iterations} ---`);
    
    const result = await testPuzzleGeneration(boardSize, timeoutMs);
    result.iteration = i;
    results.push(result);
    
    if (result.success) {
      successCount++;
      console.log(`✅ Success in ${result.duration}ms`);
    } else if (result.error && result.error.includes('TIMEOUT')) {
      timeoutCount++;
      console.log(`❌ TIMEOUT/FREEZE detected after ${result.duration}ms`);
      console.log(`🔍 This indicates the CSP solver got stuck in an infinite loop or very slow computation`);
    } else {
      errorCount++;
      console.log(`❌ Error: ${result.error} (${result.duration}ms)`);
    }
    
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
  
  // Print timing statistics for successful runs
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const durations = successfulResults.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    console.log(`\n📊 Timing Statistics (successful runs):`);
    console.log(`Average: ${avgDuration.toFixed(0)}ms`);
    console.log(`Min: ${minDuration}ms`);
    console.log(`Max: ${maxDuration}ms`);
  }
  
  return results;
}

/**
 * Main execution
 */
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const boardSize = args[0] ? parseInt(args[0]) : 25;
  const iterations = args[1] ? parseInt(args[1]) : 10;
  const timeoutMs = args[2] ? parseInt(args[2]) : 10000;
  
  console.log(`CSP Puzzle Generation Bug Test`);
  console.log(`Usage: node scripts/test-csp-bug.js [boardSize] [iterations] [timeoutMs]`);
  console.log(`Example: node scripts/test-csp-bug.js 25 20 15000`);
  
  if (isNaN(boardSize) || isNaN(iterations) || isNaN(timeoutMs)) {
    console.error('Invalid arguments. All arguments must be numbers.');
    process.exit(1);
  }
  
  try {
    await runTests(boardSize, iterations, timeoutMs);
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testPuzzleGeneration, runTests };