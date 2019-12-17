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
  outputs: string[];
};

class IntCodeComputer {
  instructions: string[] = [];

  position: number = 0;
  relativeBase: number = 0;

  constructor(instructions: string[]) {
    this.instructions = instructions;
  }

  restartAndHold(): void {
    this.position = this.relativeBase = 0;
  }

  restartSoftware(inputs: string[], feedbackMode: boolean = false): Exit {
    this.position = this.relativeBase = 0;
    return this.resumeSoftware(inputs, feedbackMode);
  }

  resumeSoftware(inputs: string[], feedbackMode: boolean = false): Exit {
    let outputs: string[] = [];

    let running = true;
    let exit = { exitType: ExitType.Normal, lastPosition: this.position, outputs };
    while (running && exit.exitType === ExitType.Normal) {
      exit = this.runInstruction(inputs, outputs, feedbackMode);
    }

    return exit;
  }

  runInstruction(inputs: string[], outputs: string[], feedbackMode: boolean): Exit {
    const opCodeRaw: string = this.instructions[this.position];
    const opCodeWithModes: string = opCodeRaw.padStart(2, '0');
    const opCode: string = opCodeWithModes.slice(-2);
    const modes: string[] = opCodeWithModes.slice(0,-2).padStart(3, '0').split('').reverse();
    const newInstructions = this.instructions.slice();

    if (this.position === this.instructions.length) {
      // //HOLDconsole.log('ending condition: ', position, instructions.length, opCode);
      return { exitType: ExitType.LastInstruction, lastPosition: this.position, outputs };
    }

    if (opCode === '99') {
      // //HOLDconsole.log('ending condition: ', position, instructions.length, opCode);
      return { exitType: ExitType.Halt, lastPosition: this.position, outputs };
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
      // //HOLDconsole.log('OPCODE 3!!!');
      if (feedbackMode && inputs.length === 0) {
        return { exitType: ExitType.Feedback, lastPosition: this.position, outputs };
      }
      newInstructions[modes[0] === Mode.Position ? parameterA : parameterA+this.relativeBase] = inputs[0];
      inputs.splice(0, 1);
      newPosition += 2;
    }

    if (opCode === '04') { // OUTPUT
      outputs.push(modes[0] === Mode.Position ? (this.instructions[parameterA] || '0') : modes[0] === Mode.Relative ? (this.instructions[parameterA + this.relativeBase] || '0') : String(parameterA));
      newPosition += 2;
      // if (feedbackMode) {
      //   // //HOLDconsole.log('Exiting feedback due to output');
      //   return { exitType: ExitType.Feedback, lastPosition: newPosition, outputs }
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

    // //HOLDconsole.log(`(${this.position}) [op: ${opCode}] [modes: ${modes.join('')}] ${parameterA}-${operandA} ${parameterB}-${operandB} ${targetParameter}-${targetParameter}`);

    return {
      exitType: ExitType.Normal,
      lastPosition: newPosition,
      outputs
    };
  }
}


class ScaffoldRobot {
  computer: IntCodeComputer;

  constructor(computer: IntCodeComputer) {
    this.computer = computer;
  }

  scaffoldView(): string {
    const exit = this.computer.resumeSoftware([]);
    const scaffoldVisionCodes =  exit.outputs;

    return scaffoldVisionCodes
      .map((code) => {
        return String.fromCodePoint(Number.parseInt(code));
      })
      .join('');
  }
}


// PART 1

const scaffoldSoftware = fs.readFileSync('input/day17.input', 'utf-8').trim().split(',');

const scaffoldRobot = new ScaffoldRobot(new IntCodeComputer(scaffoldSoftware.slice()));
const scaffoldView = scaffoldRobot.scaffoldView();

console.log(scaffoldView);
const scaffoldRows = scaffoldView.trim().split('\n');
console.log(scaffoldRows);

let startingPoint: number[] = [];
const scaffoldIntersections = scaffoldRows.reduce((intersections: number[][], row, t) => {
  row.split('').forEach((_, l) => {

    if (scaffoldRows[t].charAt(l) === '^') startingPoint = [t,l];
    // console.log(`Checking if ${l},${t} is an intersection`);
    if (isScaffoldIntersection(t, l)) {
      intersections.push([t, l]);
    }
  });
  return intersections;
}, []);

function isScaffoldIntersection(top: number, left: number): boolean {
  const isIntersection = (scaffoldRows[top] || '').charAt(left) === '#'
    && (scaffoldRows[top-1] || '').charAt(left) === '#'
    && (scaffoldRows[top+1] || '').charAt(left) === '#'
    && (scaffoldRows[top] || '').charAt(left-1) === '#'
    && (scaffoldRows[top] || '').charAt(left+1) === '#';
  return isIntersection;
}

const sumOfAlignmentParameters = scaffoldIntersections
  .reduce((sum, intersection) => {
    return sum + intersection[0]*intersection[1]
  }, 0);
console.log(`Day 17 - Part 1: ${sumOfAlignmentParameters} alignment parameter sum`); // 5056

console.log(scaffoldIntersections);
console.log(startingPoint);

/*
R,12,L,8,R,6,R,12,L,8,R,6,R,12,L,6,R,6,R,8,R,6,L,8,R,8,R,6,R,12,R,12,L,8,R,6,L,8,R,8,R,6,R,12,R,12,L,8,R,6,R,12,L,6,R,6,R,8,R,6,L,8,R,8,R,6,R,12,R,12,L,6,R,6,R,8,R,6
*/
