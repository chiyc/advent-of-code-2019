import * as fs from 'fs';

const DELTA = 0.000001;

const asteroidMapInput = fs.readFileSync('input/day10.input', 'utf-8');

const asteroidGrid = asteroidMapInput
  .trim()
  .split('\n')
  .map((row) => (row.split('')));

const asteroidMap = asteroidGrid.reduce((map, row, y) => {
  return row.reduce((map, position, x) => {
    return position === '.'
      ? map
      : Object.assign(map, { [`${x},${y}`]: true });
  }, map);
}, {});

type StationCount = {
  station: string;
  numVisibleAsteroids: number;
};

const asteroidCoordList = Object.keys(asteroidMap);

const lineOfSightCounts: StationCount[] = asteroidCoordList
.filter((coord) => coord === '28,29')
.map((station) => {
  // For one station
  const [stationX, stationY] = coords(station);
  const stationIndex = asteroidCoordList.findIndex((a) => a === station);
  const otherAsteroids = asteroidCoordList.slice(0, stationIndex).concat(asteroidCoordList.slice(stationIndex+1)); // this list can be optimized? later if needed

  let examined: {[key: string]: boolean} = {};
  const numVisibleAsteroids = otherAsteroids.reduce((count: number, asteroid: string) => {
    const [x, y] = coords(asteroid);

    const slope = (y - stationY) / (x - stationX);
    const intercept = -slope*x + y;

    const inLineFromStation = otherAsteroids.filter((a) => {
      const [aX, aY] = coords(a);
      return !examined[a]
        && (
          (slope === Infinity || slope === -Infinity)
          ? aX === x && sign(y-stationY) === sign(aY-stationY)
          : (
            Math.abs(aX*slope + intercept - aY) < DELTA
            && sign(x-stationX) === sign(aX-stationX)
            && sign(y-stationY) === sign(aY-stationY)
          )
        );
    });
    // console.log(`From station ${station}, examining the following: `, inLineFromStation);
    // console.log(`Slope: ${slope}, Intercept: ${intercept}\n`);

    inLineFromStation.forEach((a) => { examined[a] = true; });
    return count + (inLineFromStation.length ? 1 : 0);
  }, 0);

  return {
    station,
    numVisibleAsteroids
  };
});

function coords(coordinateKey: string) {
  const coordinatePair = coordinateKey.split(',').map((integerString) => Number.parseInt(integerString));

  return coordinatePair;
}

function sign(n: number) {
  if (n - 0 < DELTA) {
    return 0;
  }
  return n < 0 ? -1 : 1;
}

console.log(`# of asteroids: ${asteroidCoordList.length}`);
console.log(lineOfSightCounts);

const stationWithMaxCounts = lineOfSightCounts.reduce((max: StationCount, station: StationCount) => {
  return station.numVisibleAsteroids > max.numVisibleAsteroids
    ? station
    : max
});

console.log(`Day 10 - Part 1: ${stationWithMaxCounts.numVisibleAsteroids} max asteroids visible from ${stationWithMaxCounts.station}`); // 340 from 28,29


// PART 2
const station = stationWithMaxCounts.station;
const stationIndex = asteroidCoordList.findIndex((a) => a === station);
const otherAsteroids = asteroidCoordList.slice(0, stationIndex).concat(asteroidCoordList.slice(stationIndex+1));

const [stationX, stationY] = coords(station);

type Orientation = {
  slope: number;
  asteroids: string[];
};

let examined: {[key: string]: boolean} = {};
const laserOrientation = otherAsteroids
.map((asteroid): Orientation => {
  const [x, y] = coords(asteroid);

    const slope = (y - stationY) / (x - stationX);
    const intercept = -slope*x + y;

    const inLineFromStation = otherAsteroids.filter((a) => {
      const [aX, aY] = coords(a);
      return !examined[a]
      && (
        (slope === Infinity || slope === -Infinity)
        ? aX === x && sign(y-stationY) === sign(aY-stationY)
        : (
          Math.abs(aX*slope + intercept - aY) < DELTA
          && sign(x-stationX) === sign(aX-stationX)
          && sign(y-stationY) === sign(aY-stationY)
        )
      );
    });
    inLineFromStation.forEach((a) => { examined[a] = true; });

    const sortedInLineAsteroids = inLineFromStation.sort((a, b) => {
      const [x_a, y_a] = coords(a);
      const [x_b, y_b] = coords(b);

      return Math.abs(x_a - stationX) + Math.abs(y_a - stationY) < Math.abs(x_b - stationX) + Math.abs(y_b - stationY)
        ? -1
        : 1;
    });

    // console.log('sorted inline asteroids from 28,29: ', sortedInLineAsteroids);

    return {
      slope,
      asteroids: sortedInLineAsteroids
    };
})
.filter((orientation: Orientation) => orientation.asteroids.length > 0)
.sort((a: Orientation, b: Orientation) => {
  const zoneA = zone(station, a.asteroids[0]);
  const [xA, yA] = coords(a.asteroids[0]);
  const zoneB = zone(station, b.asteroids[0]);
  const [xB, yB] = coords(b.asteroids[0]);
  const slopeA = (yA - stationY) / (xA - stationX);
  const slopeB = (yB - stationY) / (xB - stationX);

  if (zoneA !== zoneB) {
    return zoneA < zoneB ? -1 : 1;
  }

  return slopeA < slopeB ? -1 : 1;
});

function zone(origin: string, coord: string): number {
  const [oX, oY] = coords(origin);
  const [x, y] = coords(coord);

  if (x === oX && y < oY) return 0;
  if (x > oX && y < oY) return 1;
  if (x > oX && y === oY) return 2;
  if (x > oX && y > oY) return 3;
  if (x === oX && y > oY) return 4;
  if (x < oX && y > oY) return 5;
  if (x < oX && y === oY) return 6;

  return 7;
}

let blastedAsteroids = [];
let laserIndex = 0;
while (blastedAsteroids.length < 200) {
  if (laserOrientation[laserIndex].asteroids.length > 0) {
    const blastedAsteroid = laserOrientation[laserIndex].asteroids.shift();
    blastedAsteroids.push(blastedAsteroid);
    laserIndex = (laserIndex + 1) % laserOrientation.length;
  }
}
console.log(`Day 10 - Part 2: ${blastedAsteroids[199]} is the 200th asteroid`); // 26,28
