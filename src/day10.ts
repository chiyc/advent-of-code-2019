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

const asteroidCoordList = Object.keys(asteroidMap);

const lineOfSightCounts: {station: string, visibleFromStation: number}[] = asteroidCoordList.map((station, idx) => {

  // For one station
  const [stationX, stationY] = coords(station);

  const otherAsteroids = asteroidCoordList.slice(0, idx).concat(asteroidCoordList.slice(idx+1)); // this list can be optimized? later if needed

  let examined: {[key: string]: boolean} = {};
  const visibleFromStation = otherAsteroids.reduce((count: number, asteroid: string) => {
    const [x, y] = coords(asteroid);

    const slope = (stationY - y) / (stationX - x); // vertical lines are not handled
    const intercept = -slope*x + y;

    // does not differentiate asteroids in the other direction
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
          ) // probably needs a new condition here. Fitting on the line is not enough. We need directionality
        );
    });
    console.log(`From station ${station}, examining the following: `, inLineFromStation);
    console.log(`Slope: ${slope}, Intercept: ${intercept}\n`);

    inLineFromStation.forEach((a) => { examined[a] = true; });

    return count + (inLineFromStation.length ? 1 : 0);
    // conditions for incrementing count or not
    // if (inLineFromStation.length < 2) {
    //   return count + inLineFromStation.length;
    // }
    // // find the closest asteroid
    // return inLineFromStation
    //   .reduce((closest, a) => {
    //     const [cX, cY] = coords(closest);
    //     const cDistance = Math.abs(cY-y)*Math.abs(cY-y) + Math.abs(cX-x)*Math.abs(cX-x);
    //     const [aX, aY] = coords(a);
    //     const aDistance = Math.abs(aY-y)*Math.abs(aY-y) + Math.abs(aX-x)*Math.abs(aX-x);

    //     return aDistance < cDistance
    //       ? a
    //       : closest;
  }, 0);

  return {
    station,
    visibleFromStation
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

console.log(`Day 10 - Part 1: ${Math.max(...lineOfSightCounts.map(c => c.visibleFromStation))} max asteroids visible`); // 340
