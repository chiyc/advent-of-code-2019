"use strict";

const moduleMasses: number[] = [
  137569, 146535, 74662, 133844, 99969, 86606, 76237, 52902, 106211, 141865, 50865, 101011, 75956, 67501, 142146, 107706, 83492, 137253, 56296, 141256, 118232, 127402, 67455, 64062, 72416, 109547, 106144, 54832, 57057, 74884, 80923, 85121, 60461, 92743, 134175, 65671, 90198, 134055, 59568, 146576, 134488, 130355, 54782, 51370, 55501, 56555, 62140, 99558, 80875, 113451, 71048, 64890, 94481, 87468, 148972, 81742, 79471, 100999, 106741, 142433, 130225, 58789, 134365, 81310, 102004, 92736, 105542, 63097, 92747, 109214, 103305, 143659, 68254, 126409, 71724, 50284, 125431, 132227, 125600, 99131, 96598, 101007, 123104, 82215, 97310, 135824, 117379, 81546, 109472, 85571, 89292, 109530, 127656, 56654, 132463, 101948, 118835, 59125, 116089, 61605
];

function calculateFuelRequirement(mass: number): number {
  return Math.floor(mass / 3) - 2;
}

const totalFuelRequirement = moduleMasses.reduce(function(total: number, mass: number): number {
  return total + calculateFuelRequirement(mass);
}, 0);

console.log(`Day 1 - Part 1: ${totalFuelRequirement} fuel requirement`); // 3219099

function calculateTrueFuelRequirement(mass: number): number {
  const fuelRequirement = calculateFuelRequirement(mass);
  if (fuelRequirement <= 0) {
    return 0;
  }
  return fuelRequirement + calculateTrueFuelRequirement(fuelRequirement);
}

const trueTotalFuelRequirement = moduleMasses.reduce(function(total: number, mass: number): number {
  return total + calculateTrueFuelRequirement(mass);
}, 0);

console.log(`Day 1 - Part 2: ${trueTotalFuelRequirement} true fuel requirement`); // 4825810
