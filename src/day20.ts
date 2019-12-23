import * as fs from 'fs';

const donutMaze: string[] = fs.readFileSync('input/day20.input', 'utf-8')
  .split('\n');

type Location = {
  location: string;
  visited: boolean;
  adjacentLocations: string[];
  distanceFromStart: number;
}

function upFrom(r: number, c: number): string {
  const row = donutMaze[r-1] || '';
  return row.charAt(c);
}
function downFrom(r: number, c: number): string {
  const row = donutMaze[r+1] || '';
  return row.charAt(c);
}
function leftFrom(r: number, c: number): string {
  const row = donutMaze[r] || '';
  return row.charAt(c-1);
}
function rightFrom(r: number, c: number): string {
  const row = donutMaze[r] || '';
  return row.charAt(c+1);
}
function anyCellAroundHas(r: number, c: number, match: RegExp): boolean {
  return Boolean(upFrom(r,c).match(match)
    || downFrom(r,c).match(match)
    || leftFrom(r,c).match(match)
    || rightFrom(r,c).match(match));
}
function findCellThatHas(r: number, c: number, match: RegExp): [number, number] {
  if (upFrom(r, c).match(match)) return [r-1, c];
  if (downFrom(r, c).match(match)) return [r+1, c];
  if (leftFrom(r, c).match(match)) return [r, c-1];
  if (rightFrom(r, c).match(match)) return [r, c+1];

  return [-1, -1];
}
// function cellAt(r: number, c: number): string {
//   return donutMaze[r].charAt(c);
// }

function portalName(r: number, c: number): string {
  let p1 = donutMaze[r].charAt(c);
  let [p2r, p2c] = findCellThatHas(r, c, /[A-Z]/);
  if (p2r === -1) {
    console.log(`Couldn't find portal character adjacent to ${p1} at ${r},${c}`);
    process.exit(1);
  }
  let p2 = donutMaze[p2r].charAt(p2c);

  if (r < p2r) { return p1+p2; }
  if (r > p2r) { return p2+p1; }
  if (c < p2c) { return p1+p2; }
  return p2+p1;
}

let portals: {[name: string]: string[]} = {

};

donutMaze.forEach((row, r) => {
  row.split('').forEach((cell, c) => {
    if (cell.match(/[A-Z]/) && anyCellAroundHas(r, c, /\./)) {
      // console.log(`Cell ${r},${c} has letter ${cellAt(r, c)} and has . adjacent`);
      const portal = portalName(r, c);
      const [cr, cc] = findCellThatHas(r, c, /\./);
      portals[portal] = (portals[portal] || []).concat(`${cr},${cc}`);
    }
  });
});

const portalJumps: {[loc: string]: string} = Object.keys(portals).reduce((pairs: {[loc: string]: string}, key) => {
  const portalLocations = portals[key];
  if (portalLocations.length === 2) {
    pairs[portalLocations[0]] = portalLocations[1];
    pairs[portalLocations[1]] = portalLocations[0];
  }
  return pairs;
}, {});

// console.log(portals);
// console.log(portalJumps);

let donutMazeMap: {[loc: string]: Location} = {};

donutMaze.forEach((row, r) => {
  row.split('').forEach((cell, c) => {
    if (cell === '#' || cell === ' ') { return; }

    let locKey = `${r},${c}`;
    if (locKey === `37,116`) {
      console.log(`\n\n SETTING UP THE STARTING LOCATION \n\n\n`);
    }
    let location: Location = {
      location: locKey,
      visited: false,
      adjacentLocations: [],
      distanceFromStart: -1,
    }

    if (cell === '.' && anyCellAroundHas(r, c, /[A-Z]/)) { // is a portal location
      if (upFrom(r,c) === '.') { location.adjacentLocations.push(`${r-1},${c}`); }
      if (downFrom(r,c) === '.') { location.adjacentLocations.push(`${r+1},${c}`); }
      if (leftFrom(r,c) === '.') { location.adjacentLocations.push(`${r},${c-1}`); }
      if (rightFrom(r,c) === '.') { location.adjacentLocations.push(`${r},${c+1}`); }

      if (portalJumps[`${r},${c}`]) {
        location.adjacentLocations.push(portalJumps[`${r},${c}`]);
      }

      donutMazeMap[locKey] = location;
      return;
    }

    if (cell === '.') {
      if (upFrom(r,c) === '.') { location.adjacentLocations.push(`${r-1},${c}`); }
      if (downFrom(r,c) === '.') { location.adjacentLocations.push(`${r+1},${c}`); }
      if (leftFrom(r,c) === '.') { location.adjacentLocations.push(`${r},${c-1}`); }
      if (rightFrom(r,c) === '.') { location.adjacentLocations.push(`${r},${c+1}`); }

      donutMazeMap[locKey] = location;
      return;
    }
  });
});

// console.log(donutMazeMap);

const startingLocation: string = portals['AA'][0];
console.log(`Starting location is ${startingLocation}`);
const endingLocation: string = portals['ZZ'][0];
console.log(`Ending location is ${endingLocation}`);

donutMazeMap[startingLocation].distanceFromStart = 0;

function findZZ(start: string) {
  // console.log(`Traversing from ${start}`);
  const currentLoc = donutMazeMap[start];

  const nextLocations = currentLoc.adjacentLocations.filter((loc) => {
    return !donutMazeMap[loc].visited
      || (donutMazeMap[loc].distanceFromStart !== -1 && donutMazeMap[loc].distanceFromStart > currentLoc.distanceFromStart+1)
  });

  nextLocations.forEach((loc) => {
    donutMazeMap[loc].distanceFromStart = currentLoc.distanceFromStart + 1;
    donutMazeMap[loc].visited = true;
    findZZ(loc);
  });
}

findZZ(startingLocation);

console.log(`Day 20 - Part 1: ${donutMazeMap[endingLocation].distanceFromStart} steps from AA`); // 560 steps




// PART 2

(function day20Part2(){

  function isInnerPortal(r: number, c: number): boolean {
    return Boolean(
      r >= 3 && r < donutMaze.length-3
      && c >= 3 && c < donutMaze[3].length-3
    );
  }

  function isPortal(coord: string): boolean {
    return typeof portalJumps[coord] === 'string';
  }

  const startingLocation: string = portals['AA'][0];
  console.log(`Starting location is ${startingLocation}`);

  const endingLocation: string = portals['ZZ'][0];
  console.log(`Ending location is ${endingLocation}`);

  donutMazeMap[`${startingLocation},0`] = {
    location: `${startingLocation},0`,
    visited: false,
    adjacentLocations: donutMazeMap[startingLocation].adjacentLocations,
    distanceFromStart: 0,
  }

  let donutVisited: {[loc: string]: boolean} = {};
  function findZZ2(start: string) {
    if (donutMazeMap[`${endingLocation},0`] && donutMazeMap[`${endingLocation},0`].distanceFromStart !== -1) {
      console.log(`Found ZZ!`);
      return;
    }
    console.log(`(${start})`);
    donutVisited[start] = true;

    const locPieces = start.split(',');
    const startLoc = locPieces.slice(0,2).join(',');
    const level = Number.parseInt(locPieces[2]);

    const adjacentLocationsWithLevels: string[] = donutMazeMap[startLoc].adjacentLocations.reduce((all: string[], loc: string) => {
      const [r, c] = loc.split(',');
      if (!isPortal(loc)) {
        const locWithLevel = `${loc},${level}`;
        if (!donutMazeMap[locWithLevel]) {
          donutMazeMap[locWithLevel] = {
            location: locWithLevel,
            visited: false,
            adjacentLocations: donutMazeMap[loc].adjacentLocations,
            distanceFromStart: -1,
          };
        }
        return all.concat(locWithLevel);
      }

      if (!isInnerPortal(Number.parseInt(r), Number.parseInt(c)) && level === 0) {
        return all;
      }

      const nextLevel = isInnerPortal(Number.parseInt(r), Number.parseInt(c))
        ? level + 1
        : level - 1;
      const locWithLevel = `${portalJumps[loc]},${nextLevel}`
      if (!donutMazeMap[locWithLevel]) {
        donutMazeMap[locWithLevel] = {
          location: locWithLevel,
          visited: false,
          adjacentLocations: donutMazeMap[portalJumps[loc]].adjacentLocations,
          distanceFromStart: -1,
        };
      }
      return all.concat(locWithLevel);
    },[]);

    const nextLocations = adjacentLocationsWithLevels.filter((locWithLevel) => {
      return !donutVisited[locWithLevel]
        || (donutMazeMap[locWithLevel].distanceFromStart !== -1 && donutMazeMap[locWithLevel].distanceFromStart > donutMazeMap[start].distanceFromStart+1)
    });

    nextLocations.forEach((loc) => {
      donutMazeMap[loc].distanceFromStart = donutMazeMap[start].distanceFromStart + 1;
      donutMazeMap[loc].visited = true;
      findZZ2(loc);
    });
  }

  let terminationClause = !donutMazeMap[`${endingLocation},0`] || donutMazeMap[`${endingLocation},0`].distanceFromStart === -1;
  while (terminationClause) {

  }

  findZZ2(`${startingLocation},0`)
  console.log(`Day 20 - Part 2: ${donutMazeMap[`${endingLocation},0`].distanceFromStart} steps from AA`); // 560 steps
}());
