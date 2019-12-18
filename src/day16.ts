let day16Input = '59787832768373756387231168493208357132958685401595722881580547807942982606755215622050260150447434057354351694831693219006743316964757503791265077635087624100920933728566402553345683177887856750286696687049868280429551096246424753455988979991314240464573024671106349865911282028233691096263590173174821612903373057506657412723502892841355947605851392899875273008845072145252173808893257256280602945947694349746967468068181317115464342687490991674021875199960420015509224944411706393854801616653278719131946181597488270591684407220339023716074951397669948364079227701367746309535060821396127254992669346065361442252620041911746738651422249005412940728'
  .split('')
  .map((s) => Number.parseInt(s));

day16Input = '03036732577212944063491565474664'
  .split('')
  .map((s) => Number.parseInt(s));

// day16Input = '80871224585914546619083218645595' // part 1
//   .split('')
//   .map((s) => Number.parseInt(s));

const basePattern = [0, 1, 0, -1];
// 123456789
// 0123456789

// 1230123012 0+1=1
// 0112233001 1+1=2
// 0011122233 2+1=3
//            d

function expandPattern(pattern: number[], repeat: number=1): number[] {
  let expandedPattern: number[] = [];
  pattern.forEach((n) => {
    Array(repeat).fill('').forEach(() => expandedPattern.push(n));
  });
  return expandedPattern;
}

console.log(expandPattern(basePattern, 2));

function runPhase(input: number[], basePattern: number[], inputRepeat=1) {
  let output: number[] = [];
  let totalInputLength = input.length*inputRepeat;

  for (let d=0; d < totalInputLength; d++) {
    // let expandedPattern = expandPattern(basePattern, d+1);

    let digitSum = 0;
    for (let i=0; i < totalInputLength; i++) {
      let inputDigit = input[i%input.length];
      let patternIndex = Math.trunc((i+1)/(d+1))%basePattern.length
      let patternDigit = basePattern[patternIndex];
      if (patternDigit === 0) {
        i += i === 0 ? (d-1) : (d);
        continue;
      }

      digitSum += (inputDigit * patternDigit)
      if (digitSum > 0) { digitSum %= 10; }
    }
    // let digitNumber = Array(totalInputLength).fill('')
    //   .reduce((o,_,idx) => {

    //     // return o + input[idx%totalInputLength] *
    //     return o + inputDigit * patternDigit;
    //   }, 0);
    const lastDigit = Number.parseInt(`${digitSum}`.slice(`${digitSum}`.length-1));
    output.push(lastDigit);
    // console.log(`d=${d}, digit=${lastDigit}, sum=${digitSum}`);
  }

  return output;
}

let part1NumPhases = 100;
let day16Part1 = Array(part1NumPhases).fill('')
  .reduce((phaseOutput: number[]) => {
    return runPhase(phaseOutput, basePattern);
  }, day16Input)
  .slice(0,8)
  .join('');

console.log(`Day 16 - Part 1: ${day16Part1}`); // 42945143

// PART 2

let part2NumPhases = 100;
let messageOffset: number = Number.parseInt(day16Input.slice(0,7).join(''));
let day16Part2 = Array(part2NumPhases).fill('')
  .reduce((phaseOutput: number[], _, idx) => {
    console.log(`Running phase ${idx+1}`);
    return runPhase(phaseOutput, basePattern, 10000);
  }, day16Input)
  .slice(messageOffset,messageOffset+8)
  .join('');

console.log(`Day 16 - Part 2: ${day16Part2}`); // 42945143
