export interface MetricData {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  lastYearValue: number;
  unit: string;
  polarity: "positive" | "negative";
  icon: string;
  importance: string;
}

export interface ComparableSchool {
  id: string;
  name: string;
  communityArea: string;
  opportunityIndex: number;
  similarityMatch: number;
  similarityRank: number;
  currentPerformance: number;
  trend3Year: number[];
  enrollment: number;
  gradeSpan: string;
  principal?: string;
  studentTeacherRatio?: number;
  freeReducedLunch?: number;
  chronicAbsenteeism?: number;
  mathProficiency?: number;
  elaProficiency?: number;
  suspensionRate?: number;
  teacherRetention?: number;
}

export interface GoalRecommendation {
  conservative: number;
  typical: number;
  ambitious: number;
  recommended: number;
}

export const metrics: MetricData[] = [
  {
    id: "ela_proficiency",
    name: "IAR ELA Proficiency Rate",
    description: "Percentage of students meeting or exceeding grade-level expectations in ELA (IAR) — Total",
    currentValue: 0,
    lastYearValue: 0,
    unit: "%",
    polarity: "positive",
    icon: "📖",
    importance: "Reading proficiency is a gateway skill that influences performance across every subject area. Students who read at grade level by the end of 3rd grade are four times more likely to graduate high school on time. ELA proficiency on the IAR reflects comprehension, critical thinking, and communication skills — competencies essential for success in academic and professional settings.",
  },
  {
    id: "math_proficiency",
    name: "IAR Math Proficiency Rate",
    description: "Percentage of students meeting or exceeding grade-level expectations in Math (IAR) — Total",
    currentValue: 0,
    lastYearValue: 0,
    unit: "%",
    polarity: "positive",
    icon: "📐",
    importance: "Math proficiency on the Illinois Assessment of Readiness (IAR) measures whether students can apply mathematical reasoning at grade level. Strong math skills are foundational for STEM readiness, high school course placement, and long-term career opportunities. Students proficient in math by 8th grade are more than twice as likely to complete college-preparatory coursework.",
  },
  {
    id: "chronic_absenteeism",
    name: "Chronic Absenteeism",
    description: "Percentage of students missing 10% or more of enrolled school days",
    currentValue: 0,
    lastYearValue: 0,
    unit: "%",
    polarity: "negative",
    icon: "📋",
    importance: "Chronic absenteeism — missing 10% or more of school days — is one of the strongest predictors of academic failure. Research shows chronically absent students are significantly less likely to read at grade level by 3rd grade and more likely to drop out of high school. Reducing chronic absenteeism by even a few percentage points can meaningfully increase the number of students on track for proficiency.",
  },
  {
    id: "ela_growth_percentile",
    name: "ELA Growth Percentile",
    description: "Median Student Growth Percentile for ELA assessments — Total",
    currentValue: 0,
    lastYearValue: 0,
    unit: "",
    polarity: "positive",
    icon: "📈",
    importance: "Student Growth Percentile (SGP) in ELA measures how much progress students make in literacy relative to peers with similar prior achievement. Unlike proficiency, growth tells you whether students are catching up, keeping pace, or falling behind. A median SGP above 50 indicates students are growing faster than typical peers — critical for schools serving students below grade level.",
  },
  {
    id: "math_growth_percentile",
    name: "Math Growth Percentile",
    description: "Median Student Growth Percentile for Math assessments",
    currentValue: 0,
    lastYearValue: 0,
    unit: "",
    polarity: "positive",
    icon: "📊",
    importance: "Student Growth Percentile (SGP) in Math measures how much progress students make in mathematical reasoning relative to peers with similar prior achievement. A median SGP above 50 indicates students are growing faster than typical peers. Tracking math growth separately from proficiency helps principals understand whether instructional strategies are accelerating learning.",
  },
  {
    id: "isa_proficiency",
    name: "ISA Proficiency",
    description: "Percentage of students meeting or exceeding proficiency on the Illinois Science Assessment",
    currentValue: 0,
    lastYearValue: 0,
    unit: "%",
    polarity: "positive",
    icon: "🔬",
    importance: "ISA Proficiency measures whether students are meeting grade-level expectations in science. Strong science skills are essential for STEM pathways and developing critical thinking and inquiry-based reasoning. Monitoring ISA proficiency helps principals evaluate the effectiveness of science instruction and identify areas for curriculum improvement.",
  },
  {
    id: "graduation_rate_4yr",
    name: "4-Year Graduation Rate",
    description: "Percentage of students graduating within 4 years of entering high school — Total",
    currentValue: 0,
    lastYearValue: 0,
    unit: "%",
    polarity: "positive",
    icon: "🎓",
    importance: "The 4-year graduation rate is a critical indicator of school effectiveness and student success. Students who graduate on time have significantly better lifetime outcomes including higher earnings, better health, and greater civic engagement. This metric reflects the combined impact of academic support, attendance interventions, and student engagement strategies.",
  },
  {
    id: "graduation_rate_5yr",
    name: "5-Year Graduation Rate",
    description: "Percentage of students graduating within 5 years of entering high school — Total",
    currentValue: 0,
    lastYearValue: 0,
    unit: "%",
    polarity: "positive",
    icon: "🎓",
    importance: "The 5-year graduation rate captures students who need additional time to complete graduation requirements. This metric is important for understanding the full picture of student completion, including those who may have faced interruptions, credit recovery needs, or other challenges that delayed their graduation timeline.",
  },
  {
    id: "pct_9th_on_track",
    name: "9th Grade On Track",
    description: "Percentage of 9th graders on track to graduate based on credits earned and course failures",
    currentValue: 0,
    lastYearValue: 0,
    unit: "%",
    polarity: "positive",
    icon: "🎯",
    importance: "The freshman on-track rate is the single strongest predictor of high school graduation — stronger than test scores, demographics, or prior grades. Students who are on track after 9th grade are 3.5 times more likely to graduate. This early warning indicator allows high schools to identify and support struggling students before they fall too far behind.",
  },
];

export const comparableSchools: ComparableSchool[] = [];

export const additionalSchools: ComparableSchool[] = [];

export const peerTrendData = [
  { year: "2022-23", yourSchool: null, peerMedian: null, p25: null, p75: null, topPerformers: null },
  { year: "2023-24", yourSchool: null, peerMedian: null, p25: null, p75: null, topPerformers: null },
  { year: "2024-25", yourSchool: null, peerMedian: null, p25: null, p75: null, topPerformers: null },
];

export const goalRecommendation: GoalRecommendation = {
  conservative: 0,
  typical: 0,
  ambitious: 0,
  recommended: 0,
};
