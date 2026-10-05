// Static catalogues: branches + subjects, career goals + roadmaps, hobbies, day modes.
// Everything the routine generator draws from lives here, so adding a new goal or
// hobby is a data change, not a code change.

export const CATEGORIES = {
  college: { label: "College", color: "#6366f1", emoji: "🎓" },
  academics: { label: "Academics", color: "#0ea5e9", emoji: "📚" },
  career: { label: "Career", color: "#8b5cf6", emoji: "💻" },
  fitness: { label: "Fitness", color: "#22c55e", emoji: "🏋️" },
  hobby: { label: "Hobbies", color: "#f59e0b", emoji: "🎮" },
  meal: { label: "Meals", color: "#f97316", emoji: "🍽️" },
  rest: { label: "Rest", color: "#94a3b8", emoji: "😴" },
  custom: { label: "Custom", color: "#ec4899", emoji: "✨" },
};

export const catColor = (id) => (CATEGORIES[id] || CATEGORIES.custom).color;

export const PRIORITIES = {
  high: { label: "High", color: "#ef4444", dot: "🔴", factor: 1.25, rank: 0 },
  medium: { label: "Medium", color: "#f59e0b", dot: "🟡", factor: 1, rank: 1 },
  low: { label: "Low", color: "#22c55e", dot: "🟢", factor: 0.7, rank: 2 },
};

// ---------------------------------------------------------------- branches --

const SEM1 = [
  "Engineering Mathematics I",
  "Engineering Physics",
  "Engineering Chemistry",
  "Programming for Problem Solving",
  "Engineering Graphics",
];
const SEM2 = [
  "Engineering Mathematics II",
  "Basic Electrical Engineering",
  "Engineering Mechanics",
  "Environmental Science",
  "Communication Skills",
];

export const BRANCHES = [
  {
    id: "cse",
    label: "Computer Science (CSE)",
    emoji: "💻",
    semesters: {
      1: SEM1,
      2: SEM2,
      3: ["Data Structures", "Mathematics III", "Digital Logic Design", "OOP with Java", "Computer Organization"],
      4: ["Design & Analysis of Algorithms", "Operating Systems", "DBMS", "Theory of Computation", "Probability & Statistics"],
      5: ["Computer Networks", "Software Engineering", "Compiler Design", "Web Technologies", "Microprocessors"],
      6: ["Machine Learning", "Cloud Computing", "Information Security", "Data Mining", "Minor Project"],
      7: ["Artificial Intelligence", "Big Data Analytics", "Distributed Systems", "Elective I", "Major Project I"],
      8: ["Elective II", "Elective III", "Major Project II", "Internship / Industrial Training"],
    },
  },
  {
    id: "it",
    label: "Information Technology (IT)",
    emoji: "🌐",
    semesters: {
      1: SEM1,
      2: SEM2,
      3: ["Data Structures", "Digital Electronics", "OOP with Java", "Discrete Mathematics", "IT Workshop"],
      4: ["Operating Systems", "DBMS", "Computer Networks", "Algorithms", "Software Engineering"],
      5: ["Web Technologies", "Information Security", "Mobile Computing", "Data Warehousing", "Python Programming"],
      6: ["Cloud Computing", "Machine Learning", "Network Security", "Software Testing", "Minor Project"],
      7: ["Big Data Analytics", "IoT", "Elective I", "Major Project I", "Seminar"],
      8: ["Elective II", "Elective III", "Major Project II", "Internship"],
    },
  },
  {
    id: "aids",
    label: "AI & Data Science",
    emoji: "🤖",
    semesters: {
      1: SEM1,
      2: SEM2,
      3: ["Data Structures", "Linear Algebra", "Python for Data Science", "Digital Logic", "Discrete Mathematics"],
      4: ["Probability & Statistics", "DBMS", "Operating Systems", "Machine Learning Fundamentals", "Algorithms"],
      5: ["Deep Learning", "Data Visualization", "Computer Networks", "Natural Language Processing", "Big Data"],
      6: ["Reinforcement Learning", "Computer Vision", "Cloud & MLOps", "Data Ethics", "Minor Project"],
      7: ["Time Series Analysis", "Generative AI", "Elective I", "Major Project I", "Seminar"],
      8: ["Elective II", "Elective III", "Major Project II", "Internship"],
    },
  },
  {
    id: "ece",
    label: "Electronics & Communication (ECE)",
    emoji: "📡",
    semesters: {
      1: SEM1,
      2: SEM2,
      3: ["Network Theory", "Electronic Devices & Circuits", "Signals & Systems", "Digital Electronics", "Mathematics III"],
      4: ["Analog Circuits", "Microprocessors & Microcontrollers", "Electromagnetic Theory", "Communication Systems", "Control Systems"],
      5: ["Digital Signal Processing", "VLSI Design", "Antenna & Wave Propagation", "Digital Communication", "Embedded Systems"],
      6: ["Microwave Engineering", "Optical Communication", "Wireless Communication", "IoT", "Minor Project"],
      7: ["Satellite Communication", "Elective I", "Elective II", "Major Project I", "Seminar"],
      8: ["Elective III", "Major Project II", "Internship"],
    },
  },
  {
    id: "ee",
    label: "Electrical Engineering (EE)",
    emoji: "⚡",
    semesters: {
      1: SEM1,
      2: SEM2,
      3: ["Circuit Theory", "Electrical Machines I", "Electromagnetic Fields", "Digital Electronics", "Mathematics III"],
      4: ["Electrical Machines II", "Power Systems I", "Control Systems", "Measurement & Instrumentation", "Analog Electronics"],
      5: ["Power Electronics", "Power Systems II", "Microprocessors", "Signals & Systems", "Electrical Drives"],
      6: ["Switchgear & Protection", "Renewable Energy Systems", "High Voltage Engineering", "Utilization of Electrical Energy", "Minor Project"],
      7: ["Power System Operation", "Elective I", "Elective II", "Major Project I", "Seminar"],
      8: ["Elective III", "Major Project II", "Internship"],
    },
  },
  {
    id: "me",
    label: "Mechanical Engineering (ME)",
    emoji: "⚙️",
    semesters: {
      1: SEM1,
      2: SEM2,
      3: ["Thermodynamics", "Strength of Materials", "Manufacturing Processes", "Materials Science", "Mathematics III"],
      4: ["Fluid Mechanics", "Theory of Machines", "Applied Thermodynamics", "Machine Drawing", "Measurement & Metrology"],
      5: ["Heat & Mass Transfer", "Design of Machine Elements", "Dynamics of Machinery", "Industrial Engineering", "IC Engines"],
      6: ["Refrigeration & Air Conditioning", "CAD/CAM", "Machine Design II", "Automobile Engineering", "Minor Project"],
      7: ["Finite Element Analysis", "Operations Research", "Elective I", "Major Project I", "Seminar"],
      8: ["Elective II", "Elective III", "Major Project II", "Internship"],
    },
  },
  {
    id: "ce",
    label: "Civil Engineering (CE)",
    emoji: "🏗️",
    semesters: {
      1: SEM1,
      2: SEM2,
      3: ["Strength of Materials", "Fluid Mechanics", "Surveying", "Building Materials & Construction", "Mathematics III"],
      4: ["Structural Analysis I", "Concrete Technology", "Geotechnical Engineering I", "Hydraulics", "Transportation Engineering I"],
      5: ["Structural Analysis II", "Design of RC Structures", "Geotechnical Engineering II", "Environmental Engineering I", "Transportation Engineering II"],
      6: ["Design of Steel Structures", "Water Resources Engineering", "Environmental Engineering II", "Estimation & Costing", "Minor Project"],
      7: ["Construction Management", "Earthquake Engineering", "Elective I", "Major Project I", "Seminar"],
      8: ["Elective II", "Elective III", "Major Project II", "Internship"],
    },
  },
  {
    id: "che",
    label: "Chemical Engineering",
    emoji: "🧪",
    semesters: {
      1: SEM1,
      2: SEM2,
      3: ["Fluid Flow Operations", "Chemical Process Calculations", "Thermodynamics I", "Material Science", "Mathematics III"],
      4: ["Heat Transfer", "Mechanical Operations", "Thermodynamics II", "Chemical Reaction Engineering I", "Instrumentation"],
      5: ["Mass Transfer I", "Chemical Reaction Engineering II", "Process Dynamics & Control", "Petroleum Refining", "Numerical Methods"],
      6: ["Mass Transfer II", "Process Equipment Design", "Transport Phenomena", "Safety in Process Industries", "Minor Project"],
      7: ["Process Modelling & Simulation", "Elective I", "Elective II", "Major Project I", "Seminar"],
      8: ["Elective III", "Major Project II", "Internship"],
    },
  },
  { id: "other", label: "Other branch", emoji: "🎓", semesters: { 1: SEM1, 2: SEM2 } },
];

export function subjectsFor(branchId, semester) {
  const b = BRANCHES.find((x) => x.id === branchId);
  const list = b?.semesters?.[semester];
  if (list?.length) return list;
  return semester % 2 === 1 ? SEM1 : SEM2;
}

// ------------------------------------------------------------ career goals --
// `blocks` are the study/practice activities the generator tries to fit into the
// day. `stages` are the long-term roadmap, spread across the student's horizon.

export const CAREER_GOALS = [
  {
    id: "software",
    label: "Software Developer",
    emoji: "💻",
    tagline: "Code every day, ship real projects, crack DSA.",
    blocks: [
      { label: "DSA Practice", emoji: "🧩", minutes: 60, pref: "evening", category: "career" },
      { label: "Project Coding", emoji: "🛠️", minutes: 60, pref: "night", category: "career" },
      { label: "Learn New Tech", emoji: "📖", minutes: 30, pref: "evening", category: "career" },
    ],
    stages: [
      { title: "Programming Foundations", items: ["Pick one language & master syntax", "50 basic problems", "Git + GitHub basics"] },
      { title: "Core CS + Frontend", items: ["HTML/CSS/JavaScript", "Build 2 small UI projects", "Arrays, strings, hashing"] },
      { title: "Frameworks", items: ["React fundamentals", "State management + routing", "Clone a real app"] },
      { title: "Backend & APIs", items: ["Node/Express or Spring", "REST APIs + auth", "Deploy a backend"] },
      { title: "Databases", items: ["SQL joins & indexing", "MongoDB basics", "Connect DB to your app"] },
      { title: "Portfolio Projects", items: ["1 full-stack flagship project", "Write a good README", "Host it live"] },
      { title: "DSA Depth", items: ["Trees, graphs, DP", "150 curated problems", "2 contests / month"] },
      { title: "Interview Prep", items: ["Resume + GitHub cleanup", "Mock interviews", "System design basics"] },
    ],
    tasks: ["Solve 3 DSA problems", "Push today's code to GitHub", "Read 1 engineering blog"],
  },
  {
    id: "datascience",
    label: "Data Scientist",
    emoji: "📊",
    tagline: "Math, Python and models — with notebooks to show for it.",
    blocks: [
      { label: "Python / Pandas Practice", emoji: "🐍", minutes: 60, pref: "evening", category: "career" },
      { label: "ML Concepts", emoji: "🧠", minutes: 45, pref: "night", category: "career" },
      { label: "Kaggle / Dataset Work", emoji: "📈", minutes: 45, pref: "night", category: "career" },
    ],
    stages: [
      { title: "Python & Stats", items: ["Python for data", "Descriptive statistics", "NumPy basics"] },
      { title: "Data Wrangling", items: ["Pandas deep dive", "Cleaning messy datasets", "EDA on 2 datasets"] },
      { title: "Visualisation", items: ["Matplotlib / Seaborn", "Dashboards", "Tell a story with data"] },
      { title: "Classical ML", items: ["Regression & classification", "Model evaluation", "Feature engineering"] },
      { title: "Advanced ML", items: ["Ensembles", "Unsupervised learning", "Hyperparameter tuning"] },
      { title: "Deep Learning", items: ["Neural nets", "PyTorch or TensorFlow", "One CV or NLP project"] },
      { title: "Projects & SQL", items: ["End-to-end pipeline", "SQL for analytics", "Deploy a model"] },
      { title: "Interview Prep", items: ["Stats + ML theory revision", "Case study practice", "Portfolio polish"] },
    ],
    tasks: ["Do 1 dataset EDA", "Revise 1 ML algorithm", "Solve 5 SQL queries"],
  },
  {
    id: "core",
    label: "Core Engineer (Branch Job)",
    emoji: "⚙️",
    tagline: "Depth in your own branch + design software skills.",
    blocks: [
      { label: "Core Subject Deep Study", emoji: "📐", minutes: 60, pref: "evening", category: "career" },
      { label: "Design Software Practice", emoji: "🖥️", minutes: 45, pref: "night", category: "career" },
      { label: "Numericals Practice", emoji: "✏️", minutes: 30, pref: "night", category: "career" },
    ],
    stages: [
      { title: "Fundamentals", items: ["List 5 core subjects", "Standard textbook per subject", "Basic numericals"] },
      { title: "Software Skills", items: ["AutoCAD / SolidWorks / MATLAB", "Do 5 guided models", "Learn shortcuts"] },
      { title: "Applied Depth", items: ["Design calculations", "Case studies", "Industry standards"] },
      { title: "Certification", items: ["Pick 1 industry certification", "Complete the course", "Take the exam"] },
      { title: "Project", items: ["Branch capstone project", "Fabricate / simulate", "Document it"] },
      { title: "Internship", items: ["Apply to 20 core companies", "Prepare a core resume", "Do the internship"] },
      { title: "Aptitude", items: ["Quant + reasoning daily", "Company-wise papers", "Speed practice"] },
      { title: "Interview Prep", items: ["Core technical revision", "HR round prep", "Mock interviews"] },
    ],
    tasks: ["Solve 10 numericals", "Practice 1 CAD model", "Revise 1 core topic"],
  },
  {
    id: "gate",
    label: "GATE Preparation",
    emoji: "🎯",
    tagline: "Syllabus coverage + PYQs + tests, every single day.",
    blocks: [
      { label: "GATE Subject Study", emoji: "📘", minutes: 75, pref: "evening", category: "career" },
      { label: "Engineering Mathematics", emoji: "➗", minutes: 45, pref: "morning", category: "career" },
      { label: "PYQ / Practice Questions", emoji: "📝", minutes: 45, pref: "night", category: "career" },
    ],
    stages: [
      { title: "Syllabus Mapping", items: ["Print the syllabus", "Rank subjects by weightage", "Fix a daily target"] },
      { title: "Engineering Maths", items: ["Linear algebra & calculus", "Probability", "Numerical methods"] },
      { title: "High-weightage Subjects", items: ["Cover top 3 subjects", "Short notes per topic", "Formula sheet"] },
      { title: "Medium-weightage Subjects", items: ["Next 3 subjects", "Solve chapter exercises", "Update notes"] },
      { title: "Remaining Syllabus", items: ["Finish leftovers", "Aptitude practice", "First full revision"] },
      { title: "PYQ Grind", items: ["Last 10 years, subject-wise", "Error log", "Timed sets"] },
      { title: "Test Series", items: ["2 full tests / week", "Analyse every mistake", "Fix weak areas"] },
      { title: "Final Revision", items: ["Formula sheet revision", "Short notes only", "Mock exam routine"] },
    ],
    tasks: ["Finish 1 GATE topic", "Solve 20 PYQs", "Revise formula sheet"],
  },
  {
    id: "govt",
    label: "Government Exams",
    emoji: "🏛️",
    tagline: "Static syllabus + current affairs + daily practice sets.",
    blocks: [
      { label: "Static Syllabus Study", emoji: "📗", minutes: 60, pref: "morning", category: "career" },
      { label: "Current Affairs", emoji: "🗞️", minutes: 30, pref: "evening", category: "career" },
      { label: "Practice Set / Mock", emoji: "🧮", minutes: 45, pref: "night", category: "career" },
    ],
    stages: [
      { title: "Exam Selection", items: ["Pick target exams", "Understand the pattern", "Collect standard books"] },
      { title: "Quant & Reasoning", items: ["Basic concepts", "Daily 30 questions", "Speed techniques"] },
      { title: "English", items: ["Grammar rules", "Vocabulary habit", "Comprehension practice"] },
      { title: "General Awareness", items: ["Daily current affairs", "Monthly compilations", "Static GK"] },
      { title: "Technical / Optional", items: ["Branch subjects", "PYQs", "Short notes"] },
      { title: "Mock Phase", items: ["2 mocks / week", "Sectional tests", "Analysis log"] },
      { title: "Revision", items: ["Revise notes", "Repeat weak topics", "Formula + facts"] },
      { title: "Final Sprint", items: ["Daily full mock", "Exam-day simulation", "Stay calm & healthy"] },
    ],
    tasks: ["Read today's current affairs", "Solve 1 practice set", "Revise 1 static topic"],
  },
  {
    id: "higherstudies",
    label: "Higher Studies (MS / M.Tech)",
    emoji: "🎓",
    tagline: "CGPA, entrance exams, research and applications.",
    blocks: [
      { label: "Entrance Exam Prep", emoji: "📕", minutes: 60, pref: "evening", category: "career" },
      { label: "Research Reading", emoji: "🔬", minutes: 45, pref: "night", category: "career" },
      { label: "Application Work", emoji: "✉️", minutes: 30, pref: "night", category: "career" },
    ],
    stages: [
      { title: "Target Setting", items: ["Shortlist universities", "Note eligibility", "Deadline calendar"] },
      { title: "Exam Prep I", items: ["GRE / GATE basics", "Vocabulary or maths", "Weekly test"] },
      { title: "CGPA Focus", items: ["Semester topper plan", "Assignment quality", "Professor rapport"] },
      { title: "Research Exposure", items: ["Read 10 papers", "Join a lab / project", "Learn a research tool"] },
      { title: "Exam Prep II", items: ["Full mocks", "Weak-area drills", "Book the exam"] },
      { title: "Documents", items: ["SOP drafts", "LOR requests", "Resume / CV"] },
      { title: "Applications", items: ["Submit applications", "Track portals", "Scholarships"] },
      { title: "Interviews", items: ["Research interviews", "Visa / admission steps", "Plan finances"] },
    ],
    tasks: ["Read 1 research paper", "Study 1 entrance topic", "Work on SOP"],
  },
  {
    id: "startup",
    label: "Startup / Founder",
    emoji: "🚀",
    tagline: "Build, talk to users, iterate — alongside your degree.",
    blocks: [
      { label: "Build the Product", emoji: "🛠️", minutes: 75, pref: "night", category: "career" },
      { label: "Customer / Market Research", emoji: "🔍", minutes: 30, pref: "evening", category: "career" },
      { label: "Learn Business Skills", emoji: "📈", minutes: 30, pref: "evening", category: "career" },
    ],
    stages: [
      { title: "Problem Discovery", items: ["List 10 problems you face", "Talk to 10 people", "Pick one"] },
      { title: "Validation", items: ["Landing page", "50 survey responses", "Define the user"] },
      { title: "MVP Build", items: ["Smallest useful version", "Ship in 4 weeks", "Get 10 users"] },
      { title: "Feedback Loop", items: ["User interviews", "Fix top 3 complaints", "Weekly release"] },
      { title: "Growth Basics", items: ["One channel only", "Content or community", "Track metrics"] },
      { title: "Business Model", items: ["Pricing experiment", "Unit economics", "First revenue"] },
      { title: "Team & Legal", items: ["Co-founder clarity", "Register if needed", "Basic contracts"] },
      { title: "Pitch", items: ["Deck", "Apply to incubators", "Practice the pitch"] },
    ],
    tasks: ["Talk to 1 potential user", "Ship 1 improvement", "Review this week's metrics"],
  },
  {
    id: "freelancing",
    label: "Freelancing",
    emoji: "💼",
    tagline: "A skill, a portfolio, and clients who pay for it.",
    blocks: [
      { label: "Skill Practice", emoji: "🎯", minutes: 60, pref: "evening", category: "career" },
      { label: "Client Work", emoji: "💼", minutes: 60, pref: "night", category: "career" },
      { label: "Portfolio / Outreach", emoji: "📤", minutes: 30, pref: "night", category: "career" },
    ],
    stages: [
      { title: "Pick a Skill", items: ["Choose one service", "Study top freelancers", "Set a learning plan"] },
      { title: "Skill Building", items: ["Complete 1 course", "3 practice pieces", "Get feedback"] },
      { title: "Portfolio", items: ["Build a portfolio site", "3 case studies", "Testimonials from friends"] },
      { title: "Profiles", items: ["Upwork / Fiverr profile", "LinkedIn optimisation", "Pricing decision"] },
      { title: "First Clients", items: ["10 proposals / week", "Cold outreach", "Land first paid gig"] },
      { title: "Delivery", items: ["Scope & contracts", "On-time delivery", "5-star reviews"] },
      { title: "Scale", items: ["Raise prices", "Repeat clients", "Referral system"] },
      { title: "Systemise", items: ["Templates", "Invoicing & taxes", "Monthly income target"] },
    ],
    tasks: ["Send 3 proposals", "Work on client task", "Update portfolio"],
  },
  {
    id: "placement",
    label: "Placement Preparation",
    emoji: "🏢",
    tagline: "Aptitude + DSA + core + HR, on a campus timeline.",
    blocks: [
      { label: "Aptitude Practice", emoji: "🧮", minutes: 45, pref: "morning", category: "career" },
      { label: "DSA / Coding Round Prep", emoji: "🧩", minutes: 60, pref: "evening", category: "career" },
      { label: "Core Subject Revision", emoji: "📚", minutes: 45, pref: "night", category: "career" },
    ],
    stages: [
      { title: "Resume", items: ["1-page resume", "2 solid projects", "Get it reviewed"] },
      { title: "Aptitude", items: ["Quant formulas", "Logical reasoning", "Verbal ability"] },
      { title: "Coding Basics", items: ["Language mastery", "Arrays & strings", "50 easy problems"] },
      { title: "DSA Core", items: ["Linked lists, stacks, queues", "Trees & graphs", "100 medium problems"] },
      { title: "CS Fundamentals", items: ["OS, DBMS, CN, OOP", "Short notes", "Interview questions"] },
      { title: "Company Prep", items: ["Target company list", "PYQ patterns", "Online assessments"] },
      { title: "Mock Rounds", items: ["Mock coding rounds", "Technical interviews", "Group discussions"] },
      { title: "HR & Final", items: ["HR questions", "Introduce yourself", "Offer negotiation"] },
    ],
    tasks: ["Solve 20 aptitude questions", "Solve 2 DSA problems", "Revise 1 CS subject topic"],
  },
];

export const goalById = (id) => CAREER_GOALS.find((g) => g.id === id) || CAREER_GOALS[0];

// ------------------------------------------------------------------ hobbies --

export const HOBBIES = [
  { id: "gym", label: "Gym", emoji: "🏋️", minutes: 75, pref: "evening", days: 4, category: "fitness" },
  { id: "running", label: "Running / Jogging", emoji: "🏃", minutes: 45, pref: "morning", days: 4, category: "fitness" },
  { id: "football", label: "Football", emoji: "⚽", minutes: 90, pref: "evening", days: 3, category: "fitness" },
  { id: "cricket", label: "Cricket", emoji: "🏏", minutes: 90, pref: "evening", days: 3, category: "fitness" },
  { id: "badminton", label: "Badminton", emoji: "🏸", minutes: 60, pref: "evening", days: 3, category: "fitness" },
  { id: "yoga", label: "Yoga / Meditation", emoji: "🧘", minutes: 30, pref: "morning", days: 5, category: "fitness" },
  { id: "gaming", label: "Gaming", emoji: "🎮", minutes: 60, pref: "night", days: 4, category: "hobby" },
  { id: "music", label: "Music / Instrument", emoji: "🎸", minutes: 45, pref: "night", days: 5, category: "hobby" },
  { id: "drawing", label: "Drawing / Art", emoji: "🎨", minutes: 45, pref: "night", days: 3, category: "hobby" },
  { id: "photography", label: "Photography", emoji: "📷", minutes: 60, pref: "evening", days: 2, category: "hobby" },
  { id: "reading", label: "Reading", emoji: "📖", minutes: 30, pref: "night", days: 6, category: "hobby" },
  { id: "movies", label: "Anime / Movies", emoji: "🍿", minutes: 60, pref: "night", days: 3, category: "hobby" },
  { id: "content", label: "Content Creation", emoji: "🎬", minutes: 60, pref: "night", days: 3, category: "hobby" },
  { id: "coding", label: "Coding for Fun", emoji: "👨‍💻", minutes: 60, pref: "night", days: 4, category: "career" },
  { id: "chess", label: "Chess", emoji: "♟️", minutes: 30, pref: "night", days: 4, category: "hobby" },
  { id: "writing", label: "Writing / Blogging", emoji: "✍️", minutes: 45, pref: "night", days: 3, category: "hobby" },
  { id: "dance", label: "Dance", emoji: "💃", minutes: 60, pref: "evening", days: 3, category: "fitness" },
  { id: "cycling", label: "Cycling", emoji: "🚴", minutes: 60, pref: "evening", days: 3, category: "fitness" },
  { id: "volunteering", label: "Clubs / Volunteering", emoji: "🤝", minutes: 60, pref: "evening", days: 2, category: "hobby" },
  { id: "cooking", label: "Cooking", emoji: "🍳", minutes: 45, pref: "evening", days: 2, category: "hobby" },
];

export const hobbyById = (id) => HOBBIES.find((h) => h.id === id);

// ---------------------------------------------------------------- library --
// Shared study material, published by an admin and read by every student.
// One `kind` per item rather than one collection per kind — see ./library.

export const RESOURCE_KINDS = [
  { id: "syllabus", label: "Syllabus", emoji: "📘", color: "#6366f1", file: true, subject: false },
  { id: "notes", label: "Notes", emoji: "📄", color: "#0ea5e9", file: true, subject: true },
  { id: "pyq", label: "Previous Year Qs", emoji: "🗂️", color: "#f97316", file: true, subject: true },
  { id: "important", label: "Important Qs", emoji: "⭐", color: "#f59e0b", file: true, subject: true },
  { id: "assignment", label: "Assignment", emoji: "📝", color: "#8b5cf6", file: true, subject: true },
  { id: "lab", label: "Lab Manual", emoji: "🔬", color: "#22c55e", file: true, subject: true },
  { id: "book", label: "Book", emoji: "📚", color: "#ec4899", file: true, subject: true },
  { id: "video", label: "YouTube Video", emoji: "🎥", color: "#ef4444", file: false, subject: true },
  { id: "link", label: "Website / Link", emoji: "🔗", color: "#14b8a6", file: false, subject: true },
];

export const kindById = (id) => RESOURCE_KINDS.find((k) => k.id === id) || RESOURCE_KINDS[1];

/** Units a subject is split into. Kept generic — most universities use 5. */
export const UNITS = [1, 2, 3, 4, 5];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// ---------------------------------------------------------------- day modes --

export const DAY_MODES = [
  {
    id: "college",
    label: "College Day",
    emoji: "🎓",
    college: true,
    weights: { academics: 1, career: 1, fitness: 1, hobby: 1 },
    note: "College hours are blocked, everything else fits around them.",
  },
  {
    id: "weekend",
    label: "Weekend",
    emoji: "🌤️",
    college: false,
    weights: { academics: 1.2, career: 1.7, fitness: 1.3, hobby: 1.6 },
    note: "No college — long project sessions, hobbies and friends.",
  },
  {
    id: "exam",
    label: "Exam Mode",
    emoji: "📝",
    college: true,
    weights: { academics: 2.2, career: 0.35, fitness: 0.7, hobby: 0.35 },
    note: "Study and revision take over; hobbies shrink but never disappear.",
  },
  {
    id: "vacation",
    label: "Vacation",
    emoji: "🏖️",
    college: false,
    weights: { academics: 0.5, career: 2, fitness: 1.4, hobby: 1.5 },
    note: "Skills, projects and internship prep get the whole day.",
  },
];

export const modeById = (id) => DAY_MODES.find((m) => m.id === id) || DAY_MODES[0];

export const DEADLINE_TYPES = [
  { id: "exam", label: "Exam", emoji: "📝", color: "#ef4444" },
  { id: "assignment", label: "Assignment", emoji: "📄", color: "#0ea5e9" },
  { id: "practical", label: "Practical / Lab File", emoji: "🔬", color: "#22c55e" },
  { id: "project", label: "Project", emoji: "🚧", color: "#8b5cf6" },
  { id: "other", label: "Other", emoji: "📌", color: "#f59e0b" },
];

export const deadlineType = (id) => DEADLINE_TYPES.find((t) => t.id === id) || DEADLINE_TYPES[4];

export const PROJECT_STAGES = ["Design", "Development", "Testing", "Submission"];

export const ACCENTS = [
  { id: "indigo", label: "Indigo", value: "#6366f1" },
  { id: "emerald", label: "Emerald", value: "#10b981" },
  { id: "rose", label: "Rose", value: "#f43f5e" },
  { id: "amber", label: "Amber", value: "#f59e0b" },
  { id: "sky", label: "Sky", value: "#0ea5e9" },
  { id: "violet", label: "Violet", value: "#8b5cf6" },
];
