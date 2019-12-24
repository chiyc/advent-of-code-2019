let bugStart = `..##.
#....
.....
#.#.#
#..#.`;

// bugStart = `....#
// #..#.
// #..##
// ..#..
// #....`;

let bugRows = bugStart.split('\n');
console.log(bugRows);

let state = bugRows.join('\n');
let seenState: {[state: string]: boolean} = {};
seenState[state] = true;

let minutesElapsed = 0;
let minutes = 5;
// console.log(bugRows.join('\n')+'\n');
while (minutesElapsed++ < Infinity) {
  bugRows = bugRows.map((row, r, bugs) => {
    return row.split('').map((cell, c) => {
      let isBug = cell === '#';

      let n = (bugs[r-1] || '').charAt(c);
      let s = (bugs[r+1] || '').charAt(c);
      let w = (bugs[r] || '').charAt(c-1);
      let e = (bugs[r] || '').charAt(c+1);
      const adjacentBugCount = `${n}${s}${w}${e}`.split('#').length - 1;

      let nextState;
      if (isBug) {
        nextState = adjacentBugCount === 1
          ? '#'
          : '.';
      } else { // isEmpty
        nextState = adjacentBugCount === 1 || adjacentBugCount === 2
          ? '#'
          : '.';
      }

      // console.log(`${cell} at ${r},${c} is becoming ${nextState} from ${adjacentBugCount} adjacent bug count from |${n}-${s}-${w}-${e}|`);
      return nextState;
    }).join('');
  });
  state = bugRows.join('\n');
  if (seenState[state]) {
    console.log(`This state has been seen before!`);
    console.log(state);
    break;
  } else {
    seenState[state] = true;
  }
  console.log(bugRows.join('\n')+'\n');
}

const biodiversityRating = bugRows.join('').split('').reduce((rating, cell, idx) => {
  return cell === '#'
    ? rating + Math.pow(2,idx)
    : rating;
}, 0);

console.log(`Day 24 - Part 1: ${biodiversityRating} rating`); // 19923473
