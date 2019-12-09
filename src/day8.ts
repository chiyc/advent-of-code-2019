import * as fs from 'fs';

const imageInput = fs.readFileSync('input/day8.input', 'utf-8');

const imageDigits = imageInput.trim().split('');

const imageWidth = 25;
const imageHeight = 6;

const numPixelsPerImage = imageWidth * imageHeight;

type DigitCounts = {
  [digit: string]: number;
};

const layerDigits = imageDigits.reduce((layers: string[][], digit: string, idx: number) => {
  const layerIndex = Math.floor(idx / numPixelsPerImage);
  const layer = layers[layerIndex] || [];

  const updatedLayer = layer.slice();
  updatedLayer.push(digit);

  const updatedLayers = layers.slice();
  updatedLayers[layerIndex] = updatedLayer;

  return updatedLayers;
}, []);

const layerDigitCounts = layerDigits.map((layer: string[]) => (
  layer.reduce((digitCounts: DigitCounts, digit: string) => {
    digitCounts[digit] = digitCounts[digit] === undefined ? 1 : digitCounts[digit] + 1;
    return digitCounts
  }, {})
));

const layerWithFewestZeroes = layerDigitCounts.reduce((layerWithFewestZeroes: DigitCounts, layer: DigitCounts) => {
  return layer['0'] < layerWithFewestZeroes['0']
    ? layer
    : layerWithFewestZeroes;
});
console.log(`Day 8 - Part 1: ${layerWithFewestZeroes['1']*layerWithFewestZeroes['2']}`); // 2460

function colorAtPixel(layerDigits: string[][], position: number) {
  return layerDigits.reduce((visibleColor, layer) => {
    const currentColor = layer[position];
    return visibleColor !== '2'
      ? visibleColor
      : currentColor;
  }, '2');
}

let finalImage = '';
for (let pixel = 0; pixel < numPixelsPerImage; pixel++) {
  if (pixel / imageWidth === Math.floor(pixel / imageWidth)) {
    finalImage += '\n';
  }
  finalImage += colorAtPixel(layerDigits, pixel);
}

console.log(finalImage);
/* Day 8 Part 2 Image (reads LRFKU)
1000011100111101001010010
1000010010100001010010010
1000010010111001100010010
1000011100100001010010010
1000010100100001010010010
1111010010100001001001100
*/
