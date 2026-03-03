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
  currentPerformance: number;
  trend3Year: number[];
  enrollment: number;
  gradeSpan: string;
}

export interface GoalRecommendation {
  conservative: number;
  typical: number;
  ambitious: number;
  recommended: number;
}

export const metrics: MetricData[] = [
  {
    id: "attendance",
    name: "Attendance Rate",
    description: "Average daily student attendance rate across all grades",
    currentValue: 84.6,
    lastYearValue: 82.3,
    unit: "%",
    polarity: "positive",
    icon: "📋",
    importance: "Attendance is the single strongest predictor of academic achievement in K-8 schools. Research consistently shows that students who attend school at least 90% of the time are significantly more likely to read at grade level by 3rd grade and pass Algebra by 8th grade. Chronic absenteeism (missing 10%+ of school days) is correlated with lower test scores, higher dropout rates, and reduced lifetime earnings. For schools serving high-need communities, improving attendance by even 2–3 percentage points can meaningfully increase the number of students on track for grade-level proficiency.",
  },
  {
    id: "math",
    name: "Math Proficiency",
    description: "Percentage of students meeting or exceeding grade-level expectations in Math (IAR)",
    currentValue: 14.3,
    lastYearValue: 12.1,
    unit: "%",
    polarity: "positive",
    icon: "📐",
    importance: "Math proficiency on the Illinois Assessment of Readiness (IAR) measures whether students can apply mathematical reasoning at grade level. Strong math skills are foundational for STEM readiness, high school course placement, and long-term career opportunities. Students who are proficient in math by 8th grade are more than twice as likely to enroll in and complete college-preparatory coursework. Tracking this metric helps schools identify gaps early and target interventions where they matter most.",
  },
  {
    id: "ela",
    name: "Reading (ELA) Proficiency",
    description: "Percentage of students meeting or exceeding grade-level expectations in ELA (IAR)",
    currentValue: 18.7,
    lastYearValue: 16.9,
    unit: "%",
    polarity: "positive",
    icon: "📖",
    importance: "Reading proficiency is a gateway skill that influences performance across every subject area. Students who read at grade level by the end of 3rd grade are four times more likely to graduate high school on time. ELA proficiency on the IAR reflects comprehension, critical thinking, and communication skills — competencies that are essential for success in both academic and professional settings. Monitoring this metric allows principals to evaluate the effectiveness of literacy programming and make data-informed instructional decisions.",
  },
  {
    id: "growth",
    name: "Student Growth Percentile",
    description: "Median student growth percentile across STAR Reading and Math assessments",
    currentValue: 42,
    lastYearValue: 38,
    unit: "",
    polarity: "positive",
    icon: "📈",
    importance: "Student Growth Percentile (SGP) measures how much academic progress students make relative to peers with similar prior achievement. Unlike proficiency, which is a snapshot, growth tells you whether students are catching up, keeping pace, or falling behind. A median SGP above 50 indicates students are growing faster than typical peers. This metric is critical for schools serving students below grade level — it validates that instructional strategies are accelerating learning even when proficiency rates remain low.",
  },
  {
    id: "behavior",
    name: "Behavioral Incident Rate",
    description: "Percentage of students with one or more behavioral incidents this school year",
    currentValue: 22.5,
    lastYearValue: 25.1,
    unit: "%",
    polarity: "negative",
    icon: "🛡️",
    importance: "Behavioral incidents — including suspensions, referrals, and disciplinary actions — are strongly linked to disengagement, lost instructional time, and increased dropout risk. Schools with lower incident rates tend to have stronger school culture, more consistent instructional time, and better student-teacher relationships. Reducing behavioral incidents by implementing restorative practices and social-emotional learning can improve attendance, academic outcomes, and overall school climate. This metric helps principals track whether school culture investments are working.",
  },
];

export const comparableSchools: ComparableSchool[] = [
  { id: "1", name: "Hansberry Elementary", communityArea: "Austin", opportunityIndex: 3.2, similarityMatch: 94, currentPerformance: 86.4, trend3Year: [81.2, 83.7, 86.4], enrollment: 412, gradeSpan: "K-8" },
  { id: "2", name: "Melody STEM Academy", communityArea: "West Garfield Park", opportunityIndex: 3.0, similarityMatch: 91, currentPerformance: 83.1, trend3Year: [78.5, 80.9, 83.1], enrollment: 385, gradeSpan: "K-8" },
  { id: "3", name: "Crown Academy", communityArea: "North Lawndale", opportunityIndex: 3.4, similarityMatch: 89, currentPerformance: 88.7, trend3Year: [84.3, 86.5, 88.7], enrollment: 448, gradeSpan: "K-8" },
  { id: "4", name: "Bethune Elementary", communityArea: "South Shore", opportunityIndex: 3.1, similarityMatch: 87, currentPerformance: 81.2, trend3Year: [76.8, 79.1, 81.2], enrollment: 367, gradeSpan: "K-8" },
  { id: "5", name: "Earhart Scholastic Academy", communityArea: "Englewood", opportunityIndex: 2.9, similarityMatch: 85, currentPerformance: 85.9, trend3Year: [82.1, 84.3, 85.9], enrollment: 395, gradeSpan: "K-8" },
  { id: "6", name: "Langston Hughes Elementary", communityArea: "Auburn Gresham", opportunityIndex: 3.3, similarityMatch: 83, currentPerformance: 82.6, trend3Year: [78.9, 80.7, 82.6], enrollment: 421, gradeSpan: "K-8" },
  { id: "7", name: "Rosewood Academy", communityArea: "Chatham", opportunityIndex: 3.5, similarityMatch: 81, currentPerformance: 89.4, trend3Year: [85.2, 87.6, 89.4], enrollment: 456, gradeSpan: "K-8" },
  { id: "8", name: "DuSable Leadership Academy", communityArea: "Bronzeville", opportunityIndex: 3.2, similarityMatch: 79, currentPerformance: 87.3, trend3Year: [83.5, 85.4, 87.3], enrollment: 389, gradeSpan: "K-8" },
];

export const peerTrendData = [
  { year: "2021-22", yourSchool: 8.2, peerMedian: 10.1, p25: 7.5, p75: 13.2, topPerformers: 15.8 },
  { year: "2022-23", yourSchool: 10.5, peerMedian: 12.3, p25: 9.8, p75: 15.1, topPerformers: 18.2 },
  { year: "2023-24", yourSchool: 12.1, peerMedian: 13.8, p25: 11.2, p75: 16.7, topPerformers: 20.1 },
  { year: "2024-25", yourSchool: 14.3, peerMedian: 16.2, p25: 13.1, p75: 19.4, topPerformers: 22.5 },
  { year: "2025-26", yourSchool: null, peerMedian: null, p25: null, p75: null, topPerformers: null },
];

export const goalRecommendation: GoalRecommendation = {
  conservative: 15.8,
  typical: 17.2,
  ambitious: 19.5,
  recommended: 17.2,
};
