import type { Locale } from "../locale";

export const professors: Record<Locale, Record<string, string>> = {
  en: {
    // ProfessorsDirectory
    searchPlaceholder: "Search by name or department…",
    allDepartments: "All departments",
    loadingProfessors: "Loading professors…",
    emptyState: "No professors yet. Add the first one.",
    removeProfessorAria: "Remove professor",
    confirmRemoveProfessor: "Remove this professor?",
    verifiedAria: "Verified",
    noRatingsYetShort: "No ratings yet",
    ratingsCountOne: "{n} rating",
    ratingsCountOther: "{n} ratings",

    // ReviewsPanel
    ratingsHeading: "Ratings",
    gradingLabel: "Grading",
    difficultyLabel: "Difficulty",
    teachingLabel: "Teaching",
    noRatingsYetLong: "No ratings yet — be the first to rate.",
    gradingScore: "Grading {n}/5",
    difficultyScore: "Difficulty {n}/5",
    teachingScore: "Teaching {n}/5",
    removeRatingAria: "Remove rating",
    confirmRemoveRating: "Remove this rating?",
    alreadyRated: "You've already rated this professor for that course.",
    rateThisProfessor: "Rate this professor",
    generalOption: "General (not course-specific)",
    gradingPickerLabel: "Grading (generous → harsh)",
    difficultyPickerLabel: "Difficulty (easy → hard)",
    teachingPickerLabel: "Teaching quality",
    commentPlaceholder: "How they grade, how the class is run, tips for taking their course…",
    couldntSubmitRating: "Couldn't submit that rating.",
    submitting: "Submitting…",
    submitRating: "Submit rating",
    logInToRate: "Log in to rate.",
    outOf5Aria: "{n} out of 5",

    // new/NewProfessorForm
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    departmentLabel: "Department",
    whichDepartmentLabel: "Which department?",
    whichDepartmentPlaceholder: "Type it in — we'll add it to the list next update",
    departmentPlaceholder: "Computer Science",
    emailLabel: "Email (optional)",
    couldntAddProfessor: "Couldn't add that professor.",
    adding: "Adding…",
    addProfessor: "Add professor",

    // new/page.tsx
    newProfessorEyebrow: "New professor",
    newProfessorHeading: "Add them to the list.",

    // page.tsx
    pageEyebrow: "DKU Professors",
    pageHeading: "Know what you're signing up for.",
    addProfessorButton: "Add a professor",
  },
  zh: {
    // ProfessorsDirectory
    searchPlaceholder: "按姓名或院系搜索…",
    allDepartments: "全部院系",
    loadingProfessors: "正在加载教授信息…",
    emptyState: "还没有教授信息，快来添加第一个吧。",
    removeProfessorAria: "移除教授",
    confirmRemoveProfessor: "确定要移除该教授吗？",
    verifiedAria: "已认证",
    noRatingsYetShort: "暂无评分",
    ratingsCountOne: "{n} 个评分",
    ratingsCountOther: "{n} 个评分",

    // ReviewsPanel
    ratingsHeading: "评分",
    gradingLabel: "给分",
    difficultyLabel: "难度",
    teachingLabel: "教学",
    noRatingsYetLong: "暂无评分——快来做第一个评分的人吧。",
    gradingScore: "给分 {n}/5",
    difficultyScore: "难度 {n}/5",
    teachingScore: "教学 {n}/5",
    removeRatingAria: "移除评分",
    confirmRemoveRating: "确定要移除该评分吗？",
    alreadyRated: "你已经为该教授在这门课程下评过分了。",
    rateThisProfessor: "为这位教授评分",
    generalOption: "总体评价（不针对具体课程）",
    gradingPickerLabel: "给分（宽松 → 严格）",
    difficultyPickerLabel: "难度（简单 → 困难）",
    teachingPickerLabel: "教学质量",
    commentPlaceholder: "他们如何给分、课堂如何进行、修这门课的小技巧…",
    couldntSubmitRating: "提交评分失败。",
    submitting: "提交中…",
    submitRating: "提交评分",
    logInToRate: "登录后即可评分。",
    outOf5Aria: "{n} 分（满分 5 分）",

    // new/NewProfessorForm
    firstNameLabel: "名",
    lastNameLabel: "姓",
    departmentLabel: "院系",
    whichDepartmentLabel: "属于哪个院系？",
    whichDepartmentPlaceholder: "请输入 — 我们会在下次更新时加入列表",
    departmentPlaceholder: "计算机科学",
    emailLabel: "邮箱（选填）",
    couldntAddProfessor: "添加教授失败。",
    adding: "添加中…",
    addProfessor: "添加教授",

    // new/page.tsx
    newProfessorEyebrow: "新增教授",
    newProfessorHeading: "把他们加入名单。",

    // page.tsx
    pageEyebrow: "DKU 教授",
    pageHeading: "选课前先了解清楚。",
    addProfessorButton: "添加教授",
  },
};
