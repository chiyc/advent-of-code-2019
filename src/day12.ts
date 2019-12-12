import * as fs from 'fs';

enum Axis {
  X=0,
  Y=1,
  Z=2,
}

const initialMoonPositions = fs.readFileSync('input/day12.input', 'utf-8')
  .trim()
  .split('\n')
  .map((moonCoords) => {
    const coordValues = moonCoords
      .replace(/[<>]/g,'')
      .split(',')
      .map((coord) => {
        return Number.parseInt(coord
          .trim()
          .split('=')[1]
        );
      });
    return coordValues;
  });

const moons = initialMoonPositions.slice().map((m) => m.slice());
const moonVelocities = moons.map(() => [0,0,0]);

let t = 0;
const maxTime = 1000;

// EXPERIMENTAL WORK
// let x0 = [13], y0 = [9], z0 = [5];
// let x1 = [8], y1 = [14], z1 = [-2];
// let x2 = [-5], y2 = [4], z2 = [11];
// let x3 = [2], y3 = [-6], z3 = [1];

// let m0 = {
//   x: x0,
//   vx: 0,
//   ox: [x1, x2, x3],
//   y: y0,
//   vy: 0,
//   oy: [y1, y2, y3],
//   z: z0,
//   vz: 0,
//   oz: [z1, z2, z3]
// };

// EXPERIMENTAL WORK END

while (t++ < maxTime) {
  for (let m = 0; m < moons.length; m++) {
    const moon = moons[m].slice();
    const moonVelocity = moonVelocities[m];

    moonVelocity[Axis.X] += moons.reduce((adjustment, om, idx) => idx === m ? adjustment : adjustment + adjustAxisVelocity(moon[Axis.X], om[Axis.X]), 0);
    moonVelocity[Axis.Y] += moons.reduce((adjustment, om, idx) => idx === m ? adjustment : adjustment + adjustAxisVelocity(moon[Axis.Y], om[Axis.Y]), 0);
    moonVelocity[Axis.Z] += moons.reduce((adjustment, om, idx) => idx === m ? adjustment : adjustment + adjustAxisVelocity(moon[Axis.Z], om[Axis.Z]), 0);
  }

  for (let m = 0; m < moons.length; m++) {
    for (let ax = 0; ax < 3; ax++) {
      moons[m][ax] += moonVelocities[m][ax];
    }
  }
}

function adjustAxisVelocity(originCoord: number, satelliteCoord: number) {
  if (originCoord === satelliteCoord) return 0;
  return originCoord < satelliteCoord ? 1 : -1;
}

console.log(moons);
console.log(moonVelocities);

const potentialE = moons.map((m) => m.reduce((sum, c) => sum+Math.abs(c), 0));
const kineticE = moonVelocities.map((m) => m.reduce((sum, c) => sum+Math.abs(c), 0));

let totalEnergy = 0;
for (let m = 0; m < moons.length; m++) {
  totalEnergy += potentialE[m] * kineticE[m];
}

console.log(`Day 12 - Part 2: ${totalEnergy} Total System Energy`); // 6490

// PART 2

// const moonsP2 = initialMoonPositions.slice().map((m) => m.slice());
// const moonVelocitiesP2 = moons.map(() => [0,0,0]);

// t = 0;
// const initialState = JSON.stringify(moonsP2)+JSON.stringify(moonVelocitiesP2);
// // let otherMoons;
// let moon: number[];
// let moonVelocity: number[];

// const NUM_MOONS = 4;

// let m: number, ax: number;
// while (t++ >= 0 /*&& t < maxTime*/) {
// // while (t++ < maxTime) {
//   for (m = 0; m < NUM_MOONS; m++) {
//     moon = moonsP2[m];
//     moonVelocity = moonVelocitiesP2[m];

//     moonVelocity[Axis.X] += moonsP2.reduce((adjustment, om, idx) => idx === m ? adjustment : adjustment + adjustAxisVelocity(moon[Axis.X], om[Axis.X]), 0);
//     moonVelocity[Axis.Y] += moonsP2.reduce((adjustment, om, idx) => idx === m ? adjustment : adjustment + adjustAxisVelocity(moon[Axis.Y], om[Axis.Y]), 0);
//     moonVelocity[Axis.Z] += moonsP2.reduce((adjustment, om, idx) => idx === m ? adjustment : adjustment + adjustAxisVelocity(moon[Axis.Z], om[Axis.Z]), 0);
//   }

//   for (m = 0; m < NUM_MOONS; m++) {
//     for (ax = 0; ax < 3; ax++) {
//       moonsP2[m][ax] += moonVelocitiesP2[m][ax];
//     }
//   }

//   if (moonsP2[0][0]+moonsP2[0][1]+moonsP2[0][2] === 0 && JSON.stringify(moonsP2)+JSON.stringify(moonVelocitiesP2) === initialState) {
//     console.log('matching states!');
//     console.log(moonsP2);
//     console.log(moonVelocitiesP2);
//     break;
//   }
//   console.log(`current iteration: ${t}`);
// }

// console.log(`Day 12 - Part 2: ${t} steps until repeat state`); // 6490
/*


AVX += (AVX === BVX ? 0 : AVX < BVX ? 1 : -1)

moonB
moonC
moonD

pairs
// X axis
if (moons[0][0] !== moons[1][0]) {

}

// Y axis

// Z axis
01
02
03
12
13
23

what does one moon need to know in order to update?

to update its x velocity, it needs the x positions of all other moons
to update its y velocity, it needs the y positions of all other moons
to update its z velocity, it needs the z positions of all other moons;

then it can update its positions
so rather than hold things in each moon, maybe we hold things by axes

Is it faster to hold references?

x_values = [5, 7, 2, 3];

or..
x = 4;
other_x = [3, 4, 2];

x_vel_adj =

x_vel_adj = [];

y_values = [-1, -5, 4, 3];
z_values = [4, 6, 1, 0];

*/
