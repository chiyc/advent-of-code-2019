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

type Location = {
  location: string;
  blockedDirections: string[];
  clearDirections: string[];
  distanceFromStart: number;
}


class RepairDroidControl {
  computer: IntCodeComputer;
  areaMap: string[] = [];
  score: number = 0;

  droidPosition: [number, number] = [21, 21]; // row, col
  area: {[loc: string]: Location} = {};

  // pixelOutput: string[] = [];
  // joystick: string = '0';

  // paddleCol: number = 0;
  // ballCol: number = 0;
  distanceToOxygen: number | null = null;
  oxygenPosition: [number, number] = [-1,-1];

  constructor(computer: IntCodeComputer) {
    this.computer = computer;

    this.area[`${this.droidPositionKey()}`] = {
      location: `${this.droidPositionKey()}`,
      blockedDirections: [],
      clearDirections: [],
      distanceFromStart: 0,
    }
  }

  findOxygenSystem() {
    let running = true;

    let outputs: string[] = [];
    let exit = { exitType: ExitType.Normal, lastPosition: 0, outputs };

    let droidInput = '4';
    let frame = 0;
    while (running && exit.exitType !== ExitType.Halt) {
      //HOLDconsole.log(`Droid is being commanded move ${droidInput} from ${this.droidPositionKey()}`)
      exit = this.computer.resumeSoftware([droidInput], true);
      // //HOLDconsole.log(exit);

      if (exit.outputs.length) {
        const status = exit.outputs[0];
        const lastDroidInput = droidInput;

        if (status === '2') {
          //HOLDconsole.log(`Droid has located oxygen system by moving to ${lastDroidInput} from ${this.droidPositionKey()}`);
          // return;
        }

        droidInput = this.handleResponse(lastDroidInput, status);
        if (Math.round(frame++ % 1000) === 0) {
          this.printAreaMap();
        }
        if (!droidInput) {
          console.log('Shutting down this droid');
          return;
        }

      } else {
        //HOLDconsole.log(exit);
        console.error('Droid software stopped without providing status');
      }
    }
    //HOLDconsole.log('Droid control software finished');

    return exit;
  }

  handleResponse(lastMove: string, status: string): string {
    //HOLDconsole.log(`Droid responded with status code: ${status}`);
    const lastDroidPosition = this.droidPositionKey();
    if (status === '0') {
      this.area[lastDroidPosition].blockedDirections.push(lastMove);

      if (lastMove === '1') this.updateAreaMap(this.droidPosition[0]-1, this.droidPosition[1], '#');
      if (lastMove === '2') this.updateAreaMap(this.droidPosition[0]+1, this.droidPosition[1], '#');
      if (lastMove === '3') this.updateAreaMap(this.droidPosition[0], this.droidPosition[1]-1, '#');
      if (lastMove === '4') this.updateAreaMap(this.droidPosition[0], this.droidPosition[1]+1, '#');

      return this.selectNextMove();

    } else if (status === '1') {
      this.area[lastDroidPosition].clearDirections.push(lastMove);
      if (this.oxygenPosition[0] === this.droidPosition[0] && this.oxygenPosition[1] === this.droidPosition[1]) {
        this.updateAreaMap(this.droidPosition[0], this.droidPosition[1], 'O');
      } else {
        this.updateAreaMap(this.droidPosition[0], this.droidPosition[1], '.');
      }
      this.handleMove(lastMove);
      this.updateAreaMap(this.droidPosition[0], this.droidPosition[1], '@');
      return this.selectNextMove();

    }  else if (status === '2') {
      this.oxygenPosition[0] = this.droidPosition[0];
      this.oxygenPosition[1] = this.droidPosition[1];
      this.area[lastDroidPosition].clearDirections.push(lastMove);
      this.updateAreaMap(this.droidPosition[0], this.droidPosition[1], 'O');
      this.handleMove(lastMove);
      this.distanceToOxygen = this.area[this.droidPositionKey()].distanceFromStart;
      this.updateAreaMap(this.droidPosition[0], this.droidPosition[1], '@');
      return this.selectNextMove();
    }
    console.error('ERROR: Should not reach this codepath');
    return '4';
  }

  selectNextMove(): string {
    const droidPosition = this.droidPositionKey();
    let allPossibleMoves = ['1', '2', '3', '4'];
    // if (this.droidPosition[0] === 12) {
    //   allPossibleMoves.shift();
    // }
    // if (this.droidPosition[1] === 39) {
    //   allPossibleMoves.pop();
    // }
    const attemptedMoves = this.area[droidPosition].blockedDirections;

    attemptedMoves.forEach((move) => {
      if (allPossibleMoves.indexOf(move) !== -1) {
        allPossibleMoves.splice(allPossibleMoves.indexOf(move), 1);
      }
    });

    if (allPossibleMoves.length === 0) {
      console.error(`NO MORE POSSIBLE MOVES FROM ${droidPosition}?`);
      this.printAreaMap();
      return '';
    }
    const nextMoveIndex = Math.floor(Math.random()*allPossibleMoves.length);
    //HOLDconsole.log(`Next move is ${allPossibleMoves[nextMoveIndex]} from ${droidPosition}\n`);
    return `${allPossibleMoves[nextMoveIndex]}`;
  }

  droidPositionKey(): string {
    return `${this.droidPosition[0]},${this.droidPosition[1]}`;
  }

  handleMove(move: string) {
    const droidPosition = this.droidPositionKey();
    let nextDroidPosition = droidPosition;
    if (move === '1') { //north
      this.droidPosition[0] -= 1;
    } else if (move === '2') { //south
      this.droidPosition[0] += 1;
    } else if (move === '3') { //west
      this.droidPosition[1] -= 1;
    } else if (move === '4') { //east
      this.droidPosition[1] += 1;
    } else {
      console.error(`ERROR: Recieved invalid move in handleMove. ~${move}~ ${typeof move}-${move==='1'}`);
    }

    nextDroidPosition = this.droidPositionKey();
    if (this.area[nextDroidPosition] === undefined) {
      this.area[nextDroidPosition] = {
        location: nextDroidPosition,
        blockedDirections: [],
        clearDirections: [],
        distanceFromStart: this.area[droidPosition].distanceFromStart + 1
      }
    } else {
      this.area[nextDroidPosition].distanceFromStart = this.area[droidPosition].distanceFromStart + 1 < this.area[nextDroidPosition].distanceFromStart
        ? this.area[droidPosition].distanceFromStart + 1
        : this.area[nextDroidPosition].distanceFromStart;
    }

    if (this.area[droidPosition].blockedDirections.length === 3) {
      if (move === '1') this.area[nextDroidPosition].blockedDirections.push('2');
      if (move === '2') this.area[nextDroidPosition].blockedDirections.push('1');
      if (move === '3') this.area[nextDroidPosition].blockedDirections.push('4');
      if (move === '4') this.area[nextDroidPosition].blockedDirections.push('3');
    }
  }

  updateAreaMap(row: number, col: number, tile: string) {
    const currentRow = this.areaMap[row] || '';
    this.areaMap[row] = currentRow.slice(0, col).padEnd(col,' ').concat(tile).concat(currentRow.slice(col+1));
  }

  printAreaMap() {
    let screen = '\n';
    for (let r = 0; r < droid.areaMap.length; r++) {
      if (droid.areaMap[r] === undefined) { droid.areaMap[r] = ''; }
      screen += `Row ${r}`.padStart(6, ' ') + ' ' + droid.areaMap[r] + '\n';
    }
    console.log(screen);
    console.log(`Distance from start to oxygen: ${this.distanceToOxygen}\n`);
  }
}

// PART 1

const droidSoftware = fs.readFileSync('input/day15.input', 'utf-8').trim().split(',');

const droid = new RepairDroidControl(new IntCodeComputer(droidSoftware.slice()));

// droid.findOxygenSystem();
// console.log('whaty dsofidsajf oi tdosesnt thits run??');

droid.printAreaMap();
// Day 15 - Part 1: 214 steps to find the oxygen system

// PART 2

// //HOLDconsole.log(`Day 15 - Part 1: ${arcade.countBlocks()} blocks`); // 200
let areaMap = droid.areaMap.slice();
areaMap = [' ############### ### ########### #######',
'#...............#...#...........#.......#',
'#.#.###########.###.#.#.#########.#.####',
'#.#.....#...#.#.....#.#...........#.....#',
' ######.#.#.#.#####.#.#################.#',
'#.......#.#...#.....#.#.....#.........#.#',
'#.#######.#####.#####.###.#.#.#######.#.#',
'#.#.....#.......#...#.#...#.#.....#.#.#.#',
'#.#.###.#########.#.#.#.###.#####.#.#.#.#',
'#...#.#.#...#.....#...#.#..@#.....#...#.#',
'#.###.#.#.#.#.#########.#####.#####.###.#',
'#.....#...#.........#...#...#.....#.#...#',
' ####.#### ########.#.###.#.#.###.#.###.#',
'#.........#.....#...#.#...#.#...#.#.#...#',
'#.#########.###.#.###.#.###.#####.#.#.#.#',
'#.#.......#.#.#.#.....#...#.......#...#.#',
' ##.#####.#.#.#.#######.#.######## ####.#',
'#...#...#.#...#.......#.#.........#...#.#',
'#.#####.#.###.#######.#####.#####.#.###.#',
'#.#...#.#.....#.....#.#...#...#.#.#.....#',
'#.#.#.#.#######.###.#.#.#.###.#.#.######',
'#.#.#.....#.#...#.#.#.#.#.#.....#.#.....#',
'#.#.#####.#.#.###.#.###.#.#####.#.#.###.#',
'#.#.#.....#.......#.....#.....#.#...#...#',
'#.#.#.#################.#####.#.#####.#.#',
'#...#...#.............#.#.....#.#...#.#.#',
' ### ##.#.#.#########.#.#.#######.#.#.#.#',
'#...#...#.#.#.....#.#...#...#.....#...#.#',
'#.###.#####.#.###.#.#######.###.#.#####.#',
'#...#.#.....#.#...#...#.....#...#.#...#.#',
' ##.#.#.#####.#.#####.#.#####.#####.#.##',
'#...#.#.#.....#.#.....#.....#.......#...#',
'#.###.#.#.#####.#.###.#####.#.#########.#',
'#...#...#.#.....#.#...#.....#.#...#.....#',
' ##.#####.#####.#.#.###.#####.###.#.###.#',
'#...#.....#...#...#...#.#.........#.#...#',
'#.###.###.#.#.#### ##.#.#.#########.#.##',
'#.....#.#.#.#.....#...#.#...#.....#.#.#.#',
'#.#####O#.#.#####.#####.#####.###.#.#.#.#',
'#.......#.......#.............#.....#...#',
' ####### ####### ############# ##### ###'];

areaMap = areaMap.map((row) => row.replace('@', '.'));
let nextAreaMap = areaMap.slice();

let countEmptySpace = Infinity;
let minutes = 0;
while (countEmptySpace !== 0) {
  nextAreaMap = areaMap.slice();

  areaMap.forEach((row,r) => {
    row.split('').forEach((cell,c) => {
      if (cell === 'O') {
        if (areaMap[r-1] && areaMap[r-1].charAt(c) === '.') nextAreaMap[r-1] = nextAreaMap[r-1].slice(0,c)+'O'+nextAreaMap[r-1].slice(c+1);
        if (areaMap[r+1] && areaMap[r+1].charAt(c) === '.') nextAreaMap[r+1] = nextAreaMap[r+1].slice(0,c)+'O'+nextAreaMap[r+1].slice(c+1);
        if (areaMap[r].charAt(c-1) === '.') nextAreaMap[r] = nextAreaMap[r].slice(0,c-1)+'O'+nextAreaMap[r].slice(c-1 +1);
        if (areaMap[r].charAt(c+1) === '.') nextAreaMap[r] = nextAreaMap[r].slice(0,c+1)+'O'+nextAreaMap[r].slice(c+1 +1);
      }
    });
  });
  areaMap = nextAreaMap;

  countEmptySpace = areaMap.reduce((tally, row) => {
    return tally+row.split('.').length-1;
  }, 0);
  minutes++;


  // let lastScreen = '\n';
  // for (let r = 0; r < areaMap.length; r++) {
  //   if (areaMap[r] === undefined) { areaMap[r] = ''; }
  //   lastScreen += `Row ${r}`.padStart(6, ' ') + ' ' + areaMap[r] + '\n';
  // }
  // console.log(lastScreen);
}


let lastScreen = '\n';
for (let r = 0; r < areaMap.length; r++) {
  if (areaMap[r] === undefined) { areaMap[r] = ''; }
  lastScreen += `Row ${r}`.padStart(6, ' ') + ' ' + areaMap[r] + '\n';
}
console.log(lastScreen);

console.log(`Day 15 - Part 2: ${minutes} minutes to fill space`); // 343 minutes is too low??? 344!! (off-by-one guessed, lol)



function sleep(millis: number) {
  return new Promise(resolve => setTimeout(resolve, millis));
}
