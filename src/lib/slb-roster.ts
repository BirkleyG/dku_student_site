// The official SLB roster and links, copied from the Campus Life SLB page
// (campus-life.dukekunshan.edu.cn/student-leader-board/home/). Update this
// when a new board is appointed. Photos are served from DKU's public CDN.

const CL = "https://campus-life.dukekunshan.edu.cn/student-leader-board";
const IMG = "https://newstatic.dukekunshan.edu.cn";

export type RosterPerson = { name: string; role: string; classOf: string; photo: string };

export const SLB_ROSTER: { group: string; people: RosterPerson[] }[] = [
  {
    group: "Co-Chairs",
    people: [
      { name: "Sean Wan", role: "Co-Chair", classOf: "Class of 2027", photo: `${IMG}/campus-life/2025/07/18165635/Sean-Wan-400x400.png` },
      { name: "Ivana Nikolova", role: "Co-Chair", classOf: "Class of 2027", photo: `${IMG}/mainsite/2025/07/05163939/Ivana-Nikolova-1-400x400.jpeg` },
    ],
  },
  {
    group: "Cabinet Officers",
    people: [
      { name: "Narek Zalibekyan", role: "Chief Financial Officer", classOf: "Class of 2029", photo: `${IMG}/campus-life/2025/07/18164119/Narek-400x400.png` },
      { name: "Yixuan Hang", role: "Chief Legal Officer", classOf: "Class of 2029", photo: `${IMG}/campus-life/2025/07/18164125/Yixuan-400x400.png` },
      { name: "Avena Daley", role: "Chief Communication Officer", classOf: "Class of 2028", photo: `${IMG}/campus-life/2025/07/18164116/Avena.png` },
      { name: "Ningyu Wang", role: "Chief Sustainability Officer", classOf: "Class of 2029", photo: `${IMG}/campus-life/2025/07/18164122/Ningyu-400x400.png` },
      { name: "Marwa Mouzahim", role: "Graduate Student Representative", classOf: "Graduate Student", photo: `${IMG}/campus-life/2025/07/01201702/Marwa-Mouzahim-400x400.png` },
    ],
  },
  {
    group: "Board Members",
    people: [
      ["Anastasiia Titarova", "2027", "mainsite/2025/07/05164516/Anastasiia-Titarova-1-400x400.jpeg"],
      ["Carly Nabinger", "2027", "campus-life/2025/07/18164715/Carly-400x400.png"],
      ["Chang Liu", "2029", "mainsite/2025/07/05164301/Chang-Liu-1-400x400.jpg"],
      ["Daniel Monteiro", "2027", "mainsite/2025/07/05164307/Daniel-Monteiro-1-1-400x400.jpg"],
      ["Evelina Zhang", "2029", "campus-life/2025/07/18164846/Evelina-Zhang-400x400.png"],
      ["Guanyi Liang", "2028", "mainsite/2025/07/05164314/Guanyi-Liang-1-400x400.jpg"],
      ["Helen Zhao", "2029", "mainsite/2025/07/05164250/Helen-Zhao-1-400x400.jpg"],
      ["Jayson Han", "2029", "mainsite/2025/07/05164332/Jayson-Han-1-400x400.jpg"],
      ["Khadija Masood", "2029", "mainsite/2025/07/05164340/Khadija-Masood-1-400x400.jpeg"],
      ["Lauren Mass", "2029", "mainsite/2025/07/05164348/Lauren-Mass-1-400x400.jpg"],
      ["Minnie Hu", "2027", "mainsite/2025/07/05164356/Minnie-Hu-1-400x400.jpg"],
      ["Muhammad Anas Tahir", "2029", "mainsite/2025/07/05164405/Muhammad-Anas-Tahir-1-400x400.jpg"],
      ["Rafaa Elamin", "2029", "mainsite/2025/07/05164413/Rafaa-Elamin-1-400x400.jpg"],
      ["Saruul Jessie", "2029", "mainsite/2025/07/05164430/Saruul-Jessie-1-400x400.jpg"],
      ["Sherry Hu", "2029", "campus-life/2025/07/18165257/Sherry-Hu-400x400.png"],
      ["Zoey Chan", "2029", "mainsite/2025/07/05164508/Zoey-Chan-1-400x400.jpg"],
    ].map(([name, year, path]) => ({ name, role: "Board Member", classOf: `Class of ${year}`, photo: `${IMG}/${path}` })),
  },
];

export const SLB_GET_INVOLVED = [
  { label: "Overview", href: `${CL}/overview/` },
  { label: "Timeline", href: `${CL}/timeline/` },
  { label: "Application Period", href: `${CL}/application-period/` },
  { label: "Endorsement Period", href: `${CL}/endorsement-period/` },
  { label: "Interview Period", href: `${CL}/interview-period/` },
  { label: "Appointment", href: `${CL}/selection/` },
  { label: "FAQ", href: `${CL}/faq/` },
  { label: "Contact", href: `${CL}/contact/` },
];

export const SLB_FEEDBACK_URL = "https://duke.qualtrics.com/jfe/form/SV_5BWorkYw7z1VheC";
