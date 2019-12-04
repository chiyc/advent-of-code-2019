"use strict";

import * as fs from "fs";
interface Segment {
  direction: string;
  length: number;
}

interface Point {
  x: number;
  y: number;
}

enum Direction {
  Up = "U",
  Down = "D",
  Left = "L",
  Right = "R",
}

enum Wire {
  A,
  B,
}

enum WirePositionState {
  A,
  B,
  Intersected,
}

interface WireMap {
  [position: string]: WireMapPosition
}
interface WireMapPosition {
  state: WirePositionState;
  distance: number;
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

function setWireMapValue(currentPosition: WireMapPosition | undefined, currentPositionDistance: number, wireName: Wire): WireMapPosition {
  let distance;
  let state;

  if (currentPosition === undefined) {
    state = wireName === Wire.A ? WirePositionState.A : WirePositionState.B;
    distance = currentPositionDistance;
  } else if (currentPosition.state === WirePositionState.A && wireName === Wire.A) {
    state = WirePositionState.A;
    distance = currentPosition.distance;
  } else if (currentPosition.state === WirePositionState.A) {
    state = WirePositionState.Intersected;
    distance = currentPosition.distance + currentPositionDistance;
  } else {
    state = WirePositionState.B;
    distance = currentPosition.distance;
  }

  return {
    state,
    distance
  };
}

function getWireMap(wireSegments: Segment[], position: Point, distance: number, wireMap: WireMap, wireName: Wire): WireMap {
  if (wireSegments.length === 0) {
    return wireMap;
  }
  const nextPosition = {...position};
  const currentSegment = wireSegments[0];
  wireSegments.shift();
  switch(currentSegment.direction) {
    case Direction.Up:
      for (let i = 1; i <= currentSegment.length; i++) {
        const nextPoint = `${position.x},${position.y+i}`;
        wireMap[nextPoint] = setWireMapValue(wireMap[nextPoint], distance+i, wireName);
      }
      nextPosition.y += currentSegment.length;
      break;
    case Direction.Down:
      for (let i = 1; i <= currentSegment.length; i++) {
        const nextPoint = `${position.x},${position.y-i}`;
        wireMap[nextPoint] = setWireMapValue(wireMap[nextPoint], distance+i, wireName);
      }
      nextPosition.y -= currentSegment.length;
      break;
    case Direction.Right:
      for (let i = 1; i <= currentSegment.length; i++) {
        const nextPoint = `${position.x+i},${position.y}`;
        wireMap[nextPoint] = setWireMapValue(wireMap[nextPoint], distance+i, wireName);
      }
      nextPosition.x += currentSegment.length;
      break;
    case Direction.Left:
      for (let i = 1; i <= currentSegment.length; i++) {
        const nextPoint = `${position.x-i},${position.y}`;
        wireMap[nextPoint] = setWireMapValue(wireMap[nextPoint], distance+i, wireName);
      }
      nextPosition.x -= currentSegment.length;
      break;
  }

  return getWireMap(wireSegments, nextPosition, distance + currentSegment.length, wireMap, wireName);
}

const wireAMap = getWireMap(wireA, {x: 0, y: 0}, 0, {}, Wire.A);
const combinedWireMap = getWireMap(wireB, {x: 0, y: 0}, 0, wireAMap, Wire.B);

// SHOULD BE THE ANSWER
const intersections = Object.keys(combinedWireMap)
  .filter((point) => (
    combinedWireMap[point].state === WirePositionState.Intersected
  ));

const intersectionManhattanDistances = intersections
  .map((point) =>
    point.split(',').map((value) => Math.abs(Number.parseInt(value))).reduce((a,b) => a+b)
  );

const intersectionTraveledLengths = intersections
  .map((intersection) => (
    combinedWireMap[intersection].distance
  ));

const smallestManhattanDistance = Math.min(...intersectionManhattanDistances);
const smallestIntersectionTraveledLengths = Math.min(...intersectionTraveledLengths);

console.log(`Day 3 - Part 1: ${smallestManhattanDistance}`); // 721!!!!
console.log(`Day 3 - Part 2: ${smallestIntersectionTraveledLengths}`); //7388
