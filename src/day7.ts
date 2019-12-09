import * as fs from 'fs';

enum Mode {
  Position = '0',
  Immediate = '1',
}

enum ExitType {
  Feedback,
  Halt,
  LastInstruction,
}

type Exit = {
  exitType: ExitType;
  lastPosition: number;
};

function runAmplifierStage(instructions: string[], position: number, inputs: string[], outputs: string[], feedbackMode = false): Exit {
  const opCodeRaw: string = instructions[position];
  if (opCodeRaw === undefined) {
    console.log('raw undefined input: ', inputs);
    console.log('raw undefined position: ', position);
  }
  const opCodeWithModes: string = opCodeRaw.padStart(2, '0');
  const opCode: string = opCodeWithModes.slice(-2);
  const modes: string[] = opCodeWithModes.slice(0,-2).padStart(3, '0').split('').reverse();

  console.log(`OpCode: ${opCode} - Modes: ${JSON.stringify(modes)}`);

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
  const parameterB = Number.parseInt(instructions[position+2]);
  const target = instructions[position+3];

  let newPosition = position;
  if (opCode === '01') {
    const operandA = modes[0] === Mode.Position ? instructions[parameterA] : instructions[position+1];
    const operandB = modes[1] === Mode.Position ? instructions[parameterB] : instructions[position+2];
    newInstructions[Number.parseInt(target)] = `${Number.parseInt(operandA) + Number.parseInt(operandB)}`;
    newPosition += 4;
  }

  if (opCode === '02') {
    const operandA = modes[0] === Mode.Position ? instructions[parameterA] : instructions[position+1];
    const operandB = modes[1] === Mode.Position ? instructions[parameterB] : instructions[position+2];
    newInstructions[Number.parseInt(target)] = `${Number.parseInt(operandA) * Number.parseInt(operandB)}`;
    newPosition += 4;
  }

  if (opCode === '03') {
    // console.log('OPCODE 3!!!');
    if (feedbackMode && inputs.length === 0) {
      console.log('Exiting feedback due to output');
      return { exitType: ExitType.Feedback, lastPosition: position };
    }
    newInstructions[parameterA] = inputs[0];
    inputs.splice(0, 1);
    newPosition += 2;
  }

  if (opCode === '04') {
    outputs.push(modes[0] === Mode.Position ? instructions[parameterA] : String(parameterA));
    newPosition += 2;
    // if (feedbackMode) {
    //   // console.log('Exiting feedback due to output');
    //   return { exitType: ExitType.Feedback, lastPosition: newPosition }
    // }
  }

  if (opCode === '05') {
    const jumpCondition = modes[0] === Mode.Position ? instructions[parameterA] : String(parameterA);
    newPosition = Number.parseInt(jumpCondition) !== 0
      ? modes[1] === Mode.Position ? Number.parseInt(instructions[parameterB]) : parameterB
      : newPosition + 3;
  }

  if (opCode === '06') {
    const jumpCondition = modes[0] === Mode.Position ? instructions[parameterA] : String(parameterA);
    newPosition = Number.parseInt(jumpCondition) === 0
      ? modes[1] === Mode.Position ? Number.parseInt(instructions[parameterB]) : parameterB
      : newPosition + 3;
  }

  if (opCode === '07') {
    const operandA = modes[0] === Mode.Position ? instructions[parameterA] : instructions[position+1];
    const operandB = modes[1] === Mode.Position ? instructions[parameterB] : instructions[position+2];

    newInstructions[Number.parseInt(target)] = Number.parseInt(operandA) < Number.parseInt(operandB) ? '1' : '0';
    newPosition += 4;
  }

  if (opCode === '08') {
    const operandA = modes[0] === Mode.Position ? instructions[parameterA] : instructions[position+1];
    const operandB = modes[1] === Mode.Position ? instructions[parameterB] : instructions[position+2];

    newInstructions[Number.parseInt(target)] = Number.parseInt(operandA) === Number.parseInt(operandB) ? '1' : '0';
    newPosition += 4;
  }

  // console.log(`(${position}) [op: ${opCode}] [modes: ${modes.join('')}] ${parameterA} ${parameterB} ${position}`);
  return runAmplifierStage(newInstructions, newPosition, inputs, outputs, feedbackMode);
}

function permute(list: string[]): any {
  if (list.length === 0) {
    return [];
  }
  let result = [];
  for (let i = 0; i < list.length; i++) {
    const rest: string[] = list.slice(0,i).concat(list.slice(i+1));
    const restPermutations: any = permute(rest);
    if (rest.length === 0) {
      result.push([list[i]]);
    }

    for (let j = 0; j < restPermutations.length; j++) {
      const thisPermutation = [list[i]].concat(restPermutations[j]);
      result.push(thisPermutation);
    }
  }
  return result;
}

const amplifierSoftware = fs.readFileSync('input/day7.input', 'utf-8')
  .trim()
  .split(',');

// PART ONE
// const permutations = permute(['0', '1', '2', '3', '4']);
const phaseConfigurations = permute(['0','1', '2', '3', '4']);
// console.log(phaseConfigurations);

const amplifierThrusterOutputs = phaseConfigurations.map((configuration: string[]) => {

  let input = '0';
  let output: string[] = [];
  for (let p = 0;  p < 5; p++) {
    output = [];
    runAmplifierStage(amplifierSoftware, 0, [configuration[p], input], output);
    // console.log(output);
    input = output[output.length-1];
  }

  return Number.parseInt(input);
});

console.log(`Day 7 - Part 1 - Maximum Output: ${Math.max(...amplifierThrusterOutputs)}`); //273814

// PART TWO

const partTwoPhaseConfigurations = permute(['5','6','7','8','9']);

const partTwoThrusterOutputs = partTwoPhaseConfigurations.map((configuration: string[]) => {

  let startingPositions = [0, 0, 0, 0, 0];
  let nextInput = '0';
  let inputSet = [];
  let output: string[] = [];
  let ampEOutputs = [];

  let exit: Exit;

  let loop = 0;
  feedback:
  while (loop > -1) {
    for (let p = 0;  p < 5; p++) {
      output = [];
      inputSet = loop === 0 ? [configuration[p], nextInput] : [nextInput];

      console.log('next position: ', 'stage: ', p, ' ', startingPositions[p], inputSet);

      exit = runAmplifierStage(amplifierSoftware, startingPositions[p], inputSet, output, true);

      startingPositions[p] = exit.lastPosition;

      nextInput = output[output.length-1];
      if (p === 4) {
        ampEOutputs.push(nextInput);
      }
      if (p === 4 && (exit.exitType === ExitType.Halt || exit.exitType === ExitType.LastInstruction)) {
        break feedback;
      }
    }
    loop++;
  }

  console.log(ampEOutputs);
  return Number.parseInt(ampEOutputs[ampEOutputs.length-1]);
});

console.log(partTwoThrusterOutputs);
console.log(`Day 7 - Part 2 - Maximum Output: ${Math.max(...partTwoThrusterOutputs)}`); //34579864
