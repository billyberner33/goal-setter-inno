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
    id: "sgp_reading",
    name: "SGP Reading",
    description: "Median Student Growth Percentile for Reading assessments",
    currentValue: 42,
    lastYearValue: 38,
    unit: "",
    polarity: "positive",
    icon: "📈",
    importance: "Student Growth Percentile (SGP) in Reading measures how much progress students make in literacy relative to peers with similar prior achievement. Unlike proficiency, which is a snapshot, growth tells you whether students are catching up, keeping pace, or falling behind. A median SGP above 50 indicates students are growing faster than typical peers. This metric is critical for schools serving students below grade level — it validates that instructional strategies are accelerating learning even when proficiency rates remain low.",
  },
  {
    id: "sgp_math",
    name: "SGP Math",
    description: "Median Student Growth Percentile for Math assessments",
    currentValue: 45,
    lastYearValue: 40,
    unit: "",
    polarity: "positive",
    icon: "📊",
    importance: "Student Growth Percentile (SGP) in Math measures how much progress students make in mathematical reasoning relative to peers with similar prior achievement. A median SGP above 50 indicates students are growing faster than typical peers. Tracking math growth separately from proficiency helps principals understand whether instructional strategies are accelerating learning, even when overall proficiency rates remain below targets.",
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
  { id: "1", name: "Hansberry Elementary", communityArea: "Austin", opportunityIndex: 3.2, similarityMatch: 94, currentPerformance: 86.4, trend3Year: [81.2, 83.7, 86.4], enrollment: 412, gradeSpan: "K-8", principal: "Dr. Angela Morris", studentTeacherRatio: 18, freeReducedLunch: 89, chronicAbsenteeism: 28, mathProficiency: 16, elaProficiency: 21, suspensionRate: 8.2, teacherRetention: 78 },
  { id: "2", name: "Melody STEM Academy", communityArea: "West Garfield Park", opportunityIndex: 3.0, similarityMatch: 91, currentPerformance: 83.1, trend3Year: [78.5, 80.9, 83.1], enrollment: 385, gradeSpan: "K-8", principal: "Marcus Johnson", studentTeacherRatio: 20, freeReducedLunch: 92, chronicAbsenteeism: 32, mathProficiency: 13, elaProficiency: 17, suspensionRate: 10.5, teacherRetention: 72 },
  { id: "3", name: "Crown Academy", communityArea: "North Lawndale", opportunityIndex: 3.4, similarityMatch: 89, currentPerformance: 88.7, trend3Year: [84.3, 86.5, 88.7], enrollment: 448, gradeSpan: "K-8", principal: "Dr. Patricia Wells", studentTeacherRatio: 17, freeReducedLunch: 85, chronicAbsenteeism: 22, mathProficiency: 19, elaProficiency: 24, suspensionRate: 5.8, teacherRetention: 84 },
  { id: "4", name: "Bethune Elementary", communityArea: "South Shore", opportunityIndex: 3.1, similarityMatch: 87, currentPerformance: 81.2, trend3Year: [76.8, 79.1, 81.2], enrollment: 367, gradeSpan: "K-8", principal: "James Carter", studentTeacherRatio: 21, freeReducedLunch: 91, chronicAbsenteeism: 35, mathProficiency: 11, elaProficiency: 15, suspensionRate: 12.1, teacherRetention: 68 },
  { id: "5", name: "Earhart Scholastic Academy", communityArea: "Englewood", opportunityIndex: 2.9, similarityMatch: 85, currentPerformance: 85.9, trend3Year: [82.1, 84.3, 85.9], enrollment: 395, gradeSpan: "K-8", principal: "Dr. Lisa Tran", studentTeacherRatio: 19, freeReducedLunch: 94, chronicAbsenteeism: 26, mathProficiency: 15, elaProficiency: 20, suspensionRate: 7.4, teacherRetention: 76 },
  { id: "6", name: "Langston Hughes Elementary", communityArea: "Auburn Gresham", opportunityIndex: 3.3, similarityMatch: 83, currentPerformance: 82.6, trend3Year: [78.9, 80.7, 82.6], enrollment: 421, gradeSpan: "K-8", principal: "Sharon Williams", studentTeacherRatio: 22, freeReducedLunch: 88, chronicAbsenteeism: 30, mathProficiency: 12, elaProficiency: 18, suspensionRate: 9.3, teacherRetention: 71 },
  { id: "7", name: "Rosewood Academy", communityArea: "Chatham", opportunityIndex: 3.5, similarityMatch: 81, currentPerformance: 89.4, trend3Year: [85.2, 87.6, 89.4], enrollment: 456, gradeSpan: "K-8", principal: "Dr. Kevin Okafor", studentTeacherRatio: 16, freeReducedLunch: 82, chronicAbsenteeism: 19, mathProficiency: 22, elaProficiency: 27, suspensionRate: 4.6, teacherRetention: 87 },
  { id: "8", name: "DuSable Leadership Academy", communityArea: "Bronzeville", opportunityIndex: 3.2, similarityMatch: 79, currentPerformance: 87.3, trend3Year: [83.5, 85.4, 87.3], enrollment: 389, gradeSpan: "K-8", principal: "Denise Robinson", studentTeacherRatio: 18, freeReducedLunch: 86, chronicAbsenteeism: 24, mathProficiency: 18, elaProficiency: 23, suspensionRate: 6.1, teacherRetention: 81 },
];

// Additional schools available for search/add
export const additionalSchools: ComparableSchool[] = [
  { id: "9", name: "Drake Elementary", communityArea: "Woodlawn", opportunityIndex: 3.1, similarityMatch: 77, currentPerformance: 80.5, trend3Year: [76.1, 78.2, 80.5], enrollment: 378, gradeSpan: "K-8", principal: "Robert Chen", studentTeacherRatio: 20, freeReducedLunch: 90, chronicAbsenteeism: 33, mathProficiency: 10, elaProficiency: 14, suspensionRate: 11.2, teacherRetention: 69 },
  { id: "10", name: "Gwendolyn Brooks Academy", communityArea: "Roseland", opportunityIndex: 2.8, similarityMatch: 74, currentPerformance: 79.3, trend3Year: [74.8, 77.1, 79.3], enrollment: 402, gradeSpan: "K-8", principal: "Tamara Davis", studentTeacherRatio: 23, freeReducedLunch: 95, chronicAbsenteeism: 37, mathProficiency: 9, elaProficiency: 12, suspensionRate: 13.4, teacherRetention: 65 },
  { id: "11", name: "Marshall Elementary", communityArea: "East Garfield Park", opportunityIndex: 3.0, similarityMatch: 72, currentPerformance: 84.1, trend3Year: [80.2, 82.3, 84.1], enrollment: 345, gradeSpan: "K-8", principal: "Dr. Nina Patel", studentTeacherRatio: 19, freeReducedLunch: 87, chronicAbsenteeism: 25, mathProficiency: 17, elaProficiency: 22, suspensionRate: 7.8, teacherRetention: 77 },
  { id: "12", name: "Dunbar Technology Academy", communityArea: "Washington Park", opportunityIndex: 3.3, similarityMatch: 70, currentPerformance: 82.8, trend3Year: [78.4, 80.5, 82.8], enrollment: 415, gradeSpan: "K-8", principal: "Anthony Brooks", studentTeacherRatio: 18, freeReducedLunch: 89, chronicAbsenteeism: 29, mathProficiency: 14, elaProficiency: 19, suspensionRate: 8.9, teacherRetention: 74 },
  { id: "13", name: "Overton Elementary", communityArea: "Bronzeville", opportunityIndex: 3.4, similarityMatch: 68, currentPerformance: 87.2, trend3Year: [83.1, 85.4, 87.2], enrollment: 390, gradeSpan: "K-8", principal: "Dr. Michelle Grant", studentTeacherRatio: 17, freeReducedLunch: 83, chronicAbsenteeism: 21, mathProficiency: 20, elaProficiency: 25, suspensionRate: 5.3, teacherRetention: 83 },
  { id: "14", name: "Wadsworth Elementary", communityArea: "Pullman", opportunityIndex: 2.9, similarityMatch: 66, currentPerformance: 78.6, trend3Year: [74.2, 76.5, 78.6], enrollment: 358, gradeSpan: "K-5", principal: "Carlos Rivera", studentTeacherRatio: 21, freeReducedLunch: 93, chronicAbsenteeism: 36, mathProficiency: 8, elaProficiency: 11, suspensionRate: 14.1, teacherRetention: 63 },
  { id: "15", name: "Hinton Elementary", communityArea: "Grand Crossing", opportunityIndex: 3.1, similarityMatch: 64, currentPerformance: 81.4, trend3Year: [77.8, 79.5, 81.4], enrollment: 432, gradeSpan: "K-8", principal: "Felicia Thompson", studentTeacherRatio: 20, freeReducedLunch: 88, chronicAbsenteeism: 31, mathProficiency: 13, elaProficiency: 16, suspensionRate: 9.7, teacherRetention: 70 },
  { id: "16", name: "Ruiz Elementary", communityArea: "Pilsen", opportunityIndex: 3.6, similarityMatch: 62, currentPerformance: 85.7, trend3Year: [81.9, 83.8, 85.7], enrollment: 467, gradeSpan: "K-8", principal: "Dr. Maria Ruiz", studentTeacherRatio: 16, freeReducedLunch: 79, chronicAbsenteeism: 20, mathProficiency: 21, elaProficiency: 26, suspensionRate: 4.9, teacherRetention: 86 },
];

export const peerTrendData = [
  { year: "2021-22", yourSchool: 78.4, peerMedian: 81.2, p25: 76.5, p75: 85.8, topPerformers: 91.3 },
  { year: "2022-23", yourSchool: 80.9, peerMedian: 83.1, p25: 78.3, p75: 87.2, topPerformers: 92.1 },
  { year: "2023-24", yourSchool: 82.3, peerMedian: 84.6, p25: 79.8, p75: 88.5, topPerformers: 93.0 },
  { year: "2024-25", yourSchool: 84.6, peerMedian: 86.4, p25: 81.5, p75: 90.1, topPerformers: 94.2 },
  { year: "2025-26", yourSchool: null, peerMedian: null, p25: null, p75: null, topPerformers: null },
];

export const goalRecommendation: GoalRecommendation = {
  conservative: 86.0,
  typical: 88.5,
  ambitious: 91.0,
  recommended: 88.5,
};
