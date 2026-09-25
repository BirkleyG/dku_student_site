import type { Locale } from "../locale";

export const clubs: Record<Locale, Record<string, string>> = {
  en: {
    // ClubsDirectory
    filterEverything: "Everything",
    filterAllCategories: "All categories",
    loading: "Loading…",
    emptyState: "Nothing here yet. Add the first one.",
    organizationBadge: "Organization",

    // ClubForm
    typeQuestion: "Is this a club or an organization?",
    typeHint: "Use Organization for non-club bodies, like the Athletics department itself.",
    nameLabel: "Name",
    categoryLabel: "Category",
    athleticKindQuestion: "Team or club?",
    sportLabel: "Sport",
    sportPlaceholder: "Basketball, Soccer…",
    descriptionLabel: "Description",
    leadershipHeading: "Leadership",
    leadershipHint: "Add the president and anyone else people should be able to reach.",
    officerNamePlaceholder: "Name",
    officerTitlePlaceholder: "Title (President, VP…)",
    officerContactPlaceholder: "Contact (optional)",
    removeOfficerAria: "Remove",
    addAnotherLeader: "Add another leader",
    contactQuestion: "How should people contact {who}?",
    contactWhoYou: "you",
    contactWhoClub: "the club",
    wechatQrLabel: "WeChat QR code",
    emailLabel: "Email",
    phoneLabel: "Phone number",
    contactInfoLabel: "Contact info",
    websiteLabel: "Website (optional)",
    logoLabel: "Logo",
    anyoneCanJoinTitle: "Anyone can join",
    anyoneCanJoinHint: "Off means only club managers add or remove members from the roster.",
    openJoinSwitchLabel: "Open join",
    couldntSave: "Couldn't save that.",
    saving: "Saving…",
    addClub: "Add club",
    saveChanges: "Save changes",

    // MembersPanel
    membersHeading: "Members ({n})",
    leaveClub: "Leave club",
    joinClub: "Join club",
    youAreMember: "You're a member",
    askOfficerToAddYou: "Ask an officer to add you",
    couldntJoin: "Couldn't join.",
    couldntLeave: "Couldn't leave.",
    couldntAddPerson: "Couldn't add that person.",
    confirmRemoveMember: "Remove this member?",
    managerBadge: "Manager",
    makeMember: "Make member",
    makeManager: "Make manager",
    removeMemberAria: "Remove member",
    noMembersYet: "No members yet.",
    addMemberByEmailPlaceholder: "Add member by email",
    addButton: "Add",

    // [id]/edit/page.tsx
    editClubHeading: "Edit {name}",

    // [id]/page.tsx
    getInTouchHeading: "Get in touch",
    websiteLinkText: "Website",
    scanOnWechat: "Scan on WeChat",
    wechatQrAlt: "WeChat QR code",
    backToAllClubs: "← Back to all clubs",
    editButton: "Edit",

    // new/page.tsx
    newClubHeading: "Put it on the map.",

    // page.tsx
    pageHeading: "Find your people.",
    pageSubheading: "Clubs, sports teams, and campus organizations.",
    addClubButton: "Add a club",
  },
  zh: {
    // ClubsDirectory
    filterEverything: "全部",
    filterAllCategories: "所有类别",
    loading: "加载中…",
    emptyState: "这里还没有内容，快来添加第一个吧。",
    organizationBadge: "机构",

    // ClubForm
    typeQuestion: "这是社团还是机构？",
    typeHint: "非社团类组织请选择「机构」，例如体育部本身。",
    nameLabel: "名称",
    categoryLabel: "类别",
    athleticKindQuestion: "校队还是运动社团？",
    sportLabel: "运动项目",
    sportPlaceholder: "篮球、足球…",
    descriptionLabel: "简介",
    leadershipHeading: "负责人",
    leadershipHint: "添加社长以及其他大家可以联系到的人。",
    officerNamePlaceholder: "姓名",
    officerTitlePlaceholder: "职位（社长、副社长…）",
    officerContactPlaceholder: "联系方式（选填）",
    removeOfficerAria: "移除",
    addAnotherLeader: "添加更多负责人",
    contactQuestion: "大家应该如何联系{who}？",
    contactWhoYou: "你",
    contactWhoClub: "社团",
    wechatQrLabel: "微信二维码",
    emailLabel: "邮箱",
    phoneLabel: "电话号码",
    contactInfoLabel: "联系方式",
    websiteLabel: "网站（选填）",
    logoLabel: "标志",
    anyoneCanJoinTitle: "任何人都可加入",
    anyoneCanJoinHint: "关闭后，只有社团管理员可以添加或移除成员名单。",
    openJoinSwitchLabel: "开放加入",
    couldntSave: "保存失败，请重试。",
    saving: "保存中…",
    addClub: "添加社团",
    saveChanges: "保存更改",

    // MembersPanel
    membersHeading: "成员（{n}）",
    leaveClub: "退出社团",
    joinClub: "加入社团",
    youAreMember: "你已是成员",
    askOfficerToAddYou: "请联系负责人将你加入",
    couldntJoin: "加入失败。",
    couldntLeave: "退出失败。",
    couldntAddPerson: "添加该用户失败。",
    confirmRemoveMember: "确定要移除该成员吗？",
    managerBadge: "管理员",
    makeMember: "设为普通成员",
    makeManager: "设为管理员",
    removeMemberAria: "移除成员",
    noMembersYet: "暂无成员。",
    addMemberByEmailPlaceholder: "通过邮箱添加成员",
    addButton: "添加",

    // [id]/edit/page.tsx
    editClubHeading: "编辑{name}",

    // [id]/page.tsx
    getInTouchHeading: "联系方式",
    websiteLinkText: "网站",
    scanOnWechat: "微信扫码",
    wechatQrAlt: "微信二维码",
    backToAllClubs: "← 返回所有社团",
    editButton: "编辑",

    // new/page.tsx
    newClubHeading: "让大家看到它。",

    // page.tsx
    pageHeading: "找到属于你的圈子。",
    pageSubheading: "社团、运动队和校园组织。",
    addClubButton: "添加社团",
  },
};
