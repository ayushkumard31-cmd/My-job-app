// Games that teach programming — the "I can't face another lecture" tab.
//
// These are the one place in the built-in library with hard-coded deep links
// rather than searches (see ./links): a game is a specific site, and "codewars"
// on Google is not the same promise as codewars.com. Kept to sites that have
// been around for years for exactly that reason.
//
// `level` is who it's for, not how hard the puzzles get: browse → play in a
// browser tab with no setup, build → you write real code against a real problem.

import { resourceItem, slug } from "./links";

export const GAME_TAGS = [
  { id: "start", label: "Absolute beginner", emoji: "🌱" },
  { id: "dsa", label: "DSA & problem solving", emoji: "🧩" },
  { id: "web", label: "HTML / CSS / JS", emoji: "🎨" },
  { id: "sql", label: "SQL & data", emoji: "🗄️" },
  { id: "tools", label: "Git, shell & editors", emoji: "🛠️" },
  { id: "security", label: "Security & CTF", emoji: "🔐" },
  { id: "contest", label: "Contests & ladders", emoji: "🏆" },
];

export const GAMES = [
  // -- absolute beginner ---------------------------------------------------
  {
    id: "blockly",
    name: "Blockly Games",
    url: "https://blockly.games/",
    emoji: "🧱",
    tags: ["start"],
    free: true,
    blurb: "Google's drag-and-block puzzles that quietly turn into real JavaScript by the last level.",
  },
  {
    id: "codecombat",
    name: "CodeCombat",
    url: "https://codecombat.com/",
    emoji: "⚔️",
    tags: ["start"],
    free: "partly",
    blurb: "An RPG where your hero only moves when you write correct Python or JavaScript.",
  },
  {
    id: "codemonkey",
    name: "CodeMonkey",
    url: "https://www.playcodemonkey.com/",
    emoji: "🐒",
    tags: ["start"],
    free: "partly",
    blurb: "Short, forgiving levels — good for the week you're still scared of syntax errors.",
  },

  // -- DSA & general problem solving ---------------------------------------
  {
    id: "codingame",
    name: "CodinGame",
    url: "https://www.codingame.com/",
    emoji: "🎮",
    tags: ["dsa", "contest"],
    free: true,
    blurb: "Puzzles rendered as playable games, in 25+ languages. Clash of Code is 5-minute speed coding against strangers.",
  },
  {
    id: "codewars",
    name: "Codewars",
    url: "https://www.codewars.com/",
    emoji: "🥋",
    tags: ["dsa"],
    free: true,
    blurb: "Kata you solve then compare against everyone else's solution — the comparison is where the learning is.",
  },
  {
    id: "checkio",
    name: "CheckiO",
    url: "https://checkio.org/",
    emoji: "🏝️",
    tags: ["dsa"],
    free: true,
    blurb: "Python and TypeScript islands, unlocked by solving the island before them.",
  },
  {
    id: "edabit",
    name: "Edabit",
    url: "https://edabit.com/challenges",
    emoji: "🧠",
    tags: ["dsa", "start"],
    free: true,
    blurb: "Bite-sized challenges sorted very finely by difficulty — the gentlest on-ramp to daily practice.",
  },
  {
    id: "euler",
    name: "Project Euler",
    url: "https://projecteuler.net/",
    emoji: "➗",
    tags: ["dsa"],
    free: true,
    blurb: "Maths-heavy problems where the naive loop takes a year to run. Teaches complexity the hard way.",
  },
  {
    id: "advent",
    name: "Advent of Code",
    url: "https://adventofcode.com/",
    emoji: "🎄",
    tags: ["dsa", "contest"],
    free: true,
    blurb: "25 December puzzles, a two-part story each. Every past year stays playable all year round.",
  },
  {
    id: "screeps",
    name: "Screeps",
    url: "https://screeps.com/",
    emoji: "🤖",
    tags: ["dsa"],
    free: "partly",
    blurb: "An MMO where your colony runs your JavaScript 24/7 — even while you sleep. Bad code loses territory.",
  },
  {
    id: "battlesnake",
    name: "Battlesnake",
    url: "https://play.battlesnake.com/",
    emoji: "🐍",
    tags: ["dsa", "contest"],
    free: true,
    blurb: "Write a snake AI as a web server and put it in a live arena. A genuinely fun pathfinding project.",
  },
  {
    id: "elevator",
    name: "Elevator Saga",
    url: "https://play.elevatorsaga.com/",
    emoji: "🛗",
    tags: ["dsa"],
    free: true,
    blurb: "Program a bank of lifts to hit a target throughput. Scheduling theory disguised as a puzzle.",
  },
  {
    id: "untrusted",
    name: "Untrusted",
    url: "https://untrustedgame.com/",
    emoji: "📟",
    tags: ["dsa"],
    free: true,
    blurb: "Escape a roguelike by editing the JavaScript that generates each level while you're inside it.",
  },

  // -- frontend ------------------------------------------------------------
  {
    id: "froggy",
    name: "Flexbox Froggy",
    url: "https://flexboxfroggy.com/",
    emoji: "🐸",
    tags: ["web", "start"],
    free: true,
    blurb: "24 levels and you will never again guess at justify-content. The fastest hour in web dev.",
  },
  {
    id: "gridgarden",
    name: "Grid Garden",
    url: "https://cssgridgarden.com/",
    emoji: "🥕",
    tags: ["web", "start"],
    free: true,
    blurb: "Same idea, for CSS Grid — water the carrots with grid-column and grid-row.",
  },
  {
    id: "flexboxdefense",
    name: "Flexbox Defense",
    url: "http://www.flexboxdefense.com/",
    emoji: "🗼",
    tags: ["web"],
    free: true,
    blurb: "Tower defence where flexbox properties are how you position the towers.",
  },
  {
    id: "cssbattle",
    name: "CSS Battle",
    url: "https://cssbattle.dev/",
    emoji: "🎯",
    tags: ["web", "contest"],
    free: true,
    blurb: "Reproduce a target image in the fewest CSS characters possible. Addictive and genuinely instructive.",
  },
  {
    id: "cssdiner",
    name: "CSS Diner",
    url: "https://flukeout.github.io/",
    emoji: "🍽️",
    tags: ["web", "start"],
    free: true,
    blurb: "32 levels of CSS selectors, from `div` to `:nth-child`. Do this before your first interview.",
  },
  {
    id: "jsrobot",
    name: "JS Robot",
    url: "https://lab.reaal.me/jsrobot/",
    emoji: "🦾",
    tags: ["web", "start"],
    free: true,
    blurb: "Move a robot with plain JavaScript, one loop and condition at a time.",
  },

  // -- SQL & data ----------------------------------------------------------
  {
    id: "sqlmurder",
    name: "SQL Murder Mystery",
    url: "https://mystery.knightlab.com/",
    emoji: "🕵️",
    tags: ["sql", "start"],
    free: true,
    blurb: "Solve a murder using nothing but SELECT and JOIN. The single best first hour with SQL.",
  },
  {
    id: "sqlzoo",
    name: "SQLZoo",
    url: "https://sqlzoo.net/",
    emoji: "🦓",
    tags: ["sql"],
    free: true,
    blurb: "Graded SQL exercises against real datasets, straight in the browser. Exam-shaped questions.",
  },
  {
    id: "sqlbolt",
    name: "SQLBolt",
    url: "https://sqlbolt.com/",
    emoji: "⚡",
    tags: ["sql", "start"],
    free: true,
    blurb: "Interactive lessons that build from SELECT to sub-queries without ever installing a database.",
  },
  {
    id: "kaggle",
    name: "Kaggle Competitions",
    url: "https://www.kaggle.com/competitions",
    emoji: "📊",
    tags: ["sql", "contest"],
    free: true,
    blurb: "Real datasets, a live leaderboard, and public notebooks to learn from. The data-science equivalent of contests.",
  },

  // -- tools ---------------------------------------------------------------
  {
    id: "gitbranching",
    name: "Learn Git Branching",
    url: "https://learngitbranching.js.org/",
    emoji: "🌳",
    tags: ["tools", "start"],
    free: true,
    blurb: "The commit graph animates as you type real git commands. Rebase finally makes sense here.",
  },
  {
    id: "vimadventures",
    name: "VIM Adventures",
    url: "https://vim-adventures.com/",
    emoji: "⌨️",
    tags: ["tools"],
    free: "partly",
    blurb: "A Zelda-ish overworld where hjkl is how you walk. Muscle memory, painlessly.",
  },
  {
    id: "regexcrossword",
    name: "Regex Crossword",
    url: "https://regexcrossword.com/",
    emoji: "🔤",
    tags: ["tools"],
    free: true,
    blurb: "Crosswords whose clues are regular expressions. Turns regex from copy-paste into something you read.",
  },
  {
    id: "terminus",
    name: "Terminus",
    url: "https://web.mit.edu/mprat/Public/web/Terminus/Web/main.html",
    emoji: "💻",
    tags: ["tools", "start"],
    free: true,
    blurb: "A text adventure you navigate with cd, ls and cat — the shell, learned by wandering.",
  },
  {
    id: "monkeytype",
    name: "Monkeytype",
    url: "https://monkeytype.com/",
    emoji: "⏱️",
    tags: ["tools", "start"],
    free: true,
    blurb: "Typing speed with a code mode. Underrated: slow typing really does cost you in timed rounds.",
  },

  // -- security ------------------------------------------------------------
  {
    id: "picoctf",
    name: "picoCTF",
    url: "https://picoctf.org/",
    emoji: "🚩",
    tags: ["security", "start"],
    free: true,
    blurb: "Carnegie Mellon's beginner CTF, with every past year left open to practise on.",
  },
  {
    id: "overthewire",
    name: "OverTheWire: Bandit",
    url: "https://overthewire.org/wargames/bandit/",
    emoji: "🔓",
    tags: ["security", "tools"],
    free: true,
    blurb: "SSH into a server and claw your way up 30+ levels. The classic Linux-and-security starting point.",
  },
  {
    id: "tryhackme",
    name: "TryHackMe",
    url: "https://tryhackme.com/",
    emoji: "🛡️",
    tags: ["security"],
    free: "partly",
    blurb: "Guided rooms with the machine already running in your browser — no lab to build first.",
  },
  {
    id: "hackthebox",
    name: "Hack The Box",
    url: "https://www.hackthebox.com/",
    emoji: "📦",
    tags: ["security"],
    free: "partly",
    blurb: "Harder, less hand-holding boxes. Go here after Bandit and picoCTF stop being scary.",
  },

  // -- contests ------------------------------------------------------------
  {
    id: "leetcode",
    name: "LeetCode",
    url: "https://leetcode.com/",
    emoji: "🧮",
    tags: ["dsa", "contest"],
    free: "partly",
    blurb: "The placement standard. Weekly contests are the closest free thing to an on-campus coding round.",
  },
  {
    id: "codeforces",
    name: "Codeforces",
    url: "https://codeforces.com/",
    emoji: "🏁",
    tags: ["contest", "dsa"],
    free: true,
    blurb: "Rated contests every week and a problem set you can filter by exact topic and rating.",
  },
  {
    id: "codechef",
    name: "CodeChef",
    url: "https://www.codechef.com/",
    emoji: "👨‍🍳",
    tags: ["contest", "dsa"],
    free: true,
    blurb: "Long and short contests with a large Indian student field — good for a first rating.",
  },
  {
    id: "hackerrank",
    name: "HackerRank",
    url: "https://www.hackerrank.com/",
    emoji: "✅",
    tags: ["contest", "dsa"],
    free: true,
    blurb: "Skill certificates and company-style assessments — many campus tests are literally hosted here.",
  },
  {
    id: "atcoder",
    name: "AtCoder",
    url: "https://atcoder.jp/",
    emoji: "🇯🇵",
    tags: ["contest"],
    free: true,
    blurb: "Beautifully-set beginner contests (ABC) every weekend. The best problem statements in the business.",
  },
  {
    id: "exercism",
    name: "Exercism",
    url: "https://exercism.org/",
    emoji: "🧑‍🏫",
    tags: ["dsa", "start"],
    free: true,
    blurb: "70+ language tracks with free human mentoring on your submissions. Rare and worth using.",
  },
];

export const gameById = (id) => GAMES.find((g) => g.id === id) || null;

export const tagById = (id) => GAME_TAGS.find((t) => t.id === id) || null;

/** Games as library rows, so likes, saves and the Liked page work on them too. */
export function gameItems() {
  return GAMES.map((g) =>
    resourceItem(`game-${slug(g.id)}`, {
      scope: "game",
      kind: "link",
      title: g.name,
      url: g.url,
      description: g.blurb,
      game: g.id,
      tags: g.tags,
      emoji: g.emoji,
      free: g.free,
    }),
  );
}

/** The same rows, filtered to one tag ("" = all). */
export function gameItemsFor(tag) {
  const all = gameItems();
  return tag ? all.filter((g) => g.tags.includes(tag)) : all;
}
