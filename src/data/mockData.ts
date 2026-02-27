export interface MetricData {
  id: string;
  name: string;
  description: string;
  currentValue: number;
  lastYearValue: number;
  unit: string;
  polarity: "positive" | "negative";
  icon: string;
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
    currentValue: 89.2,
    lastYearValue: 87.8,
    unit: "%",
    polarity: "positive",
    icon: "📋",
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
  },
];

export const comparableSchools: ComparableSchool[] = [
  { id: "1", name: "Hansberry Elementary", communityArea: "Austin", opportunityIndex: 3.2, similarityMatch: 94, currentPerformance: 16.8, trend3Year: [12.1, 14.3, 16.8], enrollment: 412, gradeSpan: "K-8" },
  { id: "2", name: "Melody STEM Academy", communityArea: "West Garfield Park", opportunityIndex: 3.0, similarityMatch: 91, currentPerformance: 15.2, trend3Year: [11.8, 13.5, 15.2], enrollment: 385, gradeSpan: "K-8" },
  { id: "3", name: "Crown Academy", communityArea: "North Lawndale", opportunityIndex: 3.4, similarityMatch: 89, currentPerformance: 19.1, trend3Year: [14.2, 16.7, 19.1], enrollment: 448, gradeSpan: "K-8" },
  { id: "4", name: "Bethune Elementary", communityArea: "South Shore", opportunityIndex: 3.1, similarityMatch: 87, currentPerformance: 13.5, trend3Year: [10.9, 12.1, 13.5], enrollment: 367, gradeSpan: "K-8" },
  { id: "5", name: "Earhart Scholastic Academy", communityArea: "Englewood", opportunityIndex: 2.9, similarityMatch: 85, currentPerformance: 17.4, trend3Year: [13.8, 15.9, 17.4], enrollment: 395, gradeSpan: "K-8" },
  { id: "6", name: "Langston Hughes Elementary", communityArea: "Auburn Gresham", opportunityIndex: 3.3, similarityMatch: 83, currentPerformance: 14.9, trend3Year: [12.5, 13.8, 14.9], enrollment: 421, gradeSpan: "K-8" },
  { id: "7", name: "Rosewood Academy", communityArea: "Chatham", opportunityIndex: 3.5, similarityMatch: 81, currentPerformance: 20.3, trend3Year: [15.1, 17.8, 20.3], enrollment: 456, gradeSpan: "K-8" },
  { id: "8", name: "DuSable Leadership Academy", communityArea: "Bronzeville", opportunityIndex: 3.2, similarityMatch: 79, currentPerformance: 18.6, trend3Year: [14.7, 16.2, 18.6], enrollment: 389, gradeSpan: "K-8" },
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
