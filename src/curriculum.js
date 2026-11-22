// File: curriculum.js
// Directory: src/
// Lesson catalogue, units and progress tracking helpers.

import { advancedLessons } from './advanced-lessons.js';
import { createNormalLessons } from './journeys.js';

export var units = [
  ["First discoveries", "\u099A\u09B2\u09CB \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09BF", "01", "zero"],
  ["Meet the abacus", "\u09AA\u09C1\u0981\u09A4\u09BF\u09B0 \u09B8\u0999\u09CD\u0997\u09C7 \u09AA\u09B0\u09BF\u099A\u09AF\u09BC", "02", "place"],
  ["Friends of five", "\u09AA\u09BE\u0981\u099A \u09AC\u09BE\u09A8\u09BE\u0987", "03", "five"],
  ["Across ten", "\u09A6\u09B6\u09C7\u09B0 \u0998\u09B0\u09C7 \u09AF\u09BE\u0987", "04", "ten"],
  ["Bigger adventures", "\u09AC\u09A1\u09BC \u0985\u0999\u09CD\u0995, \u099B\u09CB\u099F \u09A7\u09BE\u09AA", "05", "borrow"],
  ["Picture it", "\u09AE\u09A8\u09C7 \u09AE\u09A8\u09C7 \u09AA\u09C1\u0981\u09A4\u09BF", "06", "mental"],
  ["Multiplication & division", "\u0997\u09C1\u09A3 \u0986\u09B0 \u09AD\u09BE\u0997", "07", "multiply"],
  [
    "Decimals, fractions & negatives",
    "\u09A6\u09B6\u09AE\u09BF\u0995, \u09AD\u0997\u09CD\u09A8\u09BE\u0982\u09B6 \u0986\u09B0 \u098B\u09A3\u09BE\u09A4\u09CD\u09AE\u0995 \u09B8\u0982\u0996\u09CD\u09AF\u09BE",
    "08",
    "fractions"
  ],
  ["Clever shortcuts", "\u09B8\u09B9\u099C \u09AA\u09A5\u09C7 \u0985\u0999\u09CD\u0995", "09", "strategies"],
  ["Number detective", "\u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 \u0997\u09CB\u09AF\u09BC\u09C7\u09A8\u09CD\u09A6\u09BE", "10", "equations"],
  ["Precision & pace", "\u09A0\u09BF\u0995 \u0995\u09B0\u09BF, \u09A6\u09CD\u09B0\u09C1\u09A4 \u0995\u09B0\u09BF", "11", "speed"],
  ["Expert practice", "\u0986\u09B0\u0993 \u09AC\u09A1\u09BC \u099A\u09CD\u09AF\u09BE\u09B2\u09C7\u099E\u09CD\u099C", "12", "expert"]
];
export var rows = [
  // id, unit, English title, Bangla title, skill, example, practice items
  [
    "zero",
    0,
    "Nothing is a number",
    "\u0995\u09BF\u099B\u09C1 \u09A8\u09C7\u0987, \u09A4\u09AC\u09C1 \u09B8\u0982\u0996\u09CD\u09AF\u09BE!",
    "zero",
    "0",
    ["0+0", "1-1", "2-2"]
  ],
  [
    "count",
    0,
    "One, two, three",
    "\u098F\u0995, \u09A6\u09C1\u0987, \u09A4\u09BF\u09A8",
    "direct",
    "1+1+1",
    ["1+1", "2+1", "1+2"]
  ],
  [
    "compare",
    0,
    "One more",
    "\u0986\u09B0 \u098F\u0995\u099F\u09BE \u09A6\u09BF\u0987",
    "direct",
    "2+1",
    ["3+1", "1+1", "2+2"]
  ],
  [
    "take",
    0,
    "One goes away",
    "\u098F\u0995\u099F\u09BE \u09B8\u09B0\u09BF\u09AF\u09BC\u09C7 \u09A8\u09BF\u0987",
    "subtract",
    "3-1",
    ["4-1", "3-2", "2-1"]
  ],
  [
    "number-four",
    0,
    "Make four",
    "\u099A\u09BE\u09B0 \u09AC\u09BE\u09A8\u09BE\u0987",
    "direct",
    "2+2",
    ["1+3", "3+1", "4-0"]
  ],
  [
    "place",
    1,
    "Beads that count",
    "\u0995\u09CB\u09A8 \u09AA\u09C1\u0981\u09A4\u09BF\u099F\u09BE \u0997\u09C1\u09A8\u09AC?",
    "place",
    "3",
    ["2", "4", "1"]
  ],
  [
    "five-bead",
    1,
    "One bead, worth five",
    "\u098F\u0995 \u09AA\u09C1\u0981\u09A4\u09BF\u09A4\u09C7 \u09AA\u09BE\u0981\u099A",
    "five-bead",
    "5",
    ["5+1", "5+3", "5+4"]
  ],
  [
    "digits",
    1,
    "Read all nine",
    "\u09A8\u09AF\u09BC \u09AA\u09B0\u09CD\u09AF\u09A8\u09CD\u09A4 \u09AA\u09A1\u09BC\u09BF",
    "place",
    "9",
    ["6", "8", "7"]
  ],
  [
    "tens",
    1,
    "Ten gets a new home",
    "\u09A6\u09B6\u09C7\u09B0 \u09A8\u09A4\u09C1\u09A8 \u0998\u09B0",
    "place",
    "12",
    ["21", "30", "42"]
  ],
  [
    "hands",
    1,
    "Your fingers can count",
    "\u0986\u0999\u09C1\u09B2 \u09A6\u09BF\u09AF\u09BC\u09C7\u0987 \u0997\u09C1\u09A8\u09BF",
    "hands",
    "23",
    ["15", "32", "54"]
  ],
  [
    "five",
    2,
    "Three and two make five",
    "\u09A4\u09BF\u09A8 \u0986\u09B0 \u09A6\u09C1\u0987\u09AF\u09BC\u09C7 \u09AA\u09BE\u0981\u099A",
    "five",
    "3+2",
    ["4+1", "2+3", "1+4"]
  ],
  [
    "five-two",
    2,
    "Add with a five-friend",
    "\u09AA\u09BE\u0981\u099A\u09C7\u09B0 \u09B8\u09BE\u09B9\u09BE\u09AF\u09CD\u09AF\u09C7 \u09AF\u09CB\u0997",
    "five",
    "4+3",
    ["3+4", "4+4", "2+4"]
  ],
  [
    "five-back",
    2,
    "Take away, give back",
    "\u09B8\u09B0\u09BE\u0987, \u0986\u09AC\u09BE\u09B0 \u09A6\u09BF\u0987",
    "five",
    "5-2",
    ["6-3", "7-4", "5-1"]
  ],
  [
    "five-tens",
    2,
    "Five-friends in the tens",
    "\u09A6\u09B6\u0995\u09C7\u09B0 \u0998\u09B0\u09C7\u0993 \u098F\u0995\u0987 \u0996\u09C7\u09B2\u09BE",
    "five",
    "30+40",
    ["40+30", "50-20", "60-30"]
  ],
  [
    "five-mix",
    2,
    "Choose your bead move",
    "\u0995\u09CB\u09A8 \u09AA\u09C1\u0981\u09A4\u09BF\u099F\u09BE \u09A8\u09BE\u09A1\u09BC\u09BE\u09AC?",
    "five",
    "4+3-2",
    ["3+3-4", "2+4-3", "4+4-3"]
  ],
  [
    "ten",
    3,
    "Make a new ten",
    "\u098F\u0995\u099F\u09BE \u09A6\u09B6 \u09AC\u09BE\u09A8\u09BE\u0987",
    "ten",
    "9+1",
    ["8+2", "7+3", "6+4"]
  ],
  [
    "ten-friends",
    3,
    "Add ten, give some back",
    "\u09A6\u09B6 \u09A8\u09BF\u0987, \u0995\u09BF\u099B\u09C1 \u09AB\u09C7\u09B0\u09A4 \u09A6\u09BF\u0987",
    "ten",
    "8+5",
    ["9+3", "7+6", "8+4"]
  ],
  [
    "borrow",
    3,
    "Open a ten",
    "\u09A6\u09B6\u099F\u09BE\u0995\u09C7 \u0996\u09C1\u09B2\u09C7 \u09AB\u09C7\u09B2\u09BF",
    "borrow",
    "10-3",
    ["12-4", "11-5", "13-6"]
  ],
  [
    "ten-five",
    3,
    "Two useful friends",
    "\u09A6\u09C1\u0987 \u09AC\u09A8\u09CD\u09A7\u09C1 \u0995\u09BE\u099C\u09C7 \u09B2\u09BE\u0997\u09BE\u0987",
    "ten",
    "6+7",
    ["7+8", "6+6", "8+7"]
  ],
  [
    "ten-mix",
    3,
    "Cross ten both ways",
    "\u09A6\u09B6 \u09AA\u09C7\u09B0\u09BF\u09AF\u09BC\u09C7 \u09AF\u09BE\u0987-\u0986\u09B8\u09BF",
    "borrow",
    "15-7+4",
    ["12-8+7", "8+6-9", "9+7-8"]
  ],
  [
    "subtract",
    4,
    "Take away fifty-six",
    "\u099B\u09BE\u09AA\u09CD\u09AA\u09BE\u09A8\u09CD\u09A8 \u09B8\u09B0\u09BE\u0987, \u09A7\u09BE\u09AA\u09C7 \u09A7\u09BE\u09AA\u09C7",
    "borrow",
    "82-56",
    ["73-48", "92-67", "64-38"]
  ],
  [
    "hundreds",
    4,
    "Hello, hundreds",
    "\u098F\u09AC\u09BE\u09B0 \u09B6\u09A4\u0995\u09C7\u09B0 \u0998\u09B0",
    "place",
    "123+214",
    ["211+132", "342-121", "120+230"]
  ],
  [
    "carry-chain",
    4,
    "Carry all the way",
    "\u09A6\u09B6 \u09AF\u09BE\u09AF\u09BC \u09AA\u09BE\u09B6\u09C7\u09B0 \u0998\u09B0\u09C7",
    "ten",
    "999+1",
    ["199+3", "299+4", "989+12"]
  ],
  [
    "borrow-chain",
    4,
    "Borrow through zeros",
    "\u09B6\u09C2\u09A8\u09CD\u09AF \u09AA\u09C7\u09B0\u09BF\u09AF\u09BC\u09C7 \u09A7\u09BE\u09B0",
    "borrow",
    "1000-56",
    ["100-7", "1000-38", "2000-47"]
  ],
  [
    "big-mix",
    4,
    "Keep the whole story",
    "\u0985\u0999\u09CD\u0995\u099F\u09BE \u09AE\u09A8\u09C7 \u09B0\u09BE\u0996\u09BF",
    "borrow",
    "482-156+73",
    ["324+87-56", "600-284+39", "999-456+82"]
  ],
  [
    "mental",
    5,
    "See it, then picture it",
    "\u099A\u09CB\u0996 \u09AC\u09C1\u099C\u09C7 \u09AA\u09C1\u0981\u09A4\u09BF \u09A6\u09C7\u0996\u09BF",
    "mental",
    "2+2",
    ["3+1", "1+3", "4-2"]
  ],
  [
    "mental-five",
    5,
    "A five in your mind",
    "\u09AE\u09A8\u09C7 \u09AE\u09A8\u09C7 \u09AA\u09BE\u0981\u099A",
    "mental",
    "3+4",
    ["4+3", "5-2", "6-4"]
  ],
  [
    "mental-ten",
    5,
    "Imagine a new column",
    "\u09AE\u09A8\u09C7 \u09A8\u09A4\u09C1\u09A8 \u0998\u09B0 \u09AC\u09BE\u09A8\u09BE\u0987",
    "mental",
    "8+7",
    ["9+4", "7+6", "12-5"]
  ],
  [
    "mental-chain",
    5,
    "Three little moves",
    "\u09AE\u09A8\u09C7 \u09AE\u09A8\u09C7 \u09A4\u09BF\u09A8\u099F\u09BF \u09A7\u09BE\u09AA",
    "mental",
    "3+4-2",
    ["4+3-1", "8+5-6", "9-4+3"]
  ],
  [
    "mental-two",
    5,
    "Hold two columns",
    "\u09A6\u09C1\u0987 \u0998\u09B0 \u09AE\u09A8\u09C7 \u09B0\u09BE\u0996\u09BF",
    "mental",
    "23+14-12",
    ["32+21-13", "45-12+23", "61-24+15"]
  ],
  [
    "multiply",
    6,
    "Equal groups",
    "\u09B8\u09AE\u09BE\u09A8 \u09B8\u09AE\u09BE\u09A8 \u09A6\u09B2",
    "multiply",
    "3*4",
    ["2*4", "3*3", "4*2"]
  ],
  [
    "times-ten",
    6,
    "Ten times as much",
    "\u09A6\u09B6 \u0997\u09C1\u09A3 \u0995\u09B0\u09BF",
    "multiply",
    "23*10",
    ["14*10", "32*100", "45*10"]
  ],
  [
    "partial-products",
    6,
    "Split a multiplication",
    "\u09AD\u09C7\u0999\u09C7 \u09AD\u09C7\u0999\u09C7 \u0997\u09C1\u09A3",
    "multiply",
    "23*14",
    ["12*13", "24*12", "31*21"]
  ],
  [
    "divide",
    6,
    "Share fairly",
    "\u09B8\u09AC\u09BE\u0987 \u09B8\u09AE\u09BE\u09A8 \u09AA\u09BE\u09AC\u09C7",
    "divide",
    "24/3",
    ["18/3", "28/4", "36/6"]
  ],
  [
    "long-division",
    6,
    "Share one column at a time",
    "\u098F\u0995 \u0998\u09B0 \u0995\u09B0\u09C7 \u09AD\u09BE\u0997",
    "divide",
    "156/12",
    ["144/12", "168/12", "225/15"]
  ],
  [
    "decimal",
    7,
    "Smaller than one",
    "\u098F\u0995\u09C7\u09B0 \u099A\u09C7\u09AF\u09BC\u09C7\u0993 \u099B\u09CB\u099F",
    "decimal",
    "0.3+0.4",
    ["0.2+0.5", "0.8-0.3", "1.2+0.6"]
  ],
  [
    "money",
    7,
    "Count coins carefully",
    "\u099F\u09BE\u0995\u09BE\u09B0 \u09B9\u09BF\u09B8\u09BE\u09AC \u0995\u09B0\u09BF",
    "decimal",
    "12.50-3.75",
    ["10-2.25", "8.50+1.75", "20-6.50"]
  ],
  [
    "fractions",
    7,
    "Share the leftovers",
    "\u09AC\u09BE\u0995\u09BF \u0985\u0982\u09B6\u099F\u09BE\u0993 \u09AD\u09BE\u0997 \u0995\u09B0\u09BF",
    "fractions",
    "1/3+1/6",
    ["1/2+1/4", "3/4-1/2", "1/5+2/5"]
  ],
  [
    "percent",
    7,
    "Out of a hundred",
    "\u098F\u0995\u09B6\u09CB\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 \u0995\u09A4?",
    "percent",
    "25%*80",
    ["10%*90", "50%*36", "20%*150"]
  ],
  [
    "negative",
    7,
    "Below zero",
    "\u09B6\u09C2\u09A8\u09CD\u09AF\u09C7\u09B0 \u09A8\u09BF\u099A\u09C7 \u09AF\u09BE\u0987",
    "negative",
    "3-8",
    ["2-7", "-3+8", "-4-2"]
  ],
  [
    "compensate",
    8,
    "Round, then adjust",
    "\u0997\u09CB\u09B2 \u0995\u09B0\u09BF, \u09A0\u09BF\u0995 \u0995\u09B0\u09BF",
    "strategies",
    "47+99",
    ["68+99", "152-99", "298+47"]
  ],
  [
    "double-half",
    8,
    "Double and halve",
    "\u09A6\u09CD\u09AC\u09BF\u0997\u09C1\u09A3 \u0986\u09B0 \u0985\u09B0\u09CD\u09A7\u09C7\u0995",
    "strategies",
    "16*25",
    ["24*25", "32*25", "48*5"]
  ],
  [
    "near-base",
    8,
    "Close to a hundred",
    "\u098F\u0995\u09B6\u09CB\u09B0 \u0995\u09BE\u099B\u09BE\u0995\u09BE\u099B\u09BF",
    "strategies",
    "98*7",
    ["99*8", "102*6", "97*5"]
  ],
  [
    "squares",
    8,
    "A number times itself",
    "\u09A8\u09BF\u099C\u09C7\u09B0 \u09B8\u0999\u09CD\u0997\u09C7 \u0997\u09C1\u09A3",
    "powers",
    "25^2",
    ["15^2", "35^2", "45^2"]
  ],
  [
    "estimate",
    8,
    "Check if it makes sense",
    "\u0989\u09A4\u09CD\u09A4\u09B0\u099F\u09BE \u09A0\u09BF\u0995 \u09AE\u09A8\u09C7 \u09B9\u099A\u09CD\u099B\u09C7?",
    "strategies",
    "198+403",
    ["299+502", "801-399", "49*21"]
  ],
  [
    "order",
    9,
    "Which part comes first?",
    "\u0986\u0997\u09C7 \u0995\u09CB\u09A8\u099F\u09BE \u0995\u09B0\u09AC?",
    "order",
    "3+4*5",
    ["(3+4)*5", "18/3+7", "20-2*6"]
  ],
  [
    "powers",
    9,
    "Repeated multiplication",
    "\u09AC\u09BE\u09B0\u09AC\u09BE\u09B0 \u0997\u09C1\u09A3 \u0995\u09B0\u09BF",
    "powers",
    "2^5",
    ["3^3", "4^3", "5^3"]
  ],
  [
    "roots",
    9,
    "Undo a square",
    "\u0995\u09CB\u09A8 \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 \u09AC\u09B0\u09CD\u0997?",
    "roots",
    "sqrt(144)",
    ["sqrt(169)", "sqrt(225)", "sqrt(324)"]
  ],
  [
    "equations",
    9,
    "Find the hidden number",
    "\u09B2\u09C1\u0995\u09BE\u09A8\u09CB \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u099F\u09BE \u0996\u09C1\u0981\u099C\u09BF",
    "equations",
    "2*x+3=15",
    ["3*x+2=20", "4*x-5=23", "5*x+1=31"]
  ],
  [
    "balance",
    9,
    "Keep both sides equal",
    "\u09A6\u09C1\u0987 \u09AA\u09BE\u09B6 \u09B8\u09AE\u09BE\u09A8 \u09B0\u09BE\u0996\u09BF",
    "equations",
    "3*(x-2)=9",
    ["2*(x+3)=18", "4*x+3=2*x+15", "5*x-7=3*x+9"]
  ],
  [
    "speed",
    10,
    "Accuracy before speed",
    "\u0986\u0997\u09C7 \u09A0\u09BF\u0995, \u09AA\u09B0\u09C7 \u09A6\u09CD\u09B0\u09C1\u09A4",
    "speed",
    "24+38-17",
    ["34+29-18", "45+26-19", "63-28+16"]
  ],
  [
    "flash",
    10,
    "Catch the number",
    "\u09B8\u0982\u0996\u09CD\u09AF\u09BE\u099F\u09BE \u09A6\u09C7\u0996\u09C7 \u09B0\u09BE\u0996\u09BF",
    "speed",
    "3+8+4-6",
    ["4+7+3-5", "8+6-9+4", "7+5-3+8"]
  ],
  [
    "audio",
    10,
    "Listen and calculate",
    "\u09B6\u09C1\u09A8\u09BF \u0986\u09B0 \u09B9\u09BF\u09B8\u09BE\u09AC \u0995\u09B0\u09BF",
    "speed",
    "12+23-14",
    ["21+32-15", "34-12+23", "42+15-26"]
  ],
  [
    "mixed-recall",
    10,
    "Pick the right idea",
    "\u098F\u09AC\u09BE\u09B0 \u0995\u09CB\u09A8 \u09A8\u09BF\u09AF\u09BC\u09AE?",
    "speed",
    "(32+18)/5",
    ["(42-14)/4", "(25+35)/6", "(72-24)/8"]
  ],
  [
    "retention",
    10,
    "Remember it tomorrow",
    "\u0995\u09BE\u09B2\u0993 \u09AE\u09A8\u09C7 \u09A5\u09BE\u0995\u09C7 \u09A4\u09CB?",
    "speed",
    "76-39",
    ["82-47", "63-28", "91-56"]
  ],
  [
    "expert",
    11,
    "Long addition",
    "\u0985\u09A8\u09C7\u0995\u0997\u09C1\u09B2\u09CB \u09AC\u09A1\u09BC \u09B8\u0982\u0996\u09CD\u09AF\u09BE",
    "expert",
    "12345+67890+24680",
    ["34567+45678+56789", "123456+234567+345678", "654321-123456+234567"]
  ],
  [
    "expert-product",
    11,
    "Large products",
    "\u09AC\u09A1\u09BC \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 \u0997\u09C1\u09A3",
    "multiply",
    "1234*5678",
    ["2345*6789", "3456*7890", "4567*8901"]
  ],
  [
    "expert-divide",
    11,
    "Division with precision",
    "\u09AD\u09BE\u0997\u09C7 \u09A0\u09BF\u0995\u09A0\u09BE\u0995 \u09B9\u09BF\u09B8\u09BE\u09AC",
    "divide",
    "123456/48",
    ["654321/27", "987654/54", "1234567/37"]
  ],
  [
    "expert-root",
    11,
    "Find a root digit by digit",
    "\u098F\u0995 \u0985\u0999\u09CD\u0995 \u0995\u09B0\u09C7 \u09AC\u09B0\u09CD\u0997\u09AE\u09C2\u09B2",
    "root-estimate",
    "sqrt(123456)",
    ["sqrt(2401)", "sqrt(6561)", "sqrt(9801)"]
  ],
  [
    "expert-mixed",
    11,
    "Build your own challenge",
    "\u09A8\u09BF\u099C\u09C7\u09B0 \u099A\u09CD\u09AF\u09BE\u09B2\u09C7\u099E\u09CD\u099C \u09A8\u09BF\u099C\u09C7\u0987 \u09AC\u09BE\u09A8\u09BE\u0987",
    "expert",
    "(1234*25-850)/5",
    ["(9876*5+620)/10", "(4321*9-1889)/4", "(125*64-500)/25"]
  ]
];
rows.push(...advancedLessons);
rows.sort((a, b) => a[1] - b[1]);
export var workedIdeas = {
  "five-two": [
    "Start at 4. To add 3, bring the five-bead to the bar and move two lower beads away. Adding 5 and taking away 2 adds 3, so the board shows 7.",
    "\u09AA\u09CD\u09B0\u09A5\u09AE\u09C7 \u09EA \u09AC\u09BE\u09A8\u09BE\u0993\u0964 \u09E9 \u09AF\u09CB\u0997 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u0981\u099A\u09C7\u09B0 \u09AA\u09C1\u0981\u09A4\u09BF \u0995\u09BE\u099B\u09C7 \u0986\u09A8\u09CB, \u09A8\u09BF\u099A\u09C7\u09B0 \u09A6\u09C1\u0987 \u09AA\u09C1\u0981\u09A4\u09BF \u09B8\u09B0\u09BE\u0993\u0964 \u09EB \u09AF\u09CB\u0997 \u0995\u09B0\u09C7 \u09E8 \u09B8\u09B0\u09BE\u09B2\u09C7 \u09E9 \u09AC\u09BE\u09A1\u09BC\u09C7\u0964 \u098F\u09AC\u09BE\u09B0 \u09AC\u09CB\u09B0\u09CD\u09A1\u09C7 \u09ED\u0964"
  ],
  "five-back": [
    "Start at 5. There are no lower beads to take away. To subtract 2, move the five-bead away and bring three lower beads to the bar. Taking away 5 and adding 3 takes away 2.",
    "\u09AA\u09CD\u09B0\u09A5\u09AE\u09C7 \u09EB \u09AC\u09BE\u09A8\u09BE\u0993\u0964 \u09A8\u09BF\u099A\u09C7 \u09B8\u09B0\u09BE\u09A8\u09CB\u09B0 \u09AE\u09A4\u09CB \u09AA\u09C1\u0981\u09A4\u09BF \u09A8\u09C7\u0987\u0964 \u09E8 \u09AC\u09BF\u09AF\u09BC\u09CB\u0997 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u0981\u099A\u09C7\u09B0 \u09AA\u09C1\u0981\u09A4\u09BF \u09B8\u09B0\u09BE\u0993, \u09A8\u09BF\u099A\u09C7\u09B0 \u09A4\u09BF\u09A8 \u09AA\u09C1\u0981\u09A4\u09BF \u0995\u09BE\u099B\u09C7 \u0986\u09A8\u09CB\u0964 \u09EB \u09B8\u09B0\u09BF\u09AF\u09BC\u09C7 \u09E9 \u09AF\u09CB\u0997 \u0995\u09B0\u09B2\u09C7 \u09E8 \u0995\u09AE\u09C7\u0964"
  ],
  ten: [
    "Start at 9. To add 1, clear the nine ones and add one bead in the tens column. That bead is worth 10. Taking away 9 and adding 10 adds 1.",
    "\u09AA\u09CD\u09B0\u09A5\u09AE\u09C7 \u09EF \u09AC\u09BE\u09A8\u09BE\u0993\u0964 \u09E7 \u09AF\u09CB\u0997 \u0995\u09B0\u09A4\u09C7 \u098F\u0995\u0995\u09C7\u09B0 \u09A8\u09AF\u09BC\u099F\u09BF \u09B8\u09B0\u09BE\u0993, \u09A6\u09B6\u0995\u09C7\u09B0 \u0998\u09B0\u09C7 \u098F\u0995 \u09AA\u09C1\u0981\u09A4\u09BF \u0986\u09A8\u09CB\u0964 \u09A4\u09BE\u09B0 \u09A6\u09BE\u09AE \u09E7\u09E6\u0964 \u09EF \u09B8\u09B0\u09BF\u09AF\u09BC\u09C7 \u09E7\u09E6 \u09AF\u09CB\u0997 \u0995\u09B0\u09B2\u09C7 \u09E7 \u09AC\u09BE\u09A1\u09BC\u09C7\u0964"
  ],
  "ten-friends": [
    "Start at 8. To add 5, take away 5 in the ones column and add 10 in the tens column. You keep 3 ones and gain 1 ten: 13.",
    "\u09AA\u09CD\u09B0\u09A5\u09AE\u09C7 \u09EE \u09AC\u09BE\u09A8\u09BE\u0993\u0964 \u09EB \u09AF\u09CB\u0997 \u0995\u09B0\u09A4\u09C7 \u098F\u0995\u0995\u09C7\u09B0 \u0998\u09B0 \u09A5\u09C7\u0995\u09C7 \u09EB \u09B8\u09B0\u09BE\u0993, \u09A6\u09B6\u0995\u09C7\u09B0 \u0998\u09B0\u09C7 \u09E7\u09E6 \u09AF\u09CB\u0997 \u0995\u09B0\u09CB\u0964 \u09A5\u09BE\u0995\u09C7 \u09E9 \u098F\u0995\u0995 \u0986\u09B0 \u09E7 \u09A6\u09B6\u0995: \u09E7\u09E9\u0964"
  ],
  hundreds: [
    "Read 123 as 1 hundred, 2 tens and 3 ones. Add 214 by matching columns: 2 hundreds, 1 ten and 4 ones. Each column keeps its own place value.",
    "\u09E7\u09E8\u09E9 \u09AE\u09BE\u09A8\u09C7 \u09E7 \u09B6\u09A4\u0995, \u09E8 \u09A6\u09B6\u0995, \u09E9 \u098F\u0995\u0995\u0964 \u0998\u09B0 \u09AE\u09BF\u09B2\u09BF\u09AF\u09BC\u09C7 \u09E8\u09E7\u09EA \u09AF\u09CB\u0997 \u0995\u09B0\u09CB: \u09E8 \u09B6\u09A4\u0995, \u09E7 \u09A6\u09B6\u0995, \u09EA \u098F\u0995\u0995\u0964 \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u0998\u09B0\u09C7\u09B0 \u0986\u09B2\u09BE\u09A6\u09BE \u09A6\u09BE\u09AE\u0964"
  ],
  "carry-chain": [
    "In 999 + 1, the ones become a new ten. The tens become a new hundred, and the hundreds become a new thousand. Clear each full column and carry one to the left.",
    "\u09EF\u09EF\u09EF + \u09E7-\u098F \u098F\u0995\u0995 \u09A5\u09C7\u0995\u09C7 \u09A8\u09A4\u09C1\u09A8 \u09A6\u09B6\u0995 \u09B9\u09AF\u09BC\u0964 \u09A6\u09B6\u0995 \u09A5\u09C7\u0995\u09C7 \u09B6\u09A4\u0995, \u09B6\u09A4\u0995 \u09A5\u09C7\u0995\u09C7 \u09B9\u09BE\u099C\u09BE\u09B0 \u09B9\u09AF\u09BC\u0964 \u09AD\u09B0\u09BE \u0998\u09B0 \u0996\u09BE\u09B2\u09BF \u0995\u09B0\u09C7 \u09AC\u09BE\u0981 \u09AA\u09BE\u09B6\u09C7\u09B0 \u0998\u09B0\u09C7 \u098F\u0995 \u09A8\u09BF\u09AF\u09BC\u09C7 \u09AF\u09BE\u0993\u0964"
  ],
  multiply: [
    "3 \xD7 4 means four equal groups of 3. Add 3 four times: 3, 6, 9, 12. Multiplication counts equal groups more quickly.",
    "\u09E9 \xD7 \u09EA \u09AE\u09BE\u09A8\u09C7 \u09E9-\u098F\u09B0 \u099A\u09BE\u09B0\u099F\u09BF \u09B8\u09AE\u09BE\u09A8 \u09A6\u09B2\u0964 \u099A\u09BE\u09B0\u09AC\u09BE\u09B0 \u09E9 \u09AF\u09CB\u0997 \u0995\u09B0\u09CB: \u09E9, \u09EC, \u09EF, \u09E7\u09E8\u0964 \u0997\u09C1\u09A3\u09C7 \u09B8\u09AE\u09BE\u09A8 \u09A6\u09B2\u0997\u09C1\u09B2\u09CB \u09A6\u09CD\u09B0\u09C1\u09A4 \u0997\u09CB\u09A8\u09BE \u09AF\u09BE\u09AF\u09BC\u0964"
  ],
  divide: [
    "Share 24 equally among 3 groups. Each group gets 8, because 3 \xD7 8 = 24. Use multiplication to check your division.",
    "\u09E8\u09EA-\u0995\u09C7 \u09A4\u09BF\u09A8\u099F\u09BF \u09B8\u09AE\u09BE\u09A8 \u09A6\u09B2\u09C7 \u09AD\u09BE\u0997 \u0995\u09B0\u09CB\u0964 \u09AA\u09CD\u09B0\u09A4\u09BF \u09A6\u09B2\u09C7 \u09EE, \u0995\u09BE\u09B0\u09A3 \u09E9 \xD7 \u09EE = \u09E8\u09EA\u0964 \u0997\u09C1\u09A3 \u0995\u09B0\u09C7 \u09AD\u09BE\u0997\u09C7\u09B0 \u0989\u09A4\u09CD\u09A4\u09B0 \u09AE\u09BF\u09B2\u09BF\u09AF\u09BC\u09C7 \u09A6\u09C7\u0996\u09CB\u0964"
  ],
  powers: [
    "2\u2075 means five factors of 2: 2 \xD7 2 \xD7 2 \xD7 2 \xD7 2 = 32. The small number tells you how many factors to multiply.",
    "\u09E8\u2075 \u09AE\u09BE\u09A8\u09C7 \u09AA\u09BE\u0981\u099A\u099F\u09BF \u09E8-\u098F\u09B0 \u0997\u09C1\u09A3: \u09E8 \xD7 \u09E8 \xD7 \u09E8 \xD7 \u09E8 \xD7 \u09E8 = \u09E9\u09E8\u0964 \u099B\u09CB\u099F \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u099F\u09BF \u09AC\u09B2\u09C7 \u0995\u09A4\u0997\u09C1\u09B2\u09CB \u098F\u0995\u0987 \u09B8\u0982\u0996\u09CD\u09AF\u09BE \u0997\u09C1\u09A3 \u0995\u09B0\u09AC\u0964"
  ]
};
export var lessons = rows.map((r, i) => ({
  id: r[0],
  unit: r[1],
  title: { en: r[2], bn: r[3] },
  skill: r[4],
  example: r[5],
  practice: r[6],
  idea: workedIdeas[r[0]] ? { en: workedIdeas[r[0]][0], bn: workedIdeas[r[0]][1] } : r[7] ? { en: r[7], bn: r[8] } : null,
  order: i,
  minutes: r[1] < 2 ? 3 : r[1] < 6 ? 4 : 5,
  prerequisite: i ? rows[i - 1][0] : null
}));
export var concepts = {
  zero: [
    "Beads count only when they touch the middle bar. Move every bead away. That is zero.",
    "\u09AE\u09BE\u099D\u09C7\u09B0 \u09A6\u09BE\u0997 \u099B\u09C1\u0981\u09AF\u09BC\u09C7 \u09A5\u09BE\u0995\u09BE \u09AA\u09C1\u0981\u09A4\u09BF\u0997\u09C1\u09B2\u09CB\u0987 \u0997\u09C1\u09A8\u09AC\u0964 \u09B8\u09AC \u09AA\u09C1\u0981\u09A4\u09BF \u09B8\u09B0\u09BF\u09AF\u09BC\u09C7 \u09A6\u09BF\u09B2\u09C7 \u09A5\u09BE\u0995\u09C7 \u09B6\u09C2\u09A8\u09CD\u09AF\u0964"
  ],
  direct: [
    "Each lower bead is one. Slide a lower bead toward the middle bar to add one. Count the beads that touch.",
    "\u09A8\u09BF\u099A\u09C7\u09B0 \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u09AA\u09C1\u0981\u09A4\u09BF \u098F\u0995\u0964 \u098F\u0995\u099F\u09BE \u09AA\u09C1\u0981\u09A4\u09BF \u09AE\u09BE\u099D\u09C7\u09B0 \u09A6\u09BE\u0997\u09C7\u09B0 \u09A6\u09BF\u0995\u09C7 \u0986\u09A8\u09B2\u09C7 \u098F\u0995 \u09AC\u09BE\u09A1\u09BC\u09C7\u0964 \u09A6\u09BE\u0997\u09C7\u09B0 \u0995\u09BE\u099B\u09C7 \u09A5\u09BE\u0995\u09BE \u09AA\u09C1\u0981\u09A4\u09BF\u0997\u09C1\u09B2\u09CB \u0997\u09CB\u09A8\u09CB\u0964"
  ],
  subtract: [
    "Taking away makes our number smaller. Slide the beads away from the middle bar.",
    "\u0995\u09BF\u099B\u09C1 \u09B8\u09B0\u09BF\u09AF\u09BC\u09C7 \u09A8\u09BF\u09B2\u09C7 \u09B8\u0982\u0996\u09CD\u09AF\u09BE \u0995\u09AE\u09C7\u0964 \u09AA\u09C1\u0981\u09A4\u09BF\u0997\u09C1\u09B2\u09CB \u09AE\u09BE\u099D\u09C7\u09B0 \u09A6\u09BE\u0997 \u09A5\u09C7\u0995\u09C7 \u09A6\u09C2\u09B0\u09C7 \u09B8\u09B0\u09BE\u0993\u0964"
  ],
  place: [
    "The right column is ones. The next column is tens. One bead there is worth ten ones.",
    "\u09A1\u09BE\u09A8 \u09A6\u09BF\u0995\u09C7\u09B0 \u0998\u09B0 \u098F\u0995\u0995\u09C7\u09B0\u0964 \u09A4\u09BE\u09B0 \u09AC\u09BE\u0981\u09AF\u09BC\u09C7 \u09A6\u09B6\u0995\u09C7\u09B0 \u0998\u09B0\u0964 \u09A6\u09B6\u0995\u09C7\u09B0 \u0998\u09B0\u09C7\u09B0 \u098F\u0995 \u09AA\u09C1\u0981\u09A4\u09BF\u09B0 \u09A6\u09BE\u09AE \u09A6\u09B6\u0964"
  ],
  "five-bead": [
    "The bead above the bar is worth five. Slide it down to the bar. Then add lower beads to make six, seven, eight or nine.",
    "\u09A6\u09BE\u0997\u09C7\u09B0 \u0993\u09AA\u09B0\u09C7\u09B0 \u09AA\u09C1\u0981\u09A4\u09BF\u09B0 \u09A6\u09BE\u09AE \u09AA\u09BE\u0981\u099A\u0964 \u09B8\u09C7\u099F\u09BE\u0995\u09C7 \u09A6\u09BE\u0997\u09C7\u09B0 \u0995\u09BE\u099B\u09C7 \u09A8\u09BE\u09AE\u09BE\u0993\u0964 \u09A8\u09BF\u099A\u09C7\u09B0 \u09AA\u09C1\u0981\u09A4\u09BF \u09AF\u09CB\u0997 \u0995\u09B0\u09C7 \u099B\u09AF\u09BC, \u09B8\u09BE\u09A4, \u0986\u099F \u09AC\u09BE \u09A8\u09AF\u09BC \u09AC\u09BE\u09A8\u09BE\u0993\u0964"
  ],
  hands: [
    "Right hand: each finger is 1 and the thumb is 5. Left hand: each finger is 10 and the thumb is 50. Touch a finger down to count it.",
    "\u09A1\u09BE\u09A8 \u09B9\u09BE\u09A4\u09C7 \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u0986\u0999\u09C1\u09B2 \u09E7, \u09AC\u09C1\u09A1\u09BC\u09CB \u0986\u0999\u09C1\u09B2 \u09EB\u0964 \u09AC\u09BE\u0981 \u09B9\u09BE\u09A4\u09C7 \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u0986\u0999\u09C1\u09B2 \u09E7\u09E6, \u09AC\u09C1\u09A1\u09BC\u09CB \u0986\u0999\u09C1\u09B2 \u09EB\u09E6\u0964 \u0997\u09C1\u09A8\u09A4\u09C7 \u09B9\u09B2\u09C7 \u0986\u0999\u09C1\u09B2 \u09A8\u09BF\u099A\u09C7 \u099B\u09CB\u0981\u09AF\u09BC\u09BE\u0993\u0964"
  ],
  five: [
    "When lower beads run out, use a friend of five. To add, bring the five-bead in and take the extra lower beads away. To subtract, take the five-bead away and bring the extra lower beads back.",
    "\u09A8\u09BF\u099A\u09C7\u09B0 \u09AA\u09C1\u0981\u09A4\u09BF \u0995\u09AE \u09AA\u09A1\u09BC\u09B2\u09C7 \u09AA\u09BE\u0981\u099A\u09C7\u09B0 \u09B8\u09BE\u09B9\u09BE\u09AF\u09CD\u09AF \u09A8\u09BE\u0993\u0964 \u09AF\u09CB\u0997 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u0981\u099A\u09C7\u09B0 \u09AA\u09C1\u0981\u09A4\u09BF \u0986\u09A8\u09CB, \u09AC\u09BE\u09A1\u09BC\u09A4\u09BF \u09A8\u09BF\u099A\u09C7\u09B0 \u09AA\u09C1\u0981\u09A4\u09BF \u09B8\u09B0\u09BE\u0993\u0964 \u09AC\u09BF\u09AF\u09BC\u09CB\u0997 \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u0981\u099A\u09C7\u09B0 \u09AA\u09C1\u0981\u09A4\u09BF \u09B8\u09B0\u09BE\u0993, \u09AC\u09BE\u09A1\u09BC\u09A4\u09BF \u09A8\u09BF\u099A\u09C7\u09B0 \u09AA\u09C1\u0981\u09A4\u09BF \u09AB\u09C7\u09B0\u09A4 \u0986\u09A8\u09CB\u0964"
  ],
  ten: [
    "A column holds at most nine. When addition passes nine, make a new ten in the column to the left. Keep the remaining ones in this column. Follow one exchange at a time.",
    "\u098F\u0995 \u0998\u09B0\u09C7 \u09A8\u09AF\u09BC \u09AA\u09B0\u09CD\u09AF\u09A8\u09CD\u09A4 \u09B0\u09BE\u0996\u09BE \u09AF\u09BE\u09AF\u09BC\u0964 \u09AF\u09CB\u0997\u09C7 \u09A8\u09AF\u09BC \u099B\u09BE\u09A1\u09BC\u09BE\u09B2\u09C7 \u09AC\u09BE\u0981 \u09AA\u09BE\u09B6\u09C7\u09B0 \u0998\u09B0\u09C7 \u09A8\u09A4\u09C1\u09A8 \u09A6\u09B6 \u09AC\u09BE\u09A8\u09BE\u0993\u0964 \u09AC\u09BE\u0995\u09BF \u098F\u0995\u0995\u0997\u09C1\u09B2\u09CB \u098F\u0987 \u0998\u09B0\u09C7 \u09B0\u09BE\u0996\u09CB\u0964 \u098F\u0995\u09AC\u09BE\u09B0\u09C7 \u098F\u0995\u099F\u09BF \u09AC\u09A6\u09B2 \u0995\u09B0\u09CB\u0964"
  ],
  borrow: [
    "Need more beads to subtract? Take one from the column to the left. That is ten in this column. Keep the part you did not subtract.",
    "\u09AC\u09BF\u09AF\u09BC\u09CB\u0997 \u0995\u09B0\u09BE\u09B0 \u09AE\u09A4\u09CB \u09AA\u09C1\u0981\u09A4\u09BF \u09A8\u09C7\u0987? \u09AC\u09BE\u0981 \u09AA\u09BE\u09B6\u09C7\u09B0 \u0998\u09B0 \u09A5\u09C7\u0995\u09C7 \u098F\u0995 \u09A8\u09BE\u0993\u0964 \u098F\u0987 \u0998\u09B0\u09C7 \u09A4\u09BE\u09B0 \u09A6\u09BE\u09AE \u09A6\u09B6\u0964 \u09AF\u09A4\u099F\u09C1\u0995\u09C1 \u09AC\u09BE\u09A6 \u09A6\u09BF\u09B2\u09C7, \u09A4\u09BE\u09B0 \u09AC\u09BE\u0995\u09BF \u0985\u0982\u09B6 \u098F\u0996\u09BE\u09A8\u09C7 \u09B0\u09BE\u0996\u09CB\u0964"
  ],
  mental: [
    "Look at the beads. Close your eyes and picture where they are. Imagine one move. Open your eyes and check. It is fine to look again.",
    "\u09AA\u09C1\u0981\u09A4\u09BF\u0997\u09C1\u09B2\u09CB \u09A6\u09C7\u0996\u09CB\u0964 \u099A\u09CB\u0996 \u09AC\u09C1\u099C\u09C7 \u09AD\u09BE\u09AC\u09CB \u0995\u09CB\u09A8\u099F\u09BE \u0995\u09CB\u09A5\u09BE\u09AF\u09BC \u0986\u099B\u09C7\u0964 \u09AE\u09A8\u09C7 \u09AE\u09A8\u09C7 \u098F\u0995\u099F\u09BE \u09AA\u09C1\u0981\u09A4\u09BF \u09A8\u09BE\u09A1\u09BC\u09BE\u0993\u0964 \u099A\u09CB\u0996 \u0996\u09C1\u09B2\u09C7 \u09AE\u09BF\u09B2\u09BF\u09AF\u09BC\u09C7 \u09A6\u09C7\u0996\u09CB\u0964 \u09A6\u09B0\u0995\u09BE\u09B0 \u09B9\u09B2\u09C7 \u0986\u09AC\u09BE\u09B0 \u09A6\u09C7\u0996\u09AC\u09C7\u0964"
  ],
  multiply: [
    "Multiplication counts equal groups. For a bigger multiplier, split it into place values, multiply each part, then add the partial answers.",
    "\u0997\u09C1\u09A3\u09C7 \u09B8\u09AE\u09BE\u09A8 \u09B8\u09AE\u09BE\u09A8 \u09A6\u09B2 \u0997\u09CB\u09A8\u09BE \u09B9\u09AF\u09BC\u0964 \u09AC\u09A1\u09BC \u0997\u09C1\u09A3\u0995\u0995\u09C7 \u0998\u09B0\u09C7\u09B0 \u09A6\u09BE\u09AE \u0985\u09A8\u09C1\u09AF\u09BE\u09AF\u09BC\u09C0 \u09AD\u09BE\u0999\u09CB\u0964 \u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u0985\u0982\u09B6 \u09A6\u09BF\u09AF\u09BC\u09C7 \u0997\u09C1\u09A3 \u0995\u09B0\u09C7 \u099B\u09CB\u099F \u0989\u09A4\u09CD\u09A4\u09B0\u0997\u09C1\u09B2\u09CB \u09AF\u09CB\u0997 \u0995\u09B0\u09CB\u0964"
  ],
  divide: [
    "Division shares equally. Take the next digit, find how many groups fit, subtract what you used, and carry the remainder to the next digit. Check with multiplication.",
    "\u09AD\u09BE\u0997 \u09AE\u09BE\u09A8\u09C7 \u09B8\u09AE\u09BE\u09A8 \u09AD\u09BE\u0997\u09C7 \u09A6\u09C7\u0993\u09AF\u09BC\u09BE\u0964 \u09AA\u09B0\u09C7\u09B0 \u0985\u0999\u09CD\u0995\u099F\u09BE \u09A8\u09BE\u09AE\u09BE\u0993, \u0995\u09A4 \u09A6\u09B2 \u09B9\u09AF\u09BC \u09A6\u09C7\u0996\u09CB, \u09A6\u09C7\u0993\u09AF\u09BC\u09BE \u0985\u0982\u09B6 \u09AC\u09BE\u09A6 \u09A6\u09BE\u0993\u0964 \u09AC\u09BE\u0995\u09BF\u099F\u09BE \u09A8\u09BF\u09AF\u09BC\u09C7 \u09AA\u09B0\u09C7\u09B0 \u0998\u09B0\u09C7 \u09AF\u09BE\u0993\u0964 \u0997\u09C1\u09A3 \u0995\u09B0\u09C7 \u09AE\u09BF\u09B2\u09BF\u09AF\u09BC\u09C7 \u09A6\u09C7\u0996\u09CB\u0964"
  ],
  decimal: [
    "The dot marks the ones column. To its right: tenths, then hundredths. Line up the dots before adding or subtracting.",
    "\u09AC\u09BF\u09A8\u09CD\u09A6\u09C1\u09B0 \u09AC\u09BE\u0981\u09AF\u09BC\u09C7\u09B0 \u0998\u09B0 \u098F\u0995\u0995\u09C7\u09B0\u0964 \u09A1\u09BE\u09A8\u09C7 \u09A6\u09B6 \u09AD\u09BE\u0997\u09C7\u09B0 \u098F\u0995 \u09AD\u09BE\u0997, \u09A4\u09BE\u09B0\u09AA\u09B0 \u098F\u0995\u09B6\u09CB \u09AD\u09BE\u0997\u09C7\u09B0 \u098F\u0995 \u09AD\u09BE\u0997\u0964 \u09AF\u09CB\u0997-\u09AC\u09BF\u09AF\u09BC\u09CB\u0997\u09C7\u09B0 \u0986\u0997\u09C7 \u09AC\u09BF\u09A8\u09CD\u09A6\u09C1\u0997\u09C1\u09B2\u09CB \u09AE\u09BF\u09B2\u09BF\u09AF\u09BC\u09C7 \u09A8\u09BE\u0993\u0964"
  ],
  fractions: [
    "A fraction is an exact part of a whole. Use equal-sized parts before adding. One third and one sixth become two sixths and one sixth.",
    "\u09AD\u0997\u09CD\u09A8\u09BE\u0982\u09B6 \u09AE\u09BE\u09A8\u09C7 \u09AA\u09C1\u09B0\u09CB\u099F\u09BE\u09B0 \u0995\u09BF\u099B\u09C1 \u0985\u0982\u09B6\u0964 \u09AF\u09CB\u0997 \u0995\u09B0\u09BE\u09B0 \u0986\u0997\u09C7 \u0985\u0982\u09B6\u0997\u09C1\u09B2\u09CB\u09B0 \u0986\u0995\u09BE\u09B0 \u09B8\u09AE\u09BE\u09A8 \u0995\u09B0\u09CB\u0964 \u098F\u0995-\u09A4\u09C3\u09A4\u09C0\u09AF\u09BC\u09BE\u0982\u09B6 \u09AE\u09BE\u09A8\u09C7 \u09A6\u09C1\u0987-\u09B7\u09B7\u09CD\u09A0\u09BE\u0982\u09B6; \u09A4\u09BE\u09B0 \u09B8\u0999\u09CD\u0997\u09C7 \u098F\u0995-\u09B7\u09B7\u09CD\u09A0\u09BE\u0982\u09B6 \u09AF\u09CB\u0997 \u0995\u09B0\u09CB\u0964"
  ],
  percent: [
    "Percent means out of 100. Ten percent is one tenth. Fifty percent is half. Twenty-five percent is a quarter.",
    "\u09B6\u09A4\u0995\u09B0\u09BE \u09AE\u09BE\u09A8\u09C7 \u098F\u0995\u09B6\u09CB\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 \u0995\u09A4\u0964 \u09A6\u09B6 \u09B6\u09A4\u09BE\u0982\u09B6 \u09AE\u09BE\u09A8\u09C7 \u09A6\u09B6 \u09AD\u09BE\u0997\u09C7\u09B0 \u098F\u0995 \u09AD\u09BE\u0997\u0964 \u09AA\u099E\u09CD\u099A\u09BE\u09B6 \u09B6\u09A4\u09BE\u0982\u09B6 \u0985\u09B0\u09CD\u09A7\u09C7\u0995, \u09AA\u0981\u099A\u09BF\u09B6 \u09B6\u09A4\u09BE\u0982\u09B6 \u099A\u09BE\u09B0 \u09AD\u09BE\u0997\u09C7\u09B0 \u098F\u0995 \u09AD\u09BE\u0997\u0964"
  ],
  negative: [
    "Below zero, use a minus sign. A standard soroban shows magnitude, not negative beads. Use the exact-number panel for signed arithmetic.",
    "\u09B6\u09C2\u09A8\u09CD\u09AF\u09C7\u09B0 \u09A8\u09BF\u099A\u09C7 \u0997\u09C7\u09B2\u09C7 \u09AC\u09BF\u09AF\u09BC\u09CB\u0997 \u099A\u09BF\u09B9\u09CD\u09A8 \u09B2\u09BE\u0997\u09AC\u09C7\u0964 \u09B8\u09BE\u09A7\u09BE\u09B0\u09A3 \u0985\u09CD\u09AF\u09BE\u09AC\u09BE\u0995\u09BE\u09B8\u09C7 \u098B\u09A3\u09BE\u09A4\u09CD\u09AE\u0995 \u09AA\u09C1\u0981\u09A4\u09BF \u09A8\u09C7\u0987\u0964 \u09A4\u09BE\u0987 \u099A\u09BF\u09B9\u09CD\u09A8\u09B8\u09B9 \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09B0 \u09B9\u09BF\u09B8\u09BE\u09AC \u0986\u09B2\u09BE\u09A6\u09BE \u09AB\u09B2\u0995\u09C7 \u09A6\u09C7\u0996\u09AC\u0964"
  ],
  strategies: [
    "Look for an easier equivalent calculation. For +99, do +100 then \u22121. For \xD725, do \xD7100 then \xF74. First explain why the answer stays the same.",
    "\u098F\u0995\u0987 \u0989\u09A4\u09CD\u09A4\u09B0 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE\u09B0 \u09B8\u09B9\u099C \u09B0\u09BE\u09B8\u09CD\u09A4\u09BE \u0996\u09CB\u0981\u099C\u09CB\u0964 \u09EF\u09EF \u09AF\u09CB\u0997 \u0995\u09B0\u09A4\u09C7 \u09E7\u09E6\u09E6 \u09AF\u09CB\u0997 \u0995\u09B0\u09C7 \u09E7 \u09AC\u09BE\u09A6 \u09A6\u09BE\u0993\u0964 \u09E8\u09EB \u09A6\u09BF\u09AF\u09BC\u09C7 \u0997\u09C1\u09A3 \u0995\u09B0\u09A4\u09C7 \u09E7\u09E6\u09E6 \u09A6\u09BF\u09AF\u09BC\u09C7 \u0997\u09C1\u09A3 \u0995\u09B0\u09C7 \u09EA \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AD\u09BE\u0997 \u0995\u09B0\u09CB\u0964"
  ],
  order: [
    "Do parentheses first, then powers, then multiplication and division from left to right, then addition and subtraction from left to right.",
    "\u0986\u0997\u09C7 \u09AC\u09A8\u09CD\u09A7\u09A8\u09C0\u09B0 \u0985\u0999\u09CD\u0995\u0964 \u09A4\u09BE\u09B0\u09AA\u09B0 \u0998\u09BE\u09A4\u0964 \u09A4\u09BE\u09B0\u09AA\u09B0 \u09AC\u09BE\u0981 \u09A5\u09C7\u0995\u09C7 \u09A1\u09BE\u09A8\u09C7 \u0997\u09C1\u09A3-\u09AD\u09BE\u0997\u0964 \u09B6\u09C7\u09B7\u09C7 \u09AC\u09BE\u0981 \u09A5\u09C7\u0995\u09C7 \u09A1\u09BE\u09A8\u09C7 \u09AF\u09CB\u0997-\u09AC\u09BF\u09AF\u09BC\u09CB\u0997\u0964"
  ],
  powers: [
    "A power repeats multiplication. 2\xB3 means 2 \xD7 2 \xD7 2. It does not mean 2 \xD7 3.",
    "\u0998\u09BE\u09A4 \u09AE\u09BE\u09A8\u09C7 \u098F\u0995\u0987 \u09B8\u0982\u0996\u09CD\u09AF\u09BE \u09A6\u09BF\u09AF\u09BC\u09C7 \u09AC\u09BE\u09B0\u09AC\u09BE\u09B0 \u0997\u09C1\u09A3\u0964 \u09E8\xB3 \u09AE\u09BE\u09A8\u09C7 \u09E8 \xD7 \u09E8 \xD7 \u09E8\u0964 \u098F\u099F\u09BE \u09E8 \xD7 \u09E9 \u09A8\u09AF\u09BC\u0964"
  ],
  roots: [
    "A square root undoes squaring. The square root of 144 is 12 because 12 \xD7 12 = 144. Check the nearby squares too.",
    "\u09AC\u09B0\u09CD\u0997\u09AE\u09C2\u09B2 \u09AC\u09B0\u09CD\u0997\u09C7\u09B0 \u0989\u09B2\u09CD\u099F\u09CB \u0995\u09BE\u099C \u0995\u09B0\u09C7\u0964 \u09E7\u09EA\u09EA-\u098F\u09B0 \u09AC\u09B0\u09CD\u0997\u09AE\u09C2\u09B2 \u09E7\u09E8, \u0995\u09BE\u09B0\u09A3 \u09E7\u09E8 \xD7 \u09E7\u09E8 = \u09E7\u09EA\u09EA\u0964 \u09AA\u09BE\u09B6\u09C7\u09B0 \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u0997\u09C1\u09B2\u09CB\u09B0 \u09AC\u09B0\u09CD\u0997\u0993 \u09AE\u09BF\u09B2\u09BF\u09AF\u09BC\u09C7 \u09A6\u09C7\u0996\u09CB\u0964"
  ],
  equations: [
    "The equals sign means both sides balance. Do the same operation on both sides to uncover x. Put your answer back in the original equation to check.",
    "\u09B8\u09AE\u09BE\u09A8 \u099A\u09BF\u09B9\u09CD\u09A8 \u09AE\u09BE\u09A8\u09C7 \u09A6\u09C1\u0987 \u09AA\u09BE\u09B6 \u09B8\u09AE\u09BE\u09A8\u0964 \u09A6\u09C1\u0987 \u09AA\u09BE\u09B6\u09C7 \u098F\u0995\u0987 \u0995\u09BE\u099C \u0995\u09B0\u09C7 x \u0996\u09C1\u0981\u099C\u09C7 \u09AC\u09C7\u09B0 \u0995\u09B0\u09CB\u0964 \u09B6\u09C7\u09B7\u09C7 \u0986\u09B8\u09B2 \u0985\u0999\u09CD\u0995\u09C7 \u0989\u09A4\u09CD\u09A4\u09B0\u099F\u09BE \u09AC\u09B8\u09BF\u09AF\u09BC\u09C7 \u09AE\u09BF\u09B2\u09BF\u09AF\u09BC\u09C7 \u09A6\u09C7\u0996\u09CB\u0964"
  ],
  speed: [
    "Keep accuracy first. Start without a clock. After consistent correct answers, change only one thing: number size, sequence length, or display time.",
    "\u0986\u0997\u09C7 \u09A0\u09BF\u0995 \u0995\u09B0\u09CB\u0964 \u09B6\u09C1\u09B0\u09C1\u09A4\u09C7 \u0998\u09A1\u09BC\u09BF\u09B0 \u09A4\u09BE\u09A1\u09BC\u09BE \u09A8\u09C7\u0987\u0964 \u09AC\u09BE\u09B0\u09AC\u09BE\u09B0 \u09A0\u09BF\u0995 \u09B9\u09B2\u09C7 \u098F\u0995\u09AC\u09BE\u09B0\u09C7 \u098F\u0995\u099F\u09BE \u099C\u09BF\u09A8\u09BF\u09B8 \u09AC\u09BE\u09A1\u09BC\u09BE\u0993: \u09B8\u0982\u0996\u09CD\u09AF\u09BE, \u09A7\u09BE\u09AA, \u0985\u09A5\u09AC\u09BE \u0997\u09A4\u09BF\u0964"
  ],
  expert: [
    "Train one skill deliberately, then mix skills. Record accuracy and time separately. Return to mistakes. These practice levels are not an official competition title.",
    "\u098F\u0995\u099F\u09BE \u09A6\u0995\u09CD\u09B7\u09A4\u09BE \u0986\u09B2\u09BE\u09A6\u09BE \u0995\u09B0\u09C7 \u099A\u09B0\u09CD\u099A\u09BE \u0995\u09B0\u09CB, \u09A4\u09BE\u09B0\u09AA\u09B0 \u0985\u09A8\u09CD\u09AF\u0997\u09C1\u09B2\u09CB\u09B0 \u09B8\u0999\u09CD\u0997\u09C7 \u09AE\u09C7\u09B6\u09BE\u0993\u0964 \u0995\u09A4\u099F\u09BE \u09A0\u09BF\u0995 \u0986\u09B0 \u0995\u09A4 \u09B8\u09AE\u09AF\u09BC\u2014\u0986\u09B2\u09BE\u09A6\u09BE \u09A6\u09C7\u0996\u09CB\u0964 \u09AD\u09C1\u09B2 \u0985\u0999\u09CD\u0995\u09C7 \u09AB\u09BF\u09B0\u09C7 \u098F\u09B8\u09CB\u0964 \u098F\u0997\u09C1\u09B2\u09CB \u0985\u09A8\u09C1\u09B6\u09C0\u09B2\u09A8\u09C7\u09B0 \u09B8\u09CD\u09A4\u09B0, \u09AA\u09CD\u09B0\u09A4\u09BF\u09AF\u09CB\u0997\u09BF\u09A4\u09BE\u09B0 \u0996\u09C7\u09A4\u09BE\u09AC \u09A8\u09AF\u09BC\u0964"
  ]
};
concepts["root-estimate"] = [
  "Split the number into pairs of digits. Bring down one pair. Choose the largest digit d for which (20 \xD7 the root so far + d) \xD7 d fits. Subtract it, then bring down the next pair. Add pairs of zeros for decimal places. Use one extra digit to round. The answer is approximate.",
  "\u09B8\u0982\u0996\u09CD\u09AF\u09BE\u099F\u09BE\u0995\u09C7 \u09A1\u09BE\u09A8 \u09A6\u09BF\u0995 \u09A5\u09C7\u0995\u09C7 \u09A6\u09C1\u0987 \u0985\u0999\u09CD\u0995\u09C7\u09B0 \u09A6\u09B2\u09C7 \u09AD\u09BE\u0997 \u0995\u09B0\u09CB\u0964 \u098F\u0995 \u09A6\u09B2 \u09A8\u09BE\u09AE\u09BE\u0993\u0964 \u098F\u09AE\u09A8 \u09AC\u09A1\u09BC \u0985\u0999\u09CD\u0995 d \u09A8\u09BE\u0993 \u09AF\u09C7\u09A8 (\u098F \u09AA\u09B0\u09CD\u09AF\u09A8\u09CD\u09A4 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AE\u09C2\u09B2 \xD7 \u09E8\u09E6 + d) \xD7 d \u0985\u0982\u09B6\u099F\u09C1\u0995\u09C1\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 \u09A7\u09B0\u09C7\u0964 \u09AC\u09BF\u09AF\u09BC\u09CB\u0997 \u0995\u09B0\u09C7 \u09AA\u09B0\u09C7\u09B0 \u09A6\u09B2 \u09A8\u09BE\u09AE\u09BE\u0993\u0964 \u09A6\u09B6\u09AE\u09BF\u0995\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u099C\u09CB\u09A1\u09BC\u09BE \u09B6\u09C2\u09A8\u09CD\u09AF \u09A8\u09BE\u09AE\u09BE\u0993\u0964 \u09B6\u09C7\u09B7\u09C7 \u09AC\u09BE\u09A1\u09BC\u09A4\u09BF \u098F\u0995 \u0985\u0999\u09CD\u0995 \u09A6\u09C7\u0996\u09C7 \u0995\u09BE\u099B\u09BE\u0995\u09BE\u099B\u09BF \u09AE\u09BE\u09A8 \u09A8\u09BE\u0993\u0964"
];
export function concept(skill, lang2) {
  return (concepts[skill] || concepts.direct)[lang2 === "bn" ? 1 : 0];
}
export var normalLessons = createNormalLessons(lessons, concept);
export var allLessons = [...normalLessons, ...lessons];
export function lessonFor(skill) {
  return lessons.find((l) => l.id === skill) || lessons.find((l) => l.skill === skill) || lessons[0];
}
export function freshProgress() {
  return {
    schema: 2,
    lessons: {},
    attempts: [],
    settings: { lang: "en", sound: false },
    updatedAt: 0
  };
}
/** Orientation lessons (no questions) count as learned once the learner has been through them. */
export function markLearned(progress, lessonId) {
  const now = Date.now(), cur = progress.lessons[lessonId];
  if (cur && ["learned", "retained"].includes(cur.status)) return false;
  progress.lessons[lessonId] = {
    attempts: (cur?.attempts || 0) + 1, correct: (cur?.correct || 0) + 1, streak: 3, level: 1,
    days: [new Date(now).toLocaleDateString("en-CA")], items: ["intro-1", "intro-2", "intro-3"],
    status: "learned", firstLearnedAt: now, due: now + 365 * 864e5, last: now,
  };
  progress.updatedAt = now;
  return true;
}
export function recordAttempt(progress, {
  lessonId,
  correct,
  ms = 0,
  hinted = false,
  mode = "recall",
  expression = "",
  answer = "",
  expected = "",
  config: config2 = null
}) {
  const now = Date.now(), event = {
    id: globalThis.crypto?.randomUUID?.() || `${now}-${Math.random()}`,
    at: now,
    lessonId,
    correct,
    ms: Math.max(0, Math.round(ms)),
    hinted,
    mode,
    expression,
    answer,
    expected,
    config: config2
  };
  progress.attempts.push(event);
  progress.attempts = progress.attempts.slice(-1e3);
  while (progress.attempts.length > 1 && JSON.stringify(progress.attempts).length > 5e5)
    progress.attempts.shift();
  if (lessonId) {
    const l = progress.lessons[lessonId] || {
      attempts: 0,
      correct: 0,
      streak: 0,
      level: 0,
      days: [],
      items: []
    };
    l.items || (l.items = []);
    l.attempts++;
    l.correct += correct ? 1 : 0;
    l.streak = correct && !hinted ? l.streak + 1 : 0;
    if (correct && !hinted) {
      const day = new Date(now).toLocaleDateString("en-CA");
      if (!l.days.includes(day)) l.days.push(day);
      if (expression && !l.items.includes(expression)) l.items.push(expression);
      l.items = l.items.slice(-30);
      if (l.streak >= 3 && l.items.length >= 3)
        l.level = Math.min(3, l.level + 1);
    } else l.level = Math.max(0, l.level - 1);
    l.status = l.streak >= 3 && l.items.length >= 3 ? "learned" : "practicing";
    if (l.status === "learned" && !l.firstLearnedAt) l.firstLearnedAt = now;
    if (l.level >= 2 && l.days.length >= 2 && l.streak >= 3 && l.items.length >= 4 && now - (l.firstLearnedAt || now) >= 864e5)
      l.status = "retained";
    l.due = now + [0.04, 1, 3, 7][l.level] * 864e5;
    l.last = now;
    progress.lessons[lessonId] = l;
  }
  progress.updatedAt = now;
  return event;
}
