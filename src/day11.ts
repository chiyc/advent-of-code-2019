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
      // console.log('ending condition: ', position, instructions.length, opCode);
      return { exitType: ExitType.LastInstruction, lastPosition: this.position, outputs };
    }

    if (opCode === '99') {
      // console.log('ending condition: ', position, instructions.length, opCode);
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
      // console.log('OPCODE 3!!!');
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
      //   // console.log('Exiting feedback due to output');
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

    // console.log(`(${this.position}) [op: ${opCode}] [modes: ${modes.join('')}] ${parameterA}-${operandA} ${parameterB}-${operandB} ${targetParameter}-${targetParameter}`);

    return {
      exitType: ExitType.Normal,
      lastPosition: newPosition,
      outputs
    };
  }
}

const day11Software = fs.readFileSync('input/day11.input', 'utf-8')
  .trim()
  .split(',');

let directions: {[key: string]: boolean} = {};

class HullPaintingRobot {
  computer: IntCodeComputer;
  hull: string[][] = [];

  position: Point = [0,0];
  direction: Dir = Dir.N;

  constructor(computer: IntCodeComputer, hull: string[][]=[], startingPosition: Point = [0,0], startingDirection: Dir = Dir.N) {
    this.computer = computer;
    this.position = startingPosition;
    this.direction = startingDirection;

    this.hull = hull;
  }

  startPainting() {

    let exit;
    do {
      const input = [this.getCameraInput()];
      // console.log(`About to resume robot at ${this.position[0]},${this.position[1]} - hull color ${input[0]} - orientation ${this.direction}`)
      // directions[this.direction] = true;
      exit = this.computer.resumeSoftware(input, true);

      if (exit.outputs.length < 2) {
        console.error('Too few outputs! Shutting down.');
        continue;
      }
      const paintColor = exit.outputs.shift();
      // console.log(`Robot output paint color ${paintColor}`);
      this.hull[this.position[0]][this.position[1]] = paintColor === '1' ? '#' : '.';
      directions[`${this.position[0]},${this.position[1]}`] = true; // lol, this is so bad

      const turn = exit.outputs.shift();
      // const prevDir = this.direction;
      this.direction = turn === '1'
        ? (this.direction + 1) % 4
        : this.direction === Dir.N
          ? Dir.W
          : this.direction - 1;

      // console.log(`Robot output turn ${turn} from ${prevDir} to ${this.direction}`);

      if (this.direction === Dir.N) this.position = [this.position[0], this.position[1]+1];
      if (this.direction === Dir.E) this.position = [this.position[0]+1, this.position[1]];
      if (this.direction === Dir.S) this.position = [this.position[0], this.position[1]-1];
      if (this.direction === Dir.W) this.position = [this.position[0]-1, this.position[1]];

      // console.log(exit);
    } while (exit.exitType !== ExitType.Halt && exit.exitType !== ExitType.LastInstruction);
    // } while (false);
  }

  getCameraInput() {
    this.hull[this.position[0]] = this.hull[this.position[0]] || [];
    const hullPosition = this.hull[this.position[0]][this.position[1]];
    if (hullPosition === '#') {
      return '1'
    }
    return '0';
  }

  hullView() {
    return this.hull;
  }
}

enum Dir {
  N=0,
  E=1,
  S=2,
  W=3,
}

type Point = [number, number];

const computer = new IntCodeComputer(day11Software.slice());
// const startingPosition: Point = [0,0];
// const startingDirection = Dir.N;
const robot = new HullPaintingRobot(computer);

robot.startPainting();
// console.log(robot.hullView());

// const paintedTileCounts = robot.hullView()
//   .reduce((sum, c) => {
//     return sum + Object.keys(c).length;
//   }, 0);

const hull: any = robot.hullView();
const paintedTileCounts = Object.keys(robot.hullView())
  .reduce((sum, c) => {
    const hullGridColumn = hull[c];
    return sum + Object.keys(hullGridColumn).length;
  }, 0);

console.log(`Day 11 - Part 1: ${paintedTileCounts}`); // 4578 is too high, 655 too low, 2211!!! is the right answer
// let part1Output = computer.resumeSoftware(['1']).outputs;

// console.log(`Day 9 - Part 1: `, part1Output); // Part 1 3409270027

// let part2Output = computer.restartSoftware(['2']).outputs;
// console.log(`Day 9 - Part 2: `, part2Output); // Part 2 82760
// console.log(directions);

console.log(Object.keys(directions).length);

const part2Computer = new IntCodeComputer(day11Software.slice());
const part2Robot = new HullPaintingRobot(part2Computer, [['#']]);

part2Robot.startPainting();

const hull2: any = part2Robot.hullView();

let maxY = -Infinity;
const maxX = Math.max(...Object.keys(hull2).map((x) => {
  maxY = Math.max(maxY, ...Object.keys(hull2).map((y) => Number.parseInt(y)));
  return Number.parseInt(x);
}));

let minY = Infinity;
const minX = Math.min(...Object.keys(hull2).map((x) => {
  minY = Math.min(minY, ...Object.keys(hull2[x]).map((y) => Number.parseInt(y)));
  return Number.parseInt(x);
}));
// const hullAxisYMin = Math.min(...Object.keys(hull2).map((x) => Number.parseInt(x)));

console.log(`Max X and Y: ${maxX} ${maxY}`);
console.log(`Min X and Y: ${minX} ${minY}`);

let hullView = '';
for (let j = 42; j >= -5; j--) {
  for (let i = 0; i < 43; i++) {
    // console.log(`At position ${i},${j} there's |${hull2[i][j]}|`);
    hullView += hull2[i][j] || '.';
  }
  hullView += '\n';
}


// const paintedTileCounts2 = Object.keys(part2Robot.hullView())
//   .reduce((sum, c) => {
  //     const hullGridColumn = hull2[c];
  //     return sum + Object.keys(hullGridColumn).length;
  //   }, 0);

  console.log(`Day 11 - Part 2: `); // 4578 is too high, 655 too low, 2211!!! is the right answer
  console.log(hullView); // shows EFCKUEGC
