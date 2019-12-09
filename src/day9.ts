import * as fs from 'fs';

enum Mode {
  Position = '0',
  Immediate = '1',
  Relative = '2',
}

enum ExitType {
  Normal,
  Feedback,
  Halt,
  LastInstruction,
}

type Exit = {
  exitType: ExitType;
  lastPosition: number;
};

class IntCodeComputer {
  instructions: string[] = [];

  position: number = 0;
  relativeBase: number = 0;
  constructor(instructions: string[]) {
    this.instructions = instructions;
  }

  resumeSoftware(inputs: string[], outputs: string[], feedbackMode: boolean = false) {
    let running = true;
    let exit = { exitType: ExitType.Normal, lastPosition: this.position };

    while (running && exit.exitType === ExitType.Normal) {
      exit = this.runInstruction(inputs, outputs, feedbackMode);
    }
  }

  runInstruction(inputs: string[], outputs: string[], feedbackMode: boolean): Exit {
    const opCodeRaw: string = this.instructions[this.position];
    const opCodeWithModes: string = opCodeRaw.padStart(2, '0');
    const opCode: string = opCodeWithModes.slice(-2);
    const modes: string[] = opCodeWithModes.slice(0,-2).padStart(3, '0').split('').reverse();
    const newInstructions = this.instructions.slice();

    if (this.position === this.instructions.length) {
      // console.log('ending condition: ', position, instructions.length, opCode);
      return { exitType: ExitType.LastInstruction, lastPosition: this.position };
    }

    if (opCode === '99') {
      // console.log('ending condition: ', position, instructions.length, opCode);
      return { exitType: ExitType.Halt, lastPosition: this.position };
    }

    const parameterA = Number.parseInt(this.instructions[this.position+1]);
    const operandA = Number.parseInt(modes[0] === Mode.Position ? (this.instructions[parameterA] || '0') : modes[0] === Mode.Relative ? ( this.instructions[parameterA + this.relativeBase] || '0') : this.instructions[this.position+1]);

    const parameterB = Number.parseInt(this.instructions[this.position+2]);
    const operandB = Number.parseInt(modes[1] === Mode.Position ? (this.instructions[parameterB] || '0') : modes[1] === Mode.Relative ? ( this.instructions[parameterB + this.relativeBase] || '0') : this.instructions[this.position+2]);

    const targetParameter = Number.parseInt((this.instructions[this.position+3] || '0'));
    const targetOperand: number = modes[2] === Mode.Relative ? targetParameter + this.relativeBase : targetParameter;

    let newPosition = this.position;
    if (opCode === '01') { // ADD
      newInstructions[targetOperand] = `${operandA + operandB}`;
      newPosition += 4;
    }

    if (opCode === '02') { // MULTIPLY
      newInstructions[targetOperand] = `${operandA * operandB}`;
      newPosition += 4;
    }

    if (opCode === '03') { // SAVE INPUT TO ADDRESS
      // console.log('OPCODE 3!!!');
      if (feedbackMode && inputs.length === 0) {
        console.log('Exiting feedback due to output');
        return { exitType: ExitType.Feedback, lastPosition: this.position };
      }
      newInstructions[modes[0] === Mode.Position ? parameterA : parameterA+this.relativeBase] = inputs[0];
      inputs.splice(0, 1);
      newPosition += 2;
    }

    if (opCode === '04') { // OUTPUT
      outputs.push(modes[0] === Mode.Position ? (this.instructions[parameterA] || '0') : modes[0] === Mode.Relative ? (this.instructions[parameterA + this.relativeBase] || '0') : String(parameterA));
      newPosition += 2;
      // if (feedbackMode) {
      //   // console.log('Exiting feedback due to output');
      //   return { exitType: ExitType.Feedback, lastPosition: newPosition }
      // }
    }

    if (opCode === '05') { // JUMP IF TRUE, set this.position to operand
      const jumpCondition = modes[0] === Mode.Position ? (this.instructions[parameterA] || '0') : modes[0] === Mode.Relative ? (this.instructions[parameterA + this.relativeBase] || '0') : String(parameterA);
      newPosition = Number.parseInt(jumpCondition) !== 0
        ? modes[1] === Mode.Position ? Number.parseInt(this.instructions[parameterB] || '0') : modes[1] === Mode.Relative ? Number.parseInt(this.instructions[parameterB + this.relativeBase] || '0') : parameterB
        : newPosition + 3;
    }

    if (opCode === '06') { // JUMP IF FALSE, set this.position to operand
      const jumpCondition = modes[0] === Mode.Position ? (this.instructions[parameterA] || '0') : modes[0] === Mode.Relative ? (this.instructions[parameterA + this.relativeBase] || '0') : String(parameterA);
      newPosition = Number.parseInt(jumpCondition) === 0
        ? modes[1] === Mode.Position ? Number.parseInt(this.instructions[parameterB] || '0') : modes[1] === Mode.Relative ? Number.parseInt(this.instructions[parameterB + this.relativeBase] || '0') : parameterB
        : newPosition + 3;
    }

    if (opCode === '07') { // LESS THAN
      newInstructions[targetOperand] = operandA < operandB ? '1' : '0';
      newPosition += 4;
    }

    if (opCode === '08') { // GREATER THAN
      newInstructions[targetOperand] = operandA === operandB ? '1' : '0';
      newPosition += 4;
    }

    if (opCode == '09') { // RELATIVE BASE OFFSET
      this.relativeBase += operandA;
      newPosition += 2;
    }

    this.instructions = newInstructions;
    this.position = newPosition;

    // console.log(`(${this.position}) [op: ${opCode}] [modes: ${modes.join('')}] ${parameterA}-${operandA} ${parameterB}-${operandB} ${targetParameter}-${targetParameter}`);

    return {
      exitType: ExitType.Normal,
      lastPosition: newPosition
    };
  }
}

function runIntCodeDay9(instructions: string[], position: number, relativeBase: number, inputs: string[], outputs: string[], feedbackMode = false): Exit {
  const opCodeRaw: string = instructions[position];
  const opCodeWithModes: string = opCodeRaw.padStart(2, '0');
  const opCode: string = opCodeWithModes.slice(-2);
  const modes: string[] = opCodeWithModes.slice(0,-2).padStart(3, '0').split('').reverse();

  // console.log(`OpCode: ${opCode} - Modes: ${JSON.stringify(modes)} - Position: ${position}`);

  if (position === instructions.length) {
    // console.log('ending condition: ', position, instructions.length, opCode);
    return { exitType: ExitType.LastInstruction, lastPosition: position };
  }

  if (opCode === '99') {
    // console.log('ending condition: ', position, instructions.length, opCode);
    return { exitType: ExitType.Halt, lastPosition: position };
  }

  const newInstructions = instructions.slice();

  const parameterA = Number.parseInt(instructions[position+1]);
  const operandA = Number.parseInt(modes[0] === Mode.Position ? (instructions[parameterA] || '0') : modes[0] === Mode.Relative ? (instructions[parameterA + relativeBase] || '0') : instructions[position+1]);

  const parameterB = Number.parseInt(instructions[position+2]);
  const operandB = Number.parseInt(modes[1] === Mode.Position ? (instructions[parameterB] || '0') : modes[1] === Mode.Relative ? (instructions[parameterB + relativeBase] || '0') : instructions[position+2]);

  const targetParameter = Number.parseInt((instructions[position+3] || '0'));
  const targetOperand: number = modes[2] === Mode.Relative ? targetParameter + relativeBase : targetParameter;

  let newPosition = position;
  let newRelativeBase = relativeBase;
  if (opCode === '01') { // ADD
    newInstructions[targetOperand] = `${operandA + operandB}`;
    newPosition += 4;
  }

  if (opCode === '02') { // MULTIPLY
    newInstructions[targetOperand] = `${operandA * operandB}`;
    newPosition += 4;
  }

  if (opCode === '03') { // SAVE INPUT TO ADDRESS
    // console.log('OPCODE 3!!!');
    if (feedbackMode && inputs.length === 0) {
      console.log('Exiting feedback due to output');
      return { exitType: ExitType.Feedback, lastPosition: position };
    }
    newInstructions[modes[0] === Mode.Position ? parameterA : parameterA+relativeBase] = inputs[0];
    inputs.splice(0, 1);
    newPosition += 2;
  }

  if (opCode === '04') { // OUTPUT
    outputs.push(modes[0] === Mode.Position ? (instructions[parameterA] || '0') : modes[0] === Mode.Relative ? (instructions[parameterA + relativeBase] || '0') : String(parameterA));
    newPosition += 2;
    // if (feedbackMode) {
    //   // console.log('Exiting feedback due to output');
    //   return { exitType: ExitType.Feedback, lastPosition: newPosition }
    // }
  }

  if (opCode === '05') { // JUMP IF TRUE, set position to operand
    const jumpCondition = modes[0] === Mode.Position ? (instructions[parameterA] || '0') : modes[0] === Mode.Relative ? (instructions[parameterA + relativeBase] || '0') : String(parameterA);
    newPosition = Number.parseInt(jumpCondition) !== 0
      ? modes[1] === Mode.Position ? Number.parseInt(instructions[parameterB] || '0') : modes[1] === Mode.Relative ? Number.parseInt(instructions[parameterB + relativeBase] || '0') : parameterB
      : newPosition + 3;
  }

  if (opCode === '06') { // JUMP IF FALSE, set position to operand
    const jumpCondition = modes[0] === Mode.Position ? (instructions[parameterA] || '0') : modes[0] === Mode.Relative ? (instructions[parameterA + relativeBase] || '0') : String(parameterA);
    newPosition = Number.parseInt(jumpCondition) === 0
      ? modes[1] === Mode.Position ? Number.parseInt(instructions[parameterB] || '0') : modes[1] === Mode.Relative ? Number.parseInt(instructions[parameterB + relativeBase] || '0') : parameterB
      : newPosition + 3;
  }

  if (opCode === '07') { // LESS THAN
    newInstructions[targetOperand] = operandA < operandB ? '1' : '0';
    newPosition += 4;
  }

  if (opCode === '08') { // GREATER THAN
    newInstructions[targetOperand] = operandA === operandB ? '1' : '0';
    newPosition += 4;
  }

  if (opCode == '09') { // RELATIVE BASE OFFSET
    newRelativeBase += operandA;
    newPosition += 2;
  }

  console.log(`(${position}) [op: ${opCode}] [modes: ${modes.join('')}] ${parameterA}-${operandA} ${parameterB}-${operandB} ${targetParameter}-${targetParameter}`);
  return runIntCodeDay9(newInstructions, newPosition, newRelativeBase, inputs, outputs, feedbackMode);
}

const day9Software = fs.readFileSync('input/day9.input', 'utf-8')
  .trim()
  .split(',');

let outputs: string[] = [];
runIntCodeDay9(day9Software, 0, 0, ['1'], outputs);

console.log(`Day 9 - Part 1: `, outputs); // Part 1 3409270027

outputs = []
const computer = new IntCodeComputer(day9Software);
computer.resumeSoftware(['2'], outputs);
console.log(`Day 9 - Part 2: `, outputs); // Part 2 82760

// outputs = [];
// runIntCodeDay9(day9Software, 0, 0, ['2'], outputs);
// console.log(`Day 9 - Part 2: `, outputs); // Part 2 ?

// let output1: string[] = [];
// let output2: string[] = [];

// const day5Software = fs.readFileSync('input/day5.input', 'utf-8')
//   .trim()
//   .split(',');

// runIntCodeDay9(day5Software.slice(), 0, 0, ['1'], output1); // 5044655
// runIntCodeDay9(day5Software.slice(), 0, 0, ['5'], output2); // 7408802

// console.log(`Day 5 - Part 1: ${output1}`); // 5044655
// console.log(`Day 5 - Part 2: ${output2}`); // 7408802



// PART TWO
// export function permute(list: string[]): string[][] {
//   if (list.length === 0) {
//     return [];
//   }
//   let result = [];
//   for (let i = 0; i < list.length; i++) {
//     const rest: string[] = list.slice(0,i).concat(list.slice(i+1));
//     const restPermutations: string[][] = permute(rest);
//     if (rest.length === 0) {
//       result.push([list[i]]);
//     }

//     for (let j = 0; j < restPermutations.length; j++) {
//       const thisPermutation = [list[i]].concat(restPermutations[j]);
//       result.push(thisPermutation);
//     }
//   }
//   return result;
// }

// const partTwoPhaseConfigurations = permute(['5','6','7','8','9']);

// const amplifierSoftware = fs.readFileSync('input/day7.input', 'utf-8')
//   .trim()
//   .split(',');

// const partTwoThrusterOutputs = partTwoPhaseConfigurations.map((configuration: string[]) => {

//   let startingPositions = [0, 0, 0, 0, 0];
//   let nextInput = '0';
//   let inputSet = [];
//   let output: string[] = [];
//   let ampEOutputs = [];

//   let exit: Exit;

//   let loop = 0;
//   feedback:
//   while (loop > -1) {
//     for (let p = 0;  p < 5; p++) {
//       output = [];
//       inputSet = loop === 0 ? [configuration[p], nextInput] : [nextInput];

//       console.log('next position: ', 'stage: ', p, ' ', startingPositions[p], inputSet);

//       exit = runIntCodeDay9(amplifierSoftware, startingPositions[p], 0, inputSet, output, true);

//       startingPositions[p] = exit.lastPosition;

//       nextInput = output[output.length-1];
//       if (p === 4) {
//         ampEOutputs.push(nextInput);
//       }
//       if (p === 4 && (exit.exitType === ExitType.Halt || exit.exitType === ExitType.LastInstruction)) {
//         break feedback;
//       }
//     }
//     loop++;
//   }

//   console.log(ampEOutputs);
//   return Number.parseInt(ampEOutputs[ampEOutputs.length-1]);
// });

// console.log(partTwoThrusterOutputs);
// console.log(`Day 7 - Part 2 - Maximum Output: ${Math.max(...partTwoThrusterOutputs)}`); //34579864
