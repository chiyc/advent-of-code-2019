const start = 272091;
const end = 815432;

function countPasswords(current: number, end: number , count: number): number {
  if (current > end) {
    return count;
  }
  return countPasswords(current + 1, end, isQualified(String(current)) ? count + 1 : count);
}

// Password must start with length at least 2
function isQualified(password: string, isIncreasing: boolean = true, doubledChars: string[] = [], part: string = 'one'): boolean {
  const passwordString = String(password);
  if (isIncreasing === false) {
    return false;
  }
  if (passwordString.length === 1) {
    const doubleCounts = doubledChars.reduce((counts: {[key: string]: number}, char) => ({
      ...counts,
      [char]: counts[char] ? counts[char] + 1 : 1
    }), {});

    const isCorrectlyDoubled = part === 'one'
      ? doubledChars.length > 0
      : Object.keys(doubleCounts).some((char) => doubleCounts[char] === 1);

    return isIncreasing && isCorrectlyDoubled;
  }

  const nextPassword = password.slice(1);
  const firstChar = password.charAt(0);
  const nextChar = password.charAt(1);

  const nextDoubledChars = firstChar === nextChar
    ? doubledChars.concat(firstChar)
    : doubledChars;
  return isQualified(nextPassword, firstChar <= nextChar, nextDoubledChars, part);
}

// RUN THIS FOR THE ANSWERR
let partOneCount = 0;
let partTwoCount = 0;
for (let i = start; i <= end; i++) {
  const qualifiesPartOne = isQualified(String(i));
  const qualifiesPartTwo = isQualified(String(i), true, [], 'two');
  partOneCount += qualifiesPartOne ? 1 : 0;
  partTwoCount += qualifiesPartTwo ? 1 : 0;
}

console.log(`Day 4 - Part 1: ${partOneCount} passwords`); // 931
console.log(`Day 4 - Part 2: ${partTwoCount} passwords`); // 609
