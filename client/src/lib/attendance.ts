import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export type QRData = {
  studentId: number;
  sessionId: number;
  timestamp: string;
  hash: string;
};

export type QRResponse = {
  qrData: QRData;
  expiresIn: number; // in seconds
};

export type EnrollmentData = {
  enrollment: {
    id: number;
    studentId: number;
    courseId: number;
  };
  course: {
    id: number;
    courseCode: string;
    courseName: string;
    lecturer: string;
    totalSessions: number;
    semester: string;
    description: string | null;
    minAttendancePercentage: number;
  };
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
};

export type AttendanceRecord = {
  id: number;
  date: string;
  courseName: string;
  courseCode: string;
  time: string;
  status: string;
  timestamp: string;
};

export type CourseStatistics = {
  session: string;
  attendanceCount: number;
  totalStudents: number;
  attendancePercentage: number;
};

export type AdminStatistics = {
  totalStudents: number;
  activeCourses: number;
  atRiskStudents: number;
  attendanceToday: string;
};

// Generate QR code for student attendance
export const generateQRCode = async (): Promise<QRResponse> => {
  const res = await apiRequest('GET', '/api/student/generate-qr', undefined);
  return res.json();
};

// Get enrollments and attendance data for student
export const getStudentEnrollments = async (): Promise<EnrollmentData[]> => {
  const res = await apiRequest('GET', '/api/student/enrollments', undefined);
  return res.json();
};

// Get attendance history for student
export const getStudentAttendanceHistory = async (): Promise<AttendanceRecord[]> => {
  const res = await apiRequest('GET', '/api/student/attendance', undefined);
  return res.json();
};

// Get admin dashboard statistics
export const getAdminStatistics = async (): Promise<AdminStatistics> => {
  const res = await apiRequest('GET', '/api/admin/statistics', undefined);
  return res.json();
};

// Get attendance data for a specific course (for charts)
export const getCourseAttendanceData = async (courseId: number): Promise<CourseStatistics[]> => {
  const res = await apiRequest('GET', `/api/admin/courses/${courseId}/attendance-data`, undefined);
  return res.json();
};

// Mark attendance with QR code scan
export const scanQRCode = async (qrData: QRData): Promise<void> => {
  await apiRequest('POST', '/api/attendance/scan', qrData);
  // Invalidate attendance-related queries
  await queryClient.invalidateQueries({ queryKey: ['/api/admin/statistics'] });
};

// Generate and download attendance report
export const downloadAttendanceReport = (courseId?: number): void => {
  const url = courseId 
    ? `/api/admin/export-attendance?courseId=${courseId}`
    : '/api/admin/export-attendance';
  
  window.open(url, '_blank');
};
