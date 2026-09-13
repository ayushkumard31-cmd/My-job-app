// Universities and colleges, with the paperwork every student hunts for:
// syllabus, question papers, results, exam notices, academic calendar.
//
// Scope is West Bengal, because that's who this build is for: MAKAUT (the old
// WBUT, which affiliates most of the state's engineering colleges), Jadavpur
// University and the University of Calcutta.
//
// Two honesty rules this file follows:
//
//   * Only the three university homepages are hard-coded URLs — those are
//     stable and easy to check. Everything deeper (a syllabus page, a results
//     portal, one college's site) is a *search*, because affiliation lists and
//     site structures change every year and a wrong deep link is worse than no
//     link. See ./links.
//   * MAKAUT affiliates roughly 200 institutes; the list below is the ~90
//     best-known ones, not the register. The picker therefore always allows a
//     typed-in college, and the UI says where the authoritative list lives.

import { resourceItem, siteSearch, slug, webSearch } from "./links";

// ---------------------------------------------------------- universities --

export const UNIVERSITIES = [
  {
    id: "makaut",
    name: "MAKAUT, West Bengal",
    full: "Maulana Abul Kalam Azad University of Technology (formerly WBUT)",
    emoji: "🏛️",
    city: "Haringhata, Nadia",
    site: "https://makautwb.ac.in/",
    affiliating: true,
    note: "Affiliates most engineering, pharmacy and management colleges in West Bengal.",
  },
  {
    id: "jadavpur",
    name: "Jadavpur University",
    full: "Jadavpur University — Faculty of Engineering & Technology",
    emoji: "🎓",
    city: "Jadavpur & Salt Lake, Kolkata",
    site: "https://jaduniv.edu.in/",
    affiliating: false,
    note: "A unitary university — it teaches on its own campuses rather than affiliating colleges.",
  },
  {
    id: "calcutta",
    name: "University of Calcutta",
    full: "University of Calcutta — including the Faculty of Technology, Rajabazar",
    emoji: "🏫",
    city: "College Street, Kolkata",
    site: "https://www.caluniv.ac.in/",
    affiliating: true,
    note: "Affiliates the older Kolkata degree colleges; technology sits at Rajabazar Science College.",
  },
];

export const universityById = (id) => UNIVERSITIES.find((u) => u.id === id) || UNIVERSITIES[0];

// -------------------------------------------------------------- colleges --
// `gov` marks a government or government-aided institute — the fee difference
// is the first thing anyone asks about, so it's worth showing on the card.

const MAKAUT = [
  // Government / government-aided
  { name: "Kalyani Government Engineering College", city: "Kalyani, Nadia", gov: true },
  { name: "Jalpaiguri Government Engineering College", city: "Jalpaiguri", gov: true },
  { name: "Cooch Behar Government Engineering College", city: "Cooch Behar", gov: true },
  { name: "Ramkrishna Mahato Government Engineering College", city: "Purulia", gov: true },
  { name: "Government College of Engineering & Ceramic Technology", city: "Kolkata", gov: true },
  { name: "Government College of Engineering & Leather Technology", city: "Kolkata", gov: true },
  { name: "Government College of Engineering & Textile Technology, Serampore", city: "Serampore, Hooghly", gov: true },
  { name: "Government College of Engineering & Textile Technology, Berhampore", city: "Berhampore, Murshidabad", gov: true },

  // Kolkata & Greater Kolkata
  { name: "Heritage Institute of Technology", city: "Anandapur, Kolkata" },
  { name: "Institute of Engineering & Management (IEM)", city: "Salt Lake, Kolkata" },
  { name: "Techno Main Salt Lake", city: "Salt Lake, Kolkata" },
  { name: "Techno India College of Technology", city: "Rajarhat, Kolkata" },
  { name: "Netaji Subhash Engineering College", city: "Garia, Kolkata" },
  { name: "RCC Institute of Information Technology", city: "Beliaghata, Kolkata" },
  { name: "Meghnad Saha Institute of Technology", city: "Nazirabad, Kolkata" },
  { name: "B. P. Poddar Institute of Management & Technology", city: "Poddar Vihar, Kolkata" },
  { name: "Future Institute of Engineering & Management", city: "Sonarpur, Kolkata" },
  { name: "Calcutta Institute of Engineering & Management", city: "Tollygunge, Kolkata" },
  { name: "Calcutta Institute of Technology", city: "Uluberia, Howrah" },
  { name: "St. Thomas' College of Engineering & Technology", city: "Khidderpore, Kolkata" },
  { name: "Dr. Sudhir Chandra Sur Institute of Technology & Sports Complex", city: "Dum Dum, Kolkata" },
  { name: "Guru Nanak Institute of Technology", city: "Panihati, Kolkata" },
  { name: "Narula Institute of Technology", city: "Agarpara, Kolkata" },
  { name: "JIS College of Engineering", city: "Kalyani, Nadia" },
  { name: "Bengal Institute of Technology", city: "Basanti Highway, Kolkata" },
  { name: "Camellia Institute of Technology", city: "Madhyamgram, Kolkata" },
  { name: "Elitte College of Engineering", city: "Sodepur, Kolkata" },
  { name: "Budge Budge Institute of Technology", city: "Budge Budge, Kolkata" },
  { name: "Swami Vivekananda Institute of Science & Technology", city: "Sonarpur, Kolkata" },
  { name: "Institute of Science & Technology", city: "Chandrakona Town, Paschim Medinipur" },
  { name: "Regent Education & Research Foundation", city: "Barrackpore, North 24 Parganas" },
  { name: "Greater Kolkata College of Engineering & Management", city: "Baruipur, Kolkata" },
  { name: "Aryabhatta Institute of Engineering & Management", city: "Durgapur" },
  { name: "Sanaka Educational Trust's Group of Institutions", city: "Durgapur" },

  // Howrah & Hooghly
  { name: "MCKV Institute of Engineering", city: "Liluah, Howrah" },
  { name: "Seacom Engineering College", city: "Dhulagori, Howrah" },
  { name: "Academy of Technology", city: "Adisaptagram, Hooghly" },
  { name: "Supreme Knowledge Foundation Group of Institutions", city: "Mankundu, Hooghly" },
  { name: "Hooghly Engineering & Technology College", city: "Chinsurah, Hooghly" },
  { name: "Om Dayal Group of Institutions", city: "Uluberia, Howrah" },
  { name: "Birbhum Institute of Engineering & Technology", city: "Suri, Birbhum" },

  // South 24 Parganas & Nadia
  { name: "Neotia Institute of Technology, Management & Science", city: "Diamond Harbour, South 24 Parganas" },
  { name: "Global Institute of Management & Technology", city: "Krishnanagar, Nadia" },
  { name: "College of Engineering & Management, Kolaghat", city: "Kolaghat, Purba Medinipur" },
  { name: "Haldia Institute of Technology", city: "Haldia, Purba Medinipur" },
  { name: "Ideal Institute of Engineering", city: "Kalyani, Nadia" },
  { name: "Kanad Institute of Engineering & Management", city: "Mankar, Purba Bardhaman" },

  // Durgapur, Asansol & the west
  { name: "Dr. B. C. Roy Engineering College", city: "Durgapur, Paschim Bardhaman" },
  { name: "Bengal College of Engineering & Technology", city: "Durgapur, Paschim Bardhaman" },
  { name: "Durgapur Institute of Advanced Technology & Management", city: "Durgapur" },
  { name: "Asansol Engineering College", city: "Asansol, Paschim Bardhaman" },
  { name: "Bankura Unnayani Institute of Engineering", city: "Bankura" },
  { name: "Dr. B. C. Roy Academy of Professional Courses", city: "Durgapur" },
  { name: "Mallabhum Institute of Technology", city: "Bishnupur, Bankura" },

  // North Bengal & Murshidabad
  { name: "Siliguri Institute of Technology", city: "Siliguri, Darjeeling" },
  { name: "Jalpaiguri Institute of Technology", city: "Jalpaiguri" },
  { name: "Dumkal Institute of Engineering & Technology", city: "Dumkal, Murshidabad" },
  { name: "Murshidabad College of Engineering & Technology", city: "Berhampore, Murshidabad" },
  { name: "Bengal Institute of Technology & Management", city: "Santiniketan, Birbhum" },
  { name: "Abacus Institute of Engineering & Management", city: "Mogra, Hooghly" },
  { name: "Modern Institute of Engineering & Technology", city: "Bandel, Hooghly" },
  { name: "Pailan College of Management & Technology", city: "Joka, Kolkata" },
];

// The University of Calcutta's own technology faculty plus the best-known
// affiliated degree colleges. Engineering students here are mostly at Rajabazar.
const CALCUTTA = [
  { name: "University College of Technology (Rajabazar Science College)", city: "Rajabazar, Kolkata", gov: true },
  { name: "Institute of Radio Physics & Electronics", city: "Rajabazar, Kolkata", gov: true },
  { name: "A. K. Choudhury School of Information Technology", city: "Rajabazar, Kolkata", gov: true },
  { name: "Asutosh College", city: "Bhowanipore, Kolkata" },
  { name: "Scottish Church College", city: "Bidhan Sarani, Kolkata" },
  { name: "Bethune College", city: "Hedua, Kolkata" },
  { name: "Maulana Azad College", city: "Rafi Ahmed Kidwai Road, Kolkata" },
  { name: "Vidyasagar College", city: "College Street, Kolkata" },
  { name: "Surendranath College", city: "Sealdah, Kolkata" },
  { name: "City College", city: "Amherst Street, Kolkata" },
  { name: "Bangabasi College", city: "Rajkumar Chakraborty Sarani, Kolkata" },
  { name: "Lady Brabourne College", city: "Park Circus, Kolkata" },
  { name: "Jogamaya Devi College", city: "Hazra, Kolkata" },
  { name: "Gurudas College", city: "Narkeldanga, Kolkata" },
  { name: "Heramba Chandra College", city: "Golpark, Kolkata" },
  { name: "Rammohan College", city: "Raja Rammohan Sarani, Kolkata" },
  { name: "Seth Anandram Jaipuria College", city: "Amherst Street, Kolkata" },
  { name: "Goenka College of Commerce & Business Administration", city: "College Street, Kolkata" },
  { name: "Shri Shikshayatan College", city: "Lord Sinha Road, Kolkata" },
  { name: "The Bhawanipur Education Society College", city: "Bhowanipore, Kolkata" },
  { name: "Loreto College", city: "Middleton Row, Kolkata" },
  { name: "Acharya Prafulla Chandra College", city: "New Barrackpore, Kolkata" },
  { name: "Barrackpore Rastraguru Surendranath College", city: "Barrackpore, North 24 Parganas" },
  { name: "Sivanath Sastri College", city: "Bhowanipore, Kolkata" },
  { name: "Netaji Nagar Day College", city: "Netaji Nagar, Kolkata" },
];

// Jadavpur teaches on its own campuses, so its "colleges" are its campuses.
const JADAVPUR = [
  { name: "Jadavpur University — Main Campus", city: "Jadavpur, Kolkata", gov: true },
  { name: "Jadavpur University — Salt Lake Campus (Engineering & Technology)", city: "Salt Lake, Kolkata", gov: true },
];

const taken = new Set();

/**
 * Ids are the truncated slug of the name, which two colleges can collide on —
 * the Serampore and Berhampore textile colleges differ only after the 44th
 * character. A colliding id would key two rows the same in React and resolve
 * the wrong one out of the library index, so collisions get a numeric suffix.
 */
function expand(list, university) {
  return list.map((c) => {
    let id = `${university}-${slug(c.name).slice(0, 44)}`;
    for (let n = 2; taken.has(id); n++) id = `${university}-${slug(c.name).slice(0, 42)}-${n}`;
    taken.add(id);
    return { id, name: c.name, city: c.city, gov: !!c.gov, university };
  });
}

export const COLLEGES = [
  ...expand(MAKAUT, "makaut"),
  ...expand(JADAVPUR, "jadavpur"),
  ...expand(CALCUTTA, "calcutta"),
];

export const collegeById = (id) => COLLEGES.find((c) => c.id === id) || null;

export function collegesFor(universityId) {
  return COLLEGES.filter((c) => c.university === universityId);
}

/** The display name for a profile — a picked college, a typed one, or nothing. */
export function collegeLabel(profile) {
  if (!profile) return "";
  return collegeById(profile.college)?.name || profile.collegeName || "";
}

// ------------------------------------------------------------- resources --

const host = (u) => {
  try {
    return new URL(u).hostname;
  } catch {
    return "";
  }
};

/**
 * The paperwork trail for a university: syllabus, papers, results, notices.
 * Shaped like library rows so the same cards and like buttons work on them.
 */
export function universityResources(universityId) {
  const u = universityById(universityId);
  const site = host(u.site);
  const row = (id, fields) =>
    resourceItem(`uni-${u.id}-${id}`, { scope: "college", university: u.id, ...fields });

  return [
    row("site", {
      kind: "link",
      title: `${u.name} — official website`,
      url: u.site,
      description: u.note,
    }),
    row("syllabus", {
      kind: "syllabus",
      title: `${u.name} — syllabus & curriculum`,
      url: siteSearch(site, "syllabus curriculum structure"),
      description: "Course structure and detailed syllabus, branch by branch.",
    }),
    row("pyq", {
      kind: "pyq",
      title: `${u.name} — previous year question papers`,
      url: webSearch(`${u.name} previous year question papers pdf semester`),
      description: "Past semester papers — the fastest read of what actually gets asked.",
    }),
    row("results", {
      kind: "link",
      title: `${u.name} — results & mark sheets`,
      url: webSearch(`${u.name} semester result portal`),
      description: "Published results and revaluation notices.",
    }),
    row("notices", {
      kind: "link",
      title: `${u.name} — exam notices & academic calendar`,
      url: siteSearch(site, "notice academic calendar examination schedule"),
      description: "Form-fill dates, exam schedule and holiday list.",
    }),
    row("admission", {
      kind: "link",
      title: `${u.name} — admission & counselling`,
      url: siteSearch(site, "admission counselling eligibility"),
      description: "Eligibility, seat matrix and counselling rounds.",
    }),
    row("notes", {
      kind: "notes",
      title: `${u.name} — student notes & drives`,
      url: webSearch(`${u.name} semester notes pdf drive telegram`),
      description: "Shared note drives seniors pass down. Quality varies — cross-check.",
    }),
  ];
}

/** The same trail, narrowed to one college: its own site, papers and placements. */
export function collegeResources(college) {
  if (!college) return [];
  const c = typeof college === "string" ? collegeById(college) : college;
  if (!c) return [];
  const u = universityById(c.university);
  const row = (id, fields) =>
    resourceItem(`college-${c.id}-${id}`, { scope: "college", university: c.university, ...fields });

  return [
    row("site", {
      kind: "link",
      title: `${c.name} — official website`,
      url: webSearch(`${c.name} ${c.city} official website`),
      description: `${c.gov ? "Government institute" : "Private institute"} · affiliated to ${u.name}.`,
    }),
    row("notices", {
      kind: "link",
      title: `${c.name} — notices & academic calendar`,
      url: webSearch(`${c.name} notice academic calendar exam schedule`),
      description: "Class routine, internal exam dates and holiday list.",
    }),
    row("pyq", {
      kind: "pyq",
      title: `${c.name} — internal & sessional papers`,
      url: webSearch(`${c.name} internal assessment previous year question paper pdf`),
      description: "Internals are set in-house, so old ones are the best guide you'll get.",
    }),
    row("notes", {
      kind: "notes",
      title: `${c.name} — seniors' notes & drives`,
      url: webSearch(`${c.name} notes pdf drive telegram group students`),
      description: "Shared drives and study groups from students at this college.",
    }),
    row("placement", {
      kind: "link",
      title: `${c.name} — placements & companies`,
      url: webSearch(`${c.name} placement record companies package`),
      description: "Who recruits here, and what the packages actually look like.",
    }),
    row("admission", {
      kind: "link",
      title: `${c.name} — admission, fees & cut-offs`,
      url: webSearch(`${c.name} admission fees WBJEE cutoff rank`),
      description: "Fee structure and last year's closing ranks.",
    }),
  ];
}

/** Every college and university row, for the id index in ./starter. */
export function universityItems() {
  return UNIVERSITIES.flatMap((u) => universityResources(u.id));
}

export function collegeItems() {
  return COLLEGES.flatMap((c) => collegeResources(c));
}
