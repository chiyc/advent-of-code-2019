"use strict";

const fs = require("fs");

const input = fs.readFileSync("input/day2.input", "utf-8");

const instructions: number[] = input
  .split(',')
  .map((s: string) => Number.parseInt(s.trim()));

function runProgram(instructions: number[], position: number): number[] {
  const opCode = instructions[position];
  if (position === instructions.length || opCode === 99) {
    return instructions;
  }
  const newInstructions = instructions.slice();

  const operandPositionA = instructions[position+1];
  const operandPositionB = instructions[position+2];
  const targetPosition = instructions[position+3];

  if (opCode === 1) {
    newInstructions[targetPosition] = instructions[operandPositionA] + instructions[operandPositionB];
  }

  if (opCode === 2) {
    newInstructions[targetPosition] = instructions[operandPositionA] * instructions[operandPositionB];
  }

  // console.log(`(${position}) ${opCode} ${operandA} ${operandB} ${targetPosition} \t ${newInstructions[0]}`);

  return runProgram(newInstructions, position + 4);
}

const crashInstructions = instructions.slice();
crashInstructions[1] = 12;
crashInstructions[2] = 2;

console.log(`Day 2 - Part 1: ${runProgram(crashInstructions, 0)[0]}`);

nounLoop:
for (let i = 0; i < 100; i++) {
  verbLoop:
  for (let j = 0; j < 100; j++) {
    const testInstructions = instructions.slice();
    testInstructions[1] = i;
    testInstructions[2] = j;
    if (runProgram(testInstructions, 0)[0] === 19690720) {
      console.log(`Day 2 - Part 2: ${100 * i + j}`);
      break nounLoop;
    }
  }
}
