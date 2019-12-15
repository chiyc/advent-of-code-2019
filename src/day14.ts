import * as fs from 'fs';

type Reaction = {
  product: string;
  productAmount: number;
  reactants: Reactant[];
}

type Reactant = {
  name: string;
  amount: number;
}

const reactions: {[product: string]: Reaction} = fs.readFileSync('input/day14.test', 'utf-8')
  .trim()
  .split('\n')
  .reduce((reactionMap: {[product: string]: Reaction}, reactionStr) => {
    const [reactantsStr, productsStr] = reactionStr.split('=>');

    const [productAmount, productName] = productsStr.trim().split(' ');
    const reactants: Reactant[] = reactantsStr
      .trim()
      .split(',')
      .map((reactantStr) => {
        const [amount, name] = reactantStr.trim().split(' ');
        return {
          name,
          amount: Number.parseInt(amount)
        };
      });

    const reaction: Reaction = {
      product: productName,
      productAmount: Number.parseInt(productAmount),
      reactants
    };
    reactionMap[productName] = reaction;

    return reactionMap;
  }, {});

// console.log(reactions);

let primaryFuelRequirements: any = {};
let leftoverCompound: any = {};

function getPrimaryFuelRequirements(compound: string, amount: number): number {
  console.log(`Finding ore requirement for ${amount} ${compound}`);

  if (compound === 'ORE') {
    return amount;
  }
  const reaction = reactions[compound];
  const reactants = reaction.reactants;
  // if (reactants.length === 1 && reactants[0].name === 'ORE') {

  //   primaryFuelRequirements[compound] = primaryFuelRequirements[compound]
  //     ? primaryFuelRequirements[compound] + amount
  //     : amount;
  //   return;
  // }

  let oreNeeded = 0;
  for (let r = 0; r < reactants.length; r++) {
    // const currentProductAmountWithLeftover = amount + (leftoverCompound[compound] || 0)
    const numReactionsNeeded = Math.ceil(amount / reaction.productAmount);
    const reactantAmountNeeded = numReactionsNeeded * reactants[r].amount;
    leftoverCompound[reactants[r].name] = 0;

    const leftoverProductAmount = numReactionsNeeded * reaction.productAmount - amount
    leftoverCompound[compound] = leftoverCompound[compound] === undefined
      ? leftoverProductAmount
      : leftoverCompound[compound] + leftoverProductAmount;
    console.log(leftoverCompound);

    // primaryFuelRequirements[reactants[r].name] = primaryFuelRequirements[reactants[r].name]
    //   ? primaryFuelRequirements[reactants[r].name] + amount
    //   : amount;

    oreNeeded += getPrimaryFuelRequirements(reactants[r].name, reactantAmountNeeded);
  }

  return oreNeeded;
}

const oreRequirements = getPrimaryFuelRequirements('FUEL', 1);

// const oreRequirements = Object.keys(primaryFuelRequirements).reduce((ore, compound) => {
//   const compoundOreRequirement = Math.ceil(primaryFuelRequirements[compound]/reactions[compound].productAmount) * reactions[compound].reactants[0].amount;

//   console.log(`${compoundOreRequirement} required to make ${primaryFuelRequirements[compound]} units of ${compound}`);
//   return ore + compoundOreRequirement;
// }, 0);

console.log(`Day 14 - Part 1: ${oreRequirements} ore needed`); // 264032382979 too high
// 610210 also too high??
// test is wrong: 182966
console.log(primaryFuelRequirements);
console.log(leftoverCompound);
