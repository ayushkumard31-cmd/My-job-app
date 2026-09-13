// The built-in starter library: every resource kind, for every subject, in
// every branch and semester — plus YouTube and hobby material.
//
// Firestore holds what *your college's* admin publishes. This file holds what a
// student gets on day one, before any admin has uploaded anything (and even
// with Firebase switched off entirely). Both flow through the same screens:
// see ./library. Admin items sort first, these fill in underneath.
//
// Two deliberate shapes here:
//
//   * Links are *search* URLs on endpoints that don't move (YouTube, Google,
//     Open Library, GeeksforGeeks) — not hard-coded video ids or PDF links. A
//     hand-listed direct link for ~200 subjects can't be checked from here and
//     rots silently into a dead embed; a search for "Operating Systems full
//     course one shot" is still the right answer in three years. An admin who
//     wants one exact video pastes it in the Admin panel — that item carries a
//     youtubeId and plays inline.
//   * Ids are stable strings (`starter:cse-3-…`), so a student's likes, saves
//     and watched marks survive a reload and resolve on the Liked page without
//     a network round trip.

import { BRANCHES, HOBBIES, SEMESTERS, subjectsFor } from "./catalog";
import { collegeItems, universityItems } from "./colleges";
import { gameItems } from "./games";
import {
  bookSearch,
  gfgSearch,
  isStarterId,
  resourceItem as item,
  siteSearch,
  slug,
  webSearch,
  ytSearch,
} from "./links";

export { STARTER_PREFIX, isStarterId } from "./links";

// --------------------------------------------------------------- tracks --
// A subject's track decides which teachers to point at and which reference
// site is worth linking. Matching is on the subject name, so a branch that
// isn't in ./catalog yet still lands somewhere sensible.

const TRACKS = {
  cs: {
    channels: ["Gate Smashers", "Neso Academy", "Jenny's Lectures CS IT", "Apna College", "CodeWithHarry"],
    reference: { label: "GeeksforGeeks", url: (s) => gfgSearch(s) },
  },
  maths: {
    channels: ["Dr Gajendra Purohit", "Neso Academy", "Khan Academy", "3Blue1Brown"],
    reference: { label: "Khan Academy", url: (s) => siteSearch("khanacademy.org", s) },
  },
  physics: {
    channels: ["Physics Wallah", "The Organic Chemistry Tutor", "Neso Academy"],
    reference: { label: "LibreTexts Physics", url: (s) => siteSearch("phys.libretexts.org", s) },
  },
  chemistry: {
    channels: ["Physics Wallah", "The Organic Chemistry Tutor"],
    reference: { label: "LibreTexts Chemistry", url: (s) => siteSearch("chem.libretexts.org", s) },
  },
  electronics: {
    channels: ["Neso Academy", "Gate Smashers", "ALL ABOUT ELECTRONICS"],
    reference: { label: "All About Circuits", url: (s) => siteSearch("allaboutcircuits.com", s) },
  },
  electrical: {
    channels: ["Neso Academy", "Electrical Engineering Academy", "NPTEL"],
    reference: { label: "All About Circuits", url: (s) => siteSearch("allaboutcircuits.com", s) },
  },
  mechanical: {
    channels: ["Magic Marks", "NPTEL", "The Efficient Engineer"],
    reference: { label: "NPTEL notes", url: (s) => siteSearch("nptel.ac.in", s) },
  },
  civil: {
    channels: ["Civil Guruji", "NPTEL", "Learn Civil Engineering"],
    reference: { label: "NPTEL notes", url: (s) => siteSearch("nptel.ac.in", s) },
  },
  chemical: {
    channels: ["NPTEL", "LearnChemE"],
    reference: { label: "LearnChemE", url: (s) => siteSearch("learncheme.com", s) },
  },
  general: {
    channels: ["NPTEL", "Neso Academy", "Khan Academy"],
    reference: { label: "NPTEL courses", url: (s) => siteSearch("nptel.ac.in", s) },
  },
};

// First match wins, so the specific patterns come before the broad ones.
const TRACK_RULES = [
  [/mathematic|algebra|calculus|probabilit|statistic|numerical method|discrete/i, "maths"],
  [/physics/i, "physics"],
  [/chemistry|organic|inorganic/i, "chemistry"],
  [
    /chemical|mass transfer|reaction engineering|petroleum|process (calculation|dynamics|equipment|modelling|control)|transport phenomena|refining/i,
    "chemical",
  ],
  [
    /data structure|algorithm|programming|problem solving|\bjava\b|python|operating system|dbms|database|computer network|compiler|software|web tech|machine learning|deep learning|artificial intelligence|data science|data mining|data warehous|big data|cloud|information security|network security|reinforcement|computer vision|natural language|generative ai|theory of computation|\boop\b|computer organi|mobile computing|data visual|\biot\b|it workshop|mlops|data ethics|time series/i,
    "cs",
  ],
  [
    /electronic|signals? ?(&|and)? ?systems|vlsi|antenna|microwave|optical communication|wireless|satellite|digital (logic|communication|signal)|embedded|microprocessor|microcontroller|communication system|analog|network theory/i,
    "electronics",
  ],
  [
    /electrical|power system|power electronic|electrical machine|circuit theory|drives|switchgear|high voltage|electromagnetic|renewable energy|utilization of electrical|measurement (&|and) instrument|instrumentation|control system/i,
    "electrical",
  ],
  [
    /thermodynamic|fluid|machine (design|drawing|element)|theory of machines|manufactur|heat (&|and)? ?mass|heat transfer|refrigerat|automobile|metrology|strength of materials|finite element|cad\/cam|\bcad\b|ic engine|material science|materials science|mechanics|dynamics of machinery|industrial engineering|operations research|mechanical operation/i,
    "mechanical",
  ],
  [
    /structur|concrete|geotechnic|surveying|transportation|hydraulic|environmental engineering|estimation|construction|earthquake|building material|water resources/i,
    "civil",
  ],
  [/engineering graphics|engineering drawing/i, "mechanical"],
];

function trackFor(subject) {
  const hit = TRACK_RULES.find(([re]) => re.test(subject));
  return TRACKS[hit?.[1] || "general"];
}

// Subjects with no syllabus of their own — a "PYQ paper" for Major Project II
// would be a lie, so these get a how-to pack instead of the full set.
const OPEN_ENDED = /project|seminar|internship|industrial training|elective/i;

// Only these get a lab manual; a lab manual for Engineering Mathematics I isn't
// a thing, and an empty search result is worse than no card.
const PRACTICAL =
  /lab|workshop|programming|problem solving|graphics|drawing|physics|chemistry|machine|circuit|electronic|manufactur|surveying|\bcad\b|network|dbms|database|data structure|python|\bjava\b|web tech|mechanic|fluid|metrology|instrumentation|microprocessor|embedded|vlsi|signal|it workshop|concrete|geotechnic/i;

// ---------------------------------------------------------------- items --

/** Every starter resource for one subject, one card per kind. */
function subjectPack(branch, semester, subject) {
  const track = trackFor(subject);
  const [first, second, third] = track.channels;
  const base = `${slug(branch)}-${semester}-${slug(subject)}`;
  const at = (kind, n, fields) => item(`${base}-${kind}${n ? `-${n}` : ""}`, { branch, semester, subject, kind, ...fields });

  if (OPEN_ENDED.test(subject)) {
    return [
      at("video", 1, {
        title: `${subject} — How to choose and build it`,
        channel: first,
        url: ytSearch(`engineering ${subject} ideas and how to start`),
        description: "Picking a topic, scoping it, and what examiners actually look for.",
      }),
      at("video", 2, {
        title: `${subject} — Report & presentation guide`,
        channel: second,
        url: ytSearch(`${subject} report format and presentation tips engineering`),
        description: "Report structure, plagiarism checks and viva preparation.",
      }),
      at("link", 1, {
        title: `${subject} — Ideas, formats and templates`,
        url: webSearch(`final year engineering ${subject} ideas report format template`),
      }),
      at("book", 0, {
        title: `${subject} — Reference reading`,
        url: bookSearch(`engineering ${subject}`),
        description: "Open Library — borrow or preview.",
      }),
    ];
  }

  const pack = [
    at("video", 1, {
      title: `${subject} — Full course (one shot)`,
      channel: first,
      url: ytSearch(`${subject} full course one shot ${first}`),
      description: "Whole-subject lecture series — start here if you're beginning from zero.",
    }),
    at("video", 2, {
      title: `${subject} — Lecture playlist`,
      channel: second,
      url: ytSearch(`${second} ${subject} playlist`),
      description: "Unit-by-unit lectures, in syllabus order.",
    }),
    at("video", 3, {
      title: `${subject} — Last-minute revision`,
      channel: third || first,
      url: ytSearch(`${subject} important questions revision before exam`),
      description: "Quick revision and the questions that repeat every year.",
    }),
    at("video", 4, {
      title: `${subject} — Numericals & solved problems`,
      channel: first,
      url: ytSearch(`${subject} numericals solved problems examples`),
      description: "Worked examples of the problem types that show up in papers.",
    }),
    at("notes", 0, {
      title: `${subject} — Notes (PDF)`,
      url: webSearch(`${subject} notes pdf engineering`),
      description: "Handwritten and typed unit-wise notes.",
    }),
    at("pyq", 0, {
      title: `${subject} — Previous year question papers`,
      url: webSearch(`${subject} previous year question paper pdf university`),
      description: "Past papers — solve at least the last five years.",
    }),
    at("important", 0, {
      title: `${subject} — Important questions`,
      url: webSearch(`${subject} important questions unit wise with answers pdf`),
      description: "Repeated and high-weightage questions, unit by unit.",
    }),
    at("assignment", 0, {
      title: `${subject} — Assignments & tutorial sheets`,
      url: webSearch(`${subject} assignment questions tutorial sheet pdf`),
      description: "Practice sets you can hand in or drill with.",
    }),
    at("book", 0, {
      title: `${subject} — Reference books`,
      url: bookSearch(subject),
      description: "Open Library — borrow or preview the standard textbooks.",
    }),
    at("link", 1, {
      title: `${subject} on ${track.reference.label}`,
      url: track.reference.url(subject),
      description: "Written explanations to read alongside the lectures.",
    }),
    at("link", 2, {
      title: `${subject} — NPTEL / MOOC courses`,
      url: siteSearch("nptel.ac.in", subject),
      description: "Free university courses, many with certification.",
    }),
  ];

  if (PRACTICAL.test(subject)) {
    pack.push(
      at("lab", 0, {
        title: `${subject} — Lab manual & practical file`,
        url: webSearch(`${subject} lab manual pdf experiments viva questions`),
        description: "Experiments, readings and the viva questions that follow them.",
      }),
    );
  }

  return pack;
}

/** The whole-semester rows: syllabus and exam material, not tied to a subject. */
function semesterPack(branch, semester) {
  const b = BRANCHES.find((x) => x.id === branch);
  const label = b ? b.label.replace(/\s*\(.*\)$/, "") : "Engineering";
  const base = `${slug(branch)}-${semester}`;
  return [
    item(`${base}-syllabus`, {
      branch,
      semester,
      kind: "syllabus",
      title: `Semester ${semester} syllabus — ${label}`,
      url: webSearch(`${label} semester ${semester} syllabus pdf university`),
      description:
        "Find your own university's copy — syllabi differ per university, so check the code on the cover.",
    }),
    item(`${base}-pyq-all`, {
      branch,
      semester,
      kind: "pyq",
      title: `Semester ${semester} question papers — all subjects`,
      url: webSearch(`${label} semester ${semester} previous year question papers pdf`),
      description: "Whole-semester paper bundles from past exams.",
    }),
  ];
}

// ---------------------------------------------------------------- cache --
// Built once per branch+semester and kept: the pages that read it re-render on
// every filter change, and rebuilding ~60 objects each time is pure waste.

const packs = new Map();

/** Every starter item for one branch + semester, ready to concat onto Firestore's. */
export function starterItemsFor(branch, semester) {
  const sem = Number(semester);
  if (!branch || !sem) return EMPTY;
  const key = `${branch}:${sem}`;
  if (!packs.has(key)) {
    const subjects = subjectsFor(branch, sem);
    packs.set(key, [
      ...semesterPack(branch, sem),
      ...subjects.flatMap((s) => subjectPack(branch, sem, s)),
    ]);
  }
  return packs.get(key);
}

const EMPTY = [];

/**
 * The same pack for a subject that isn't in ./catalog — one the syllabus
 * planner just read out of a PDF, say. Deliberately outside the id index:
 * there's no finite list of free-text subjects to walk, so the planner renders
 * these as plain links rather than likeable cards.
 */
export function packForSubject(subject) {
  return subject ? subjectPack("free", 0, subject) : EMPTY;
}

// --------------------------------------------------------------- hobbies --
// Two curated searches per hobby, because "Gaming tutorial" is useless and
// "game development for beginners" isn't.

const HOBBY_QUERIES = {
  gym: ["beginner gym workout plan for skinny guys", "push pull legs split explained form guide"],
  running: ["couch to 5k running plan for beginners", "running form and breathing technique"],
  football: ["football skills training drills for beginners", "football fitness and stamina training"],
  cricket: ["cricket batting technique basics coaching", "cricket bowling action tips for beginners"],
  badminton: ["badminton basics footwork and grip for beginners", "badminton smash and net play drills"],
  yoga: ["yoga for beginners 30 day full course", "guided meditation for focus and stress"],
  gaming: ["game development for beginners full course", "how to improve aim and game sense guide"],
  music: ["guitar lessons for absolute beginners full course", "music theory basics for beginners"],
  drawing: ["drawing for beginners fundamentals course", "digital art tutorial for beginners"],
  photography: ["photography basics exposure triangle tutorial", "phone photography tips and editing"],
  reading: ["how to read more books and remember them", "best books for engineering students"],
  movies: ["anime recommendations by genre", "film analysis and cinematography explained"],
  content: ["how to start a youtube channel in 2026", "video editing tutorial for beginners"],
  coding: ["build a project from scratch tutorial", "open source contribution for beginners"],
  chess: ["chess openings for beginners explained", "chess tactics and endgame basics"],
  writing: ["how to start a blog and write well", "technical writing for beginners"],
  dance: ["dance for beginners basic steps tutorial", "hip hop dance choreography beginners"],
  cycling: ["cycling for beginners training plan", "bike maintenance basics tutorial"],
  volunteering: ["how to run a college club and events", "leadership and public speaking tips students"],
  cooking: ["easy hostel recipes for students", "cooking basics knife skills for beginners"],
};

let hobbyPack = null;

/** Starter material for every hobby in the catalogue. */
export function starterHobbyItems() {
  if (hobbyPack) return hobbyPack;
  hobbyPack = HOBBIES.flatMap((h) => {
    const [q1, q2] = HOBBY_QUERIES[h.id] || [`${h.label} for beginners`, `${h.label} full course`];
    const base = `hobby-${slug(h.id)}`;
    const row = (id, fields) =>
      item(`${base}-${id}`, { scope: "hobby", hobby: h.id, branch: null, semester: null, ...fields });
    return [
      row("video-1", {
        kind: "video",
        title: `${h.label} — Beginner's guide`,
        url: ytSearch(q1),
        description: "Start here — the fundamentals, done properly.",
      }),
      row("video-2", {
        kind: "video",
        title: `${h.label} — Go deeper`,
        url: ytSearch(q2),
        description: "The next step once the basics feel easy.",
      }),
      row("link-1", {
        kind: "link",
        title: `${h.label} — Guides & communities`,
        url: webSearch(`${h.label} beginner guide community forum`),
        description: "Written guides and places to ask questions.",
      }),
    ];
  });
  return hobbyPack;
}

// ---------------------------------------------------------------- lookup --

let index = null;

/**
 * Resolves a starter id back to its item — the Liked page stores ids, and these
 * ones can't be fetched from Firestore. Built lazily and only once: it walks
 * every branch, semester, college and game, which is wasted work for a student
 * who never opened that page.
 */
export function starterById(id) {
  if (!isStarterId(id)) return null;
  if (!index) {
    index = new Map();
    const add = (i) => index.set(i.id, i);
    BRANCHES.forEach((b) => SEMESTERS.forEach((s) => starterItemsFor(b.id, s).forEach(add)));
    starterHobbyItems().forEach(add);
    universityItems().forEach(add);
    collegeItems().forEach(add);
    gameItems().forEach(add);
  }
  return index.get(id) || null;
}
