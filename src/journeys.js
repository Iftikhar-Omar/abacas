// File: journeys.js
// Directory: src/
// Builds the 17-lesson starter path from the catalogue: a traditional introduction first, then the hands-on lessons.

import { normalTitles } from './journey-i18n.js';
import { INTRO_ID } from './intro.js';

const titlesFor = (en, bn, order) => ({
  en,
  bn,
  ...Object.fromEntries(Object.entries(normalTitles).map(([lang2, values]) => [lang2, values[order]])),
});

/** The traditional introduction: it is read and watched, with no practice questions. */
function introLesson(en, bn, minutes, order) {
  return {
    id: INTRO_ID,
    title: titlesFor(en, bn, order),
    skill: "place",
    example: "46+38",
    practice: [],
    practiceIds: [],
    parts: [],
    idea: { en: "An abacus is a counting tool made of beads on sticks.", bn: "অ্যাবাকাস হলো কাঠির ওপর পুঁতি দিয়ে তৈরি গোনার যন্ত্র।" },
    order,
    unit: 0,
    minutes,
    prerequisite: null,
    journey: "normal",
    intro: true,
  };
}

export function createNormalLessons(catalog, ideaFor) {
  const rows4 = [
    ["intro", "What is an abacus?", "\u0985\u09CD\u09AF\u09BE\u09AC\u09BE\u0995\u09BE\u09B8 \u0995\u09C0?", "intro", [], [], 5],
    [
      "beads",
      "Your first beads",
      "\u099A\u09B2\u09CB \u09AA\u09C1\u0981\u09A4\u09BF \u0997\u09C1\u09A8\u09BF",
      "place",
      ["place"],
      ["place"],
      4
    ],
    [
      "bigbead",
      "The big bead",
      "\u09AC\u09A1\u09BC \u09AA\u09C1\u0981\u09A4\u09BF\u099F\u09BE",
      "five-bead",
      ["five-bead", "digits"],
      ["five-bead", "digits"],
      4
    ],
    [
      "places",
      "Ones, tens and fingers",
      "\u098F\u0995\u0995\u09C7\u09B0 \u09AA\u09BE\u09B6\u09C7 \u09A6\u09B6\u0995",
      "place",
      ["hands"],
      ["tens", "hands", "digits"],
      6
    ],
    [
      "moves",
      "Add some, take some",
      "\u0995\u09BF\u099B\u09C1 \u09A6\u09BF\u0987, \u0995\u09BF\u099B\u09C1 \u09B8\u09B0\u09BE\u0987",
      "direct",
      ["count"],
      ["count", "take", "number-four"],
      5
    ],
    [
      "five",
      "Make friends with five",
      "\u09AA\u09BE\u0981\u099A\u09C7\u09B0 \u09B8\u09BE\u09B9\u09BE\u09AF\u09CD\u09AF \u09A8\u09BF\u0987",
      "five",
      ["five-two"],
      ["five-two", "five-back", "five-mix"],
      7
    ],
    [
      "ten",
      "Cross into the next column",
      "\u09A6\u09B6\u09C7\u09B0 \u0998\u09B0\u09C7 \u09AF\u09BE\u0987",
      "ten",
      ["ten-friends"],
      ["ten", "ten-friends", "ten-five"],
      7
    ],
    [
      "borrow",
      "Bring a ten back",
      "\u09A6\u09B6 \u09AD\u09C7\u0999\u09C7 \u09AC\u09BF\u09AF\u09BC\u09CB\u0997 \u0995\u09B0\u09BF",
      "borrow",
      ["subtract"],
      ["borrow", "subtract", "ten-mix"],
      7
    ],
    [
      "bigger",
      "The same moves, bigger numbers",
      "\u09AC\u09A1\u09BC \u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09A4\u09C7\u0993 \u09AA\u09BE\u09B0\u09BF",
      "expert",
      ["hundreds", "carry-chain", "borrow-chain"],
      ["hundreds", "carry-chain", "borrow-chain"],
      8
    ],
    [
      "multiply",
      "Build equal groups",
      "\u09B8\u09AE\u09BE\u09A8 \u09A6\u09B2\u09C7 \u0997\u09C1\u09A3 \u0995\u09B0\u09BF",
      "multiply",
      ["multiply", "partial-products"],
      ["multiply", "times-five", "partial-products"],
      7
    ],
    [
      "divide",
      "Share equally",
      "\u09B8\u09AC\u09BE\u0987 \u09B8\u09AE\u09BE\u09A8 \u09AA\u09BE\u09AC\u09C7",
      "divide",
      ["divide", "long-division"],
      ["divide", "long-division", "divide"],
      8
    ],
    [
      "decimal",
      "Decimals and money",
      "\u099F\u09BE\u0995\u09BE\u09B0 \u09B9\u09BF\u09B8\u09BE\u09AC \u0995\u09B0\u09BF",
      "decimal",
      ["decimal", "money", "decimal-product"],
      ["decimal", "money", "decimal-product"],
      8
    ],
    [
      "parts",
      "Fractions and percentages",
      "\u09AA\u09C1\u09B0\u09CB\u099F\u09BE\u09B0 \u0995\u09A4\u099F\u09C1\u0995\u09C1?",
      "fractions",
      ["fractions", "fraction-subtract", "percent"],
      ["fractions", "fraction-subtract", "percent"],
      8
    ],
    [
      "signed",
      "Numbers below zero",
      "\u09B6\u09C2\u09A8\u09CD\u09AF\u09C7\u09B0 \u09A8\u09BF\u099A\u09C7 \u0995\u09C0 \u0986\u099B\u09C7?",
      "negative",
      ["negative", "negative-subtract", "negative-product"],
      ["negative", "negative-subtract", "negative-product"],
      7
    ],
    [
      "patterns",
      "Order, powers and roots",
      "\u0986\u0997\u09C7 \u0995\u09CB\u09A8\u099F\u09BE \u0995\u09B0\u09AC?",
      "order",
      ["order", "powers", "roots"],
      ["order", "powers", "roots"],
      9
    ],
    [
      "detective",
      "Hidden numbers and shortcuts",
      "\u09B8\u09B9\u099C \u09AA\u09A5\u09C7 \u0989\u09A4\u09CD\u09A4\u09B0 \u0996\u09C1\u0981\u099C\u09BF",
      "equations",
      ["equations", "balance", "compensate"],
      ["equations", "balance", "compensate"],
      9
    ],
    [
      "mental",
      "Picture it, then practise",
      "\u098F\u09AC\u09BE\u09B0 \u09AE\u09A8\u09C7 \u09AE\u09A8\u09C7 \u0995\u09B0\u09BF",
      "mental",
      ["mental", "mental-five", "mental-ten", "speed"],
      ["mental", "mental-five", "mental-ten"],
      8
    ]
  ];
  return rows4.map(
    ([id, en, bn, skill, members, practiceIds, minutes], order) => {
      if (id === "intro") return introLesson(en, bn, minutes, order);
      const parts = members.map((id2) => {
        const l = catalog.find((l2) => l2.id === id2);
        if (!l) throw Error(`Missing journey lesson: ${id2}`);
        let idea = l.idea || {
          en: ideaFor(l.skill, "en"),
          bn: ideaFor(l.skill, "bn")
        };
        if (id2 === "place")
          idea = { en: ideaFor("direct", "en"), bn: ideaFor("direct", "bn") };
        if (id2 === "digits")
          idea = {
            en: "Five above and four below make nine. Count only the beads next to the middle bar.",
            bn: "\u0993\u09AA\u09B0\u09C7 \u09AA\u09BE\u0981\u099A, \u09A8\u09BF\u099A\u09C7 \u099A\u09BE\u09B0\u2014\u09AE\u09BF\u09B2\u09C7 \u09A8\u09AF\u09BC\u0964 \u09AE\u09BE\u099D\u09C7\u09B0 \u09A6\u09BE\u0997\u09C7\u09B0 \u0995\u09BE\u099B\u09C7 \u09A5\u09BE\u0995\u09BE \u09AA\u09C1\u0981\u09A4\u09BF\u0997\u09C1\u09B2\u09CB\u0987 \u0997\u09C1\u09A8\u09AC\u0964"
          };
        return { ...l, idea };
      });
      const guided = parts.find((l) => l.id !== "zero") || parts[0];
      return {
        id: `normal-${id}`,
        title: {
          en,
          bn,
          ...Object.fromEntries(
            Object.entries(normalTitles).map(([lang2, values]) => [
              lang2,
              values[order]
            ])
          )
        },
        skill,
        example: guided.example,
        practice: practiceIds.flatMap(
          (id2) => catalog.find((l) => l.id === id2).practice
        ),
        practiceIds,
        parts,
        idea: parts[0].idea,
        order,
        unit: guided.unit,
        minutes,
        prerequisite: order ? `normal-${rows4[order - 1][0]}` : null,
        journey: "normal"
      };
    }
  );
}
