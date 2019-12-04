"use strict";

import * as fs from "fs";
// import * as readline from "readline";
// const fs = require("fs");
// const readline = require("readline");
// import { once } from "events";
// import * as events from "events";
// const { once } = require("events");

// (async function day3() {
//   try {
//     const rl = readline.createInterface({
//       input: fs.createReadStream("input/day3.input"),
//       crlfDelay: Infinity
//     });

//     rl.on("line", (line) => {
//       console.log(line);
//     });

//     // await events.once(rl, "close");

//     for await (const line of rl) {
//       // Each line in input.txt will be successively available here as `line`.
//       console.log(`Line from file: ${line}`);
//     }
//     console.log("Hello?");
//   } catch (err) {
//     console.error(err);
//   }
// })();
interface Segment {
  direction: string;
  length: number;
}

interface Point {
  x: number;
  y: number;
}

const input = fs.readFileSync("input/day3.input", "utf-8");
const [wireA, wireB] = input
  .trim()
  .split("\n")
  .map((wireFormat: string) => (
    wireFormat
      .split(",")
      .map((segment) => ({
        direction: segment[0],
        length: Number.parseInt(segment.slice(1))
      }))
  ));

function setWireMapValue(currentPosition: any, currentPositionDistance: any, wireName: any) {

  let distance;
  let state;
  if (currentPosition === undefined && wireName === 'A') {
    state = 'A';
    distance = currentPositionDistance;

  } else if (currentPosition === undefined && wireName === 'B') {
    state = 'B';
    distance = currentPositionDistance;

  } else if (currentPosition !== undefined && currentPosition.state === 'A' && wireName === 'B') {
    state = 'intersection';
    distance = currentPosition.distance + currentPositionDistance;

  } else if (currentPosition !== undefined && currentPosition.state === 'A') {
    state = 'A overlapped';
    distance = currentPosition.distance;
  } else  if (currentPosition !== undefined && currentPosition.state === 'B') {
    state = 'B overlapped';
    distance = currentPosition.distance;
  }

  return {
    state,
    distance
  };
}

function getWireMap(wireSegments: Segment[], position: Point, distance: number, wireMap: any, wireName: string): any {
  if (wireSegments.length === 0) {
    return wireMap;
  }
  const nextPosition = {...position};
  const currentSegment = wireSegments[0];
  wireSegments.shift();
  switch(currentSegment.direction) {
    case "U":
      for (let i = 1; i <= currentSegment.length; i++) {
        const nextPoint = `${position.x},${position.y+i}`;
        wireMap[nextPoint] = setWireMapValue(wireMap[nextPoint], distance+i, wireName);
      }
      nextPosition.y += currentSegment.length;
      break;
    case "D":
      for (let i = 1; i <= currentSegment.length; i++) {
        const nextPoint = `${position.x},${position.y-i}`;
        wireMap[nextPoint] = setWireMapValue(wireMap[nextPoint], distance+i, wireName);
      }
      nextPosition.y -= currentSegment.length;
      break;
    case "R":
      for (let i = 1; i <= currentSegment.length; i++) {
        const nextPoint = `${position.x+i},${position.y}`;
        wireMap[nextPoint] = setWireMapValue(wireMap[nextPoint], distance+i, wireName);
      }
      nextPosition.x += currentSegment.length;
      break;
    case "L":
      for (let i = 1; i <= currentSegment.length; i++) {
        const nextPoint = `${position.x-i},${position.y}`;
        wireMap[nextPoint] = setWireMapValue(wireMap[nextPoint], distance+i, wireName);
      }
      nextPosition.x -= currentSegment.length;
      break;
  }

  return getWireMap(wireSegments, nextPosition, distance + currentSegment.length, wireMap, wireName);
}



const wireAMap = getWireMap(wireA, {x: 0, y: 0}, 0, {}, 'A');
// console.log(wireAMap);
// console.log(wireAMap);
// console.log(wireA.length);
// console.log(Object.keys(wireAMap).length);
// const wireAMap2 = getWireMap([{direction: "R", length: 1009}], {x:1009, y:0}, wireAMap, 'hello');
// console.log(wireAMap2[0]);
// console.log("STARTING WIRE B", wireB.slice(0,10));


const combinedWireMap = getWireMap(wireB, {x: 0, y: 0}, 0, wireAMap, 'B');
// console.log(wireB.length + Object.keys(wireAMap).length);
// console.log(Object.keys(combinedWireMap).length);

// console.log(combinedWireMap);

let uniqueValue: any = {};
console.log(Object.keys(combinedWireMap).map((key) => combinedWireMap[key]).forEach(value => uniqueValue[value] = true));
console.log(uniqueValue);

// console.log(Object.keys(combinedWireMap).join('|'));





// const intersections = Object.keys(combinedWireMap)
//   .filter((point) => (
//     combinedWireMap[point] === 2
//   ));


// console.log(intersections);
// console.log(intersections.map((point) => (
//   point.split(',').map((value) => Math.abs(Number.parseInt(value))).reduce((a,b) => a+b)
// )));



// SHOULD BE THE ANSWER
const intersections = Object.keys(combinedWireMap)
  .filter((point) => (
    combinedWireMap[point].state === 'intersection'
  ));

// console.log(combinedWireMap);
console.log(intersections);

const intersectionDistances = intersections
  .map((point) =>
    point.split(',').map((value) => Math.abs(Number.parseInt(value))).reduce((a,b) => a+b)
  );

const intersectionTraveledLengths = intersections
  .map((intersection) => (
    combinedWireMap[intersection].distance
  ));
  // .map((point) => ({
  //   point,
  //   distance: point.split(',').map((value) => Math.abs(Number.parseInt(value))).reduce((a,b) => a+b)
  // }));

// intersectionDistances.sort(function(a, b) {
//   if (a.distance < b.distance) {
//     return -1;
//   }
//   if (a.distance > b.distance) {
//     return 1;
//   }
//   return 0;
// });
// console.log(intersectionDistances.slice(0, 10));
const smallestManhattanDistance = Math.min(...intersectionDistances);
const smallestIntersectionTraveledLengths = Math.min(...intersectionTraveledLengths);

console.log(`Day 3 - Part 1: ${smallestManhattanDistance}`); // 721!!!!
console.log(`Day 3 - Part 2: ${smallestIntersectionTraveledLengths}`); //7388
