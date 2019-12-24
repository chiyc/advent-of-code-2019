import * as fs from 'fs';

const deckSize = 10007;
// const deckSize = 10;
const startingDeck = Array(deckSize).fill(undefined)
  .map((_, idx) => {
    return idx;
  });

// console.log(startingDeck.slice(0,5));
type Shuffle = {
  mode: ShuffleMode;
  operator: number;
};
enum ShuffleMode {
  STACK,
  INCREMENT,
  CUT,
}
const shuffleInstructions: Shuffle[] = fs.readFileSync('input/day22.input', 'utf-8')
  .trim()
  .split('\n')
  .map((instr) => {
    if (instr === 'deal into new stack') {
      return { mode: ShuffleMode.STACK, operator: -1 }
    }
    if (instr.slice(0,3) === 'cut') {
      const operatorStr = instr.split(' ')[1];
      return { mode: ShuffleMode.CUT, operator: Number.parseInt(operatorStr) };
    }
    const operatorStr = instr.split('increment ')[1];
    return { mode: ShuffleMode.INCREMENT, operator: Number.parseInt(operatorStr) };
  });

let deck = startingDeck.slice();

shuffleInstructions.forEach((shuffle) => {
  console.log(deck);
  if (shuffle.mode === ShuffleMode.STACK) {
    deck.reverse();

  } else if (shuffle.mode === ShuffleMode.INCREMENT) {
    let newDeck = Array(deckSize).fill(undefined);
    const increment = shuffle.operator;
    for (let i = 0; i < deck.length; i++) {
      newDeck[i*increment % deck.length] = deck[i];
    }
    deck = newDeck;

  } else { // CUT
    const cut = shuffle.operator;
    deck = deck.slice(cut).concat(deck.slice(0,cut))
  }
});

console.log(deck);
console.log(deck.slice(2018,2021));
console.log(`Day 22 - Part 2: card 2019 in position ${deck.findIndex((c) => c === 2019)}`); // 6289

const part2DeckSize = 119315717514047;
// const deckSize = 10;
const startingDeck2 = Array(part2DeckSize).fill(undefined)
  .map((_, idx) => {
    return idx;
  });

console.log(startingDeck2.slice(0,10));
console.log(startingDeck2.slice(119315717514037));
