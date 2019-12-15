import * as fs from 'fs';

function sleep(millis: number) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

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

const arcadeSoftware = fs.readFileSync('input/day13.input', 'utf-8').trim().split(',');
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);

class ArcadeCabinet {
  computer: IntCodeComputer;
  screen: string[] = [];
  score: number = 0;
  pixelOutput: string[] = [];
  joystick: string = '0';

  paddleCol: number = 0;
  ballCol: number = 0;

  constructor(computer: IntCodeComputer, joystick: boolean = false) {
    this.computer = computer;
    process.stdin.setRawMode(true);

    if (joystick) {
      process.stdin.on('keypress', this._setJoystick);
    }
  }

  _setJoystick = (str: string) => {
    if (str === 'h') this.joystick = '-1';
    if (str === 'j') this.joystick = '0';
    if (str === 'l') { this.joystick = '1'; }
  };

  async startGame(autoplay = false): Promise<Exit> {
    let outputs: string[] = [];

    let running = true;
    let exit = { exitType: ExitType.Normal, lastPosition: 0, outputs };
    while (running && exit.exitType === ExitType.Normal) {
      const play = autoplay ? this.autoplay() : [this.joystick];
      exit = this.computer.runInstruction(play, this.pixelOutput, false);

      console.log(exit);
      await this.printScreen();
    }
    return exit;
  }

  autoplay(): string[] {
    if (this.ballCol === this.paddleCol) return ['0'];
    return this.ballCol < this.paddleCol ? ['-1'] : ['1'];
  }

  async printScreen() {
    if (this.pixelOutput.length === 3) {
      const col = Number.parseInt(this.pixelOutput[0]);
      const row = Number.parseInt(this.pixelOutput[1]);
      const tile = this.pixelOutput[2];
      this.pixelOutput = [];

      if (col === -1 && row === 0) {
        this.score = Number.parseInt(tile);
        return; // does not print last score because screen does not get printed!!
      }

      if (tile === '3') {
        this.paddleCol = col;
      }

      if (tile === '4') {
        this.ballCol = col;
      }

      const currentRow = this.screen[row] || '';
      this.screen[row] = currentRow.slice(0, col).padEnd(col,' ').concat(this._printTile(tile)).concat(currentRow.slice(col+1));

      const maxRow = Math.max(...Object.keys(this.screen).map((row => Number.parseInt(row))));
      console.log('START SCREEN');
      let screen = '';
      for (let r = 0; r <= maxRow; r++) { // max row is 19 indexed from 0
        screen += (this.screen[r] || '') + '   row ' + r + '\n';
      }
      console.log(screen);
      console.log(`Score: ${this.score}`);
      console.log('END SCREEN\n');

      if (maxRow >= 19 && this.screen[19].length === 44) {
        await sleep(0);
      }
    }
  }

  _printTile(code: string): string {
    if (code ===  '0') return ' ';
    if (code ===  '1') return '#';
    if (code ===  '2') return '□';
    if (code ===  '3') return '=';
    if (code ===  '4') return 'o';
    return ' ';
  }

  countBlocks() {
    const maxRow = Math.max(...Object.keys(this.screen).map((row => Number.parseInt(row))));
    let blockCount = 0;
    for (let r = 0; r <= maxRow; r++) {
      blockCount += this.screen[r].split('□').length - 1
    }
    return blockCount;
  }
}

// const arcade = new ArcadeCabinet(new IntCodeComputer(arcadeSoftware.slice()));

// console.log('starting game');
// arcade.startGame();

// console.log(`Day 13 - Part 1: ${arcade.countBlocks()} blocks`); // 200

const part2ArcadeSoftware = arcadeSoftware.slice();
part2ArcadeSoftware[0] = '2'; // set memory address for quarters to 2 to play for free
const part2Arcade = new ArcadeCabinet(new IntCodeComputer(part2ArcadeSoftware), false);

(async function() {
  await part2Arcade.startGame(true); // not 9749, 9759, or 9789, 9819, It is 9803!!!!
})();
