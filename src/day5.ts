'use strict';

import * as fs from 'fs';

const day5Input = fs.readFileSync('input/day5.input', 'utf-8');

enum Mode {
  Position = '0',
  Immediate = '1',
}

const day5Instructions: string[] = day5Input
  .trim()
  .split(',');

console.log(day5Instructions.slice(0, 7));
console.log(day5Instructions.length);

function runProgramDay5(instructions: string[], position: number, input: string, outputs: string[]): string[] {
  // console.log(position, '225: ', instructions[225]);
  const opCodeRaw: string = instructions[position];

  const opCodeWithModes: string = opCodeRaw.padStart(2, '0');
  // console.log('opCode WithModes', opCodeWithModes);
  const opCode: string = opCodeWithModes.slice(-2);
  // console.log('opCode', opCode);

  const modes: string[] = opCodeWithModes.slice(0,-2).padStart(3, '0').split('').reverse();
  // console.log(`OpCode: ${opCode} - Modes: ${JSON.stringify(modes)}`);

  if (position === instructions.length || opCode === '99') {
    console.log(outputs);
    return instructions;
  }

  const newInstructions = instructions.slice();

  const parameterA = Number.parseInt(instructions[position+1]);
  // console.log('param A???', parameterA);
  // console.log(instructions.slice(0,7));
  const parameterB = Number.parseInt(instructions[position+2]);
  const target = instructions[position+3];

  let newPosition = position;
  let newInput = input;
  if (opCode === '01') {
    const operandA = modes[0] === Mode.Position ? instructions[parameterA] : instructions[position+1] ;
    const operandB = modes[1] === Mode.Position ? instructions[parameterB] : instructions[position+2] ;
    newInstructions[Number.parseInt(target)] = `${Number.parseInt(operandA) + Number.parseInt(operandB)}`;
    newPosition += 4;
  }

  if (opCode === '02') {
    const operandA = modes[0] === Mode.Position ? instructions[parameterA] : instructions[position+1] ;
    const operandB = modes[1] === Mode.Position ? instructions[parameterB] : instructions[position+2] ;
    newInstructions[Number.parseInt(target)] = `${Number.parseInt(operandA) * Number.parseInt(operandB)}`;
    newPosition += 4;
  }

  if (opCode === '03') {
    console.log('OPCODE 3!!!');
    newInstructions[parameterA] = input;
    newPosition += 2;
  }

  if (opCode === '04') {
    outputs.push(modes[0] === Mode.Position ? instructions[parameterA] : String(parameterA));
    newPosition += 2;
  }

  console.log(`(${position}) [op: ${opCode}] [modes: ${modes.join('')}] ${parameterA} ${parameterB} ${position}`);

  return runProgramDay5(newInstructions, newPosition, newInput, outputs);
}


const crashInstructions5 = day5Instructions.slice();
// crashInstructions5[1] = '12';
// crashInstructions5[2] = '2';

console.log(`Day 2 - Part 1: ${runProgramDay5(crashInstructions5, 0, '1', [])[0]}`);
