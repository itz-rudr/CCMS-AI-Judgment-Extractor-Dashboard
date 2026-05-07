import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileSearch,
  Gavel,
  ShieldCheck,
} from "lucide-react";

export type CaseRisk = "Critical" | "High" | "Medium";
export type ReviewStatus = "Approved" | "Needs Review" | "Edited" | "Rejected";
export type ActionType = "Compliance" | "Appeal Review" | "Compliance + Appeal Review";

export type SourceHighlight = {
  id: string;
  label: string;
  page: number;
  confidence: number;
  quote: string;
  field: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export type JudgmentCase = {
  id: string;
  cisId: string;
  title: string;
  bench: string;
  department: string;
  nodalOfficer: string;
  orderDate: string;
  ingestionTime: string;
  pages: number;
  sourceType: "Digital PDF" | "Scanned PDF + OCR";
  petitioner: string;
  respondent: string;
  reviewStatus: ReviewStatus;
  risk: CaseRisk;
  confidence: number;
  actionType: ActionType;
  actionSummary: string;
  dueDate: string;
  limitationDate: string;
  timelineBasis: "Explicit in judgment" | "AI inferred - reviewer verified";
  responsibleOffice: string;
  directions: string[];
  actionPlan: {
    title: string;
    owner: string;
    due: string;
    status: "Ready" | "In Progress" | "Blocked" | "Queued";
  }[];
  highlights: SourceHighlight[];
};

export const judgmentCases: JudgmentCase[] = [
  {
    id: "WP-21472-2025",
    cisId: "KAHC010482392025",
    title: "Smt. Kavitha R. vs State of Karnataka",
    bench: "Bengaluru Bench",
    department: "Revenue Department",
    nodalOfficer: "Special Deputy Commissioner, Bengaluru Urban",
    orderDate: "2026-04-28",
    ingestionTime: "2026-04-28 18:42",
    pages: 18,
    sourceType: "Digital PDF",
    petitioner: "Smt. Kavitha R.",
    respondent: "State of Karnataka and Others",
    reviewStatus: "Approved",
    risk: "Critical",
    confidence: 94,
    actionType: "Compliance + Appeal Review",
    actionSummary:
      "Issue a reasoned order on mutation request within 30 days and obtain legal opinion on appeal feasibility before the limitation window closes.",
    dueDate: "2026-05-28",
    limitationDate: "2026-05-27",
    timelineBasis: "Explicit in judgment",
    responsibleOffice: "Assistant Commissioner, Bengaluru North",
    directions: [
      "Consider the petitioner's representation and pass a speaking order within 30 days.",
      "Communicate the decision to the petitioner within one week of passing the order.",
      "Legal Cell to examine whether appeal is warranted due to conflicting revenue records.",
    ],
    actionPlan: [
      {
        title: "Assign file to caseworker and collect mutation file",
        owner: "Assistant Commissioner Office",
        due: "2026-05-06",
        status: "Ready",
      },
      {
        title: "Prepare speaking order with record comparison",
        owner: "Tahsildar, Bengaluru North",
        due: "2026-05-20",
        status: "In Progress",
      },
      {
        title: "Seek appeal opinion before limitation date",
        owner: "Department Legal Cell",
        due: "2026-05-23",
        status: "Queued",
      },
    ],
    highlights: [
      {
        id: "h1",
        label: "Order date",
        page: 1,
        confidence: 98,
        field: "Date of order",
        quote: "Order pronounced on 28 April 2026.",
        box: { x: 96, y: 88, width: 282, height: 34 },
      },
      {
        id: "h2",
        label: "Primary direction",
        page: 12,
        confidence: 94,
        field: "Key direction",
        quote:
          "The competent authority shall consider the representation and pass a reasoned order within thirty days.",
        box: { x: 124, y: 235, width: 640, height: 58 },
      },
      {
        id: "h3",
        label: "Communication timeline",
        page: 13,
        confidence: 89,
        field: "Timeline",
        quote:
          "The decision shall be communicated to the petitioner within one week thereafter.",
        box: { x: 118, y: 306, width: 604, height: 48 },
      },
    ],
  },
  {
    id: "WA-1084-2025",
    cisId: "KAHC020117882025",
    title: "Department of School Education vs Ramesh P.",
    bench: "Dharwad Bench",
    department: "Education Department",
    nodalOfficer: "Director, Secondary Education",
    orderDate: "2026-04-25",
    ingestionTime: "2026-04-25 20:10",
    pages: 26,
    sourceType: "Scanned PDF + OCR",
    petitioner: "Department of School Education",
    respondent: "Ramesh P.",
    reviewStatus: "Approved",
    risk: "High",
    confidence: 88,
    actionType: "Compliance",
    actionSummary:
      "Release pension arrears after service verification and file a compliance memo with proof of payment.",
    dueDate: "2026-06-09",
    limitationDate: "2026-05-25",
    timelineBasis: "AI inferred - reviewer verified",
    responsibleOffice: "Deputy Director of Public Instruction, Dharwad",
    directions: [
      "Verify qualifying service and calculate arrears within six weeks.",
      "Release admissible pensionary benefits to the respondent.",
      "Submit compliance memo through the Government Advocate.",
    ],
    actionPlan: [
      {
        title: "Pull service book and treasury payment history",
        owner: "DDPI Dharwad",
        due: "2026-05-08",
        status: "Ready",
      },
      {
        title: "Compute arrears and route approval note",
        owner: "Accounts Section",
        due: "2026-05-29",
        status: "Queued",
      },
      {
        title: "Upload payment proof and compliance memo",
        owner: "Government Advocate Cell",
        due: "2026-06-09",
        status: "Queued",
      },
    ],
    highlights: [
      {
        id: "h4",
        label: "Service verification",
        page: 18,
        confidence: 86,
        field: "Direction",
        quote:
          "The department shall verify qualifying service and release admissible pensionary benefits within six weeks.",
        box: { x: 90, y: 254, width: 692, height: 65 },
      },
      {
        id: "h5",
        label: "Compliance filing",
        page: 19,
        confidence: 91,
        field: "Required filing",
        quote: "A compliance memo shall be placed on record after payment.",
        box: { x: 112, y: 390, width: 556, height: 42 },
      },
    ],
  },
  {
    id: "PIL-55-2026",
    cisId: "KAHC010009142026",
    title: "Citizens Forum vs Urban Development Department",
    bench: "Bengaluru Bench",
    department: "Urban Development Department",
    nodalOfficer: "Commissioner, Urban Development Authority",
    orderDate: "2026-04-30",
    ingestionTime: "2026-04-30 17:35",
    pages: 34,
    sourceType: "Digital PDF",
    petitioner: "Citizens Forum for Lakes",
    respondent: "Urban Development Department and BBMP",
    reviewStatus: "Needs Review",
    risk: "Critical",
    confidence: 81,
    actionType: "Compliance + Appeal Review",
    actionSummary:
      "Prepare encroachment removal schedule, coordinate with BBMP, and verify whether appeal is advisable due to financial and public-order implications.",
    dueDate: "2026-05-21",
    limitationDate: "2026-05-30",
    timelineBasis: "Explicit in judgment",
    responsibleOffice: "Joint Commissioner, Lakes Division",
    directions: [
      "Submit action taken report within three weeks.",
      "Coordinate a joint inspection and publish removal schedule.",
      "Mark wetlands requiring interim protection.",
    ],
    actionPlan: [
      {
        title: "Joint survey with BBMP and Revenue officials",
        owner: "Lakes Division",
        due: "2026-05-09",
        status: "In Progress",
      },
      {
        title: "Draft action taken report",
        owner: "Urban Development Legal Cell",
        due: "2026-05-18",
        status: "Queued",
      },
      {
        title: "Leadership appeal note",
        owner: "Principal Secretary Office",
        due: "2026-05-24",
        status: "Queued",
      },
    ],
    highlights: [
      {
        id: "h6",
        label: "Action taken report",
        page: 29,
        confidence: 83,
        field: "Deadline",
        quote:
          "The respondents shall submit an action taken report within three weeks from receipt of this order.",
        box: { x: 104, y: 214, width: 656, height: 58 },
      },
      {
        id: "h7",
        label: "Joint inspection",
        page: 30,
        confidence: 78,
        field: "Responsible offices",
        quote:
          "BBMP and the Urban Development Authority shall conduct a joint inspection before removal.",
        box: { x: 110, y: 316, width: 628, height: 54 },
      },
    ],
  },
  {
    id: "WP-18002-2025",
    cisId: "KAHC030331202025",
    title: "M. S. Infrastructure vs Public Works Department",
    bench: "Kalaburagi Bench",
    department: "Public Works Department",
    nodalOfficer: "Chief Engineer, North Zone",
    orderDate: "2026-04-22",
    ingestionTime: "2026-04-22 19:18",
    pages: 15,
    sourceType: "Digital PDF",
    petitioner: "M. S. Infrastructure",
    respondent: "Public Works Department",
    reviewStatus: "Edited",
    risk: "Medium",
    confidence: 90,
    actionType: "Appeal Review",
    actionSummary:
      "Place tender cancellation findings before the Tender Scrutiny Committee and obtain appeal decision within limitation.",
    dueDate: "2026-05-12",
    limitationDate: "2026-05-22",
    timelineBasis: "AI inferred - reviewer verified",
    responsibleOffice: "Tender Scrutiny Committee",
    directions: [
      "Reconsider cancellation order after giving an opportunity of hearing.",
      "Decision to be taken by competent tender authority.",
      "Legal Cell to record whether appeal is preferable to reconsideration.",
    ],
    actionPlan: [
      {
        title: "Schedule hearing for contractor",
        owner: "Tender Scrutiny Committee",
        due: "2026-05-07",
        status: "Ready",
      },
      {
        title: "Prepare appeal or reconsideration note",
        owner: "PWD Legal Cell",
        due: "2026-05-15",
        status: "Queued",
      },
    ],
    highlights: [
      {
        id: "h8",
        label: "Opportunity of hearing",
        page: 11,
        confidence: 92,
        field: "Direction",
        quote:
          "The tender authority shall provide an opportunity of hearing and reconsider the cancellation order.",
        box: { x: 98, y: 268, width: 672, height: 54 },
      },
    ],
  },
];

export const approvedActionPlans = judgmentCases.filter(
  (item) => item.reviewStatus === "Approved"
);

export const dashboardStats = [
  {
    label: "PDFs synced from CIS",
    value: "428",
    change: "+31 today",
    icon: FileSearch,
    tone: "blue",
  },
  {
    label: "AI extractions awaiting review",
    value: "76",
    change: "18 high risk",
    icon: Clock3,
    tone: "amber",
  },
  {
    label: "Verified action plans",
    value: "312",
    change: "trusted dashboard only",
    icon: ShieldCheck,
    tone: "emerald",
  },
  {
    label: "Appeal windows closing",
    value: "24",
    change: "next 7 days",
    icon: AlertTriangle,
    tone: "rose",
  },
];

export const pipelineSteps = [
  {
    title: "Disposed judgment fetched",
    detail: "CIS API stores final judgment PDF in CCMS.",
    count: "428",
    icon: FileCheck2,
  },
  {
    title: "OCR and legal extraction",
    detail: "Digital and scanned PDFs are parsed with source mapping.",
    count: "401",
    icon: FileSearch,
  },
  {
    title: "Action plan drafted",
    detail: "Compliance, appeal, timelines, and owners are proposed.",
    count: "336",
    icon: Gavel,
  },
  {
    title: "Human verified",
    detail: "Reviewer approval gates the trusted dashboard.",
    count: "312",
    icon: CheckCircle2,
  },
];

export const departmentSummary = [
  { name: "Revenue", approved: 74, review: 18, overdue: 5 },
  { name: "Education", approved: 61, review: 12, overdue: 3 },
  { name: "Urban Dev", approved: 49, review: 20, overdue: 8 },
  { name: "Public Works", approved: 38, review: 9, overdue: 2 },
  { name: "Home", approved: 34, review: 7, overdue: 4 },
];

export const actionMix = [
  { name: "Compliance", value: 57 },
  { name: "Appeal Review", value: 23 },
  { name: "Both", value: 20 },
];

export const confidenceTrend = [
  { day: "Apr 28", digital: 94, scanned: 82 },
  { day: "Apr 29", digital: 95, scanned: 84 },
  { day: "Apr 30", digital: 93, scanned: 81 },
  { day: "May 01", digital: 96, scanned: 86 },
  { day: "May 02", digital: 95, scanned: 87 },
  { day: "May 03", digital: 97, scanned: 88 },
  { day: "May 04", digital: 96, scanned: 89 },
];

export const reviewerQueue = [
  {
    label: "Critical directives",
    value: "18",
    detail: "Needs reviewer sign-off today",
    icon: AlertTriangle,
  },
  {
    label: "Low confidence fields",
    value: "29",
    detail: "OCR source text requires correction",
    icon: FileSearch,
  },
  {
    label: "Ready for approval",
    value: "47",
    detail: "All mandatory fields extracted",
    icon: CheckCircle2,
  },
  {
    label: "Departments touched",
    value: "14",
    detail: "Nodal officers assigned",
    icon: Building2,
  },
];
