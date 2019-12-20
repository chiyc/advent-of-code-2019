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

const reactions: {[product: string]: Reaction} = fs.readFileSync('input/day14.input', 'utf-8')
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

// let primaryFuelRequirements: any = {};
let leftoverCompound: any = {};

function getPrimaryFuelRequirements(compound: string, amount: number): number {
  if (compound === 'ORE') {
    return amount;
  }
  // console.log(`Finding ore requirement for ${amount} ${compound}`);
  const reaction = reactions[compound];
  const reactants = reaction.reactants;
  // if (reactants.length === 1 && reactants[0].name === 'ORE') {

  //   primaryFuelRequirements[compound] = primaryFuelRequirements[compound]
  //     ? primaryFuelRequirements[compound] + amount
  //     : amount;
  //   return;
  // }

  let oreNeeded = 0;

  const productNeededAfterUsingLeftover = amount // (leftoverCompound[compound] || 0);
  let numReactionsNeeded = Math.ceil(productNeededAfterUsingLeftover / reaction.productAmount);


  leftoverCompound[compound] = leftoverCompound[compound] === undefined
    ? numReactionsNeeded*reaction.productAmount - amount
    : leftoverCompound[compound] + numReactionsNeeded*reaction.productAmount - amount;

  if (leftoverCompound[compound] >= reaction.productAmount) {
    // console.log('Have extra product! **&Q938E #Q(R* SA(*');
    numReactionsNeeded--;
    leftoverCompound[compound] -= reaction.productAmount;
  }

  for (let r = 0; r < reactants.length; r++) {
    // leftoverCompound[compound] = 0;

    // console.log(`${numReactionsNeeded} reactions needed to create ${productNeededAfterUsingLeftover} ${compound}`);
    const reactantAmountNeeded = numReactionsNeeded * reactants[r].amount;

    // primaryFuelRequirements[reactants[r].name] = primaryFuelRequirements[reactants[r].name]
    //   ? primaryFuelRequirements[reactants[r].name] + amount
    //   : amount;
    // console.log(leftoverCompound);
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

console.log(`Day 14 - Part 1: ${oreRequirements} ore needed`); // 248794!!
// 610210 also too high??
// test is wrong: 182966

const maxFuelPossible = 4906796;
const part2OreForFuel = getPrimaryFuelRequirements('FUEL', maxFuelPossible);
console.log(`Day 14 - Part 2: ${part2OreForFuel} ore for ${maxFuelPossible}`); // 4019390 too low, 4906796 is the right answer

// console.log(primaryFuelRequirements);
// console.log(leftoverCompound);
