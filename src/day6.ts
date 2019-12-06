'use strict';
import * as fs from 'fs';

const day6Input = fs.readFileSync('input/day6.input', 'utf-8');

const orbitPairs: Array<OrbitPair> = day6Input
  .trim()
  .split('\n')
  .map((orbitCode) => {
    const [mass, satellite] = orbitCode.split(')');
    return [mass, satellite];
  });

type OrbitPair = [string, string];
type OrbitMap = {
  [orbitedMass: string]: string[]
};

const directOrbitMap = orbitPairs
  .reduce((orbitMap: OrbitMap, orbitPair: OrbitPair) => {
    const [orbitedMass, satellite] = orbitPair;
    orbitMap[orbitedMass] = orbitMap[orbitedMass] ? orbitMap[orbitedMass].concat([satellite]) : [satellite];
    return orbitMap;
  }, {});

const numDirectOrbits = Object.keys(directOrbitMap)
  .reduce((sum, orbitedMass) => {
    return sum + directOrbitMap[orbitedMass].length
  }, 0);

const indirectOrbitMap = Object.keys(directOrbitMap)
  .reduce((orbitMap: OrbitMap, orbitedMass: string) => {
    const directOrbits = directOrbitMap[orbitedMass] || [];
    const indirectOrbits: string[] = [];

    findIndirectOrbits(directOrbits, directOrbits, indirectOrbits);

    orbitMap[orbitedMass] = indirectOrbits;
    return orbitMap;
  }, {});

function findIndirectOrbits(nextMasses: string[], directOrbits: string[], indirectOrbits: string[]) {
  if (nextMasses.length === 0) {
    return;
  }
  for (let idx in nextMasses) {
    const mass = nextMasses[idx];
    if (!directOrbits.find((m) => m === mass) && !indirectOrbits.find((m) => m === mass)) {
      indirectOrbits.push(mass);
    }
    findIndirectOrbits(directOrbitMap[mass] || [], directOrbits, indirectOrbits);
  }
}

const numIndirectOrbits = Object.keys(indirectOrbitMap)
  .reduce((sum, orbitedMass) => {
    return sum + indirectOrbitMap[orbitedMass].length
  }, 0);

// console.log(indirectOrbitMap);
console.log(`Direct Orbits: ${numDirectOrbits}`); // 1240
console.log(`Indirect Orbits: ${numIndirectOrbits}`); // 156850
console.log(`Total: ${numDirectOrbits + numIndirectOrbits}\n`); // 158090

const transferOrbits = Object.keys(directOrbitMap)
  .reduce((transferOrbits: string[], orbitedMass) => {
    const orbitedMassConnectsSANYOU: boolean = Boolean(
      (indirectOrbitMap[orbitedMass].find((m) => m === 'YOU') || directOrbitMap[orbitedMass].find((m) => m === 'YOU'))
        && (indirectOrbitMap[orbitedMass].find((m) => m === 'SAN') || directOrbitMap[orbitedMass].find((m) => m === 'SAN'))
    );
    if (orbitedMassConnectsSANYOU) {
      transferOrbits.push(orbitedMass);
    }
    return transferOrbits;
  }, []);

const numTransfers = transferOrbits
  .map((connectionMass) => {
    const directOrbits = directOrbitMap[connectionMass];
    return directOrbits.map((mass) => {
      return distanceToSANorYOU(mass);
    })
    .reduce((sum, distance) => distance + sum);
  });

function distanceToSANorYOU(mass: string, transfers=0): number {
  if (mass === 'SAN' || mass === 'YOU') {
    return transfers;
  }
  const nextStations = directOrbitMap[mass];
  if (nextStations === undefined) {
    return 0;
  }
  const nextDistances = nextStations
    .map((nextMass) => {
      return distanceToSANorYOU(nextMass, transfers + 1);
    });

  return nextDistances.reduce((sum, distance) => sum + distance);
}

// console.log(Math.min(...numTransfers));
console.log(`Day 6 Part 2 - ${Math.min(...numTransfers)} transfers`); // 241 transfers
