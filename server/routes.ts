import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as crypto from "crypto";
import session from "express-session";
import memorystore from "memorystore";
import { 
  loginSchema, 
  insertCourseSchema, 
  insertSessionSchema,
  insertEnrollmentSchema,
  insertAttendanceSchema,
  qrCodeSchema
} from "@shared/schema";
import { z } from "zod";

// Augment the express-session declaration to include our custom properties
declare module "express-session" {
  interface SessionData {
    token: string;
  }
}

// Create a memory store for sessions
const MemoryStore = memorystore(session);

// JWT token handling
const generateToken = (userId: number, role: string): string => {
  // In a real app, we would use a proper JWT library
  // For simplicity, just returning a string with user info
  const payload = { userId, role, exp: Date.now() + 24 * 60 * 60 * 1000 }; // 1 day expiry
  return JSON.stringify(payload);
};

const verifyToken = (token: string): { userId: number, role: string } | null => {
  try {
    const payload = JSON.parse(token);
    if (payload.exp < Date.now()) {
      return null; // token expired
    }
    return { userId: payload.userId, role: payload.role };
  } catch (error) {
    return null;
  }
};

// Generate a secure hash for QR codes
const generateQRHash = (studentId: number, sessionId: number, timestamp: string): string => {
  const data = `${studentId}:${sessionId}:${timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(session({
    secret: 'nutm-attendance-tracking-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Auth routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username);
      
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      const token = generateToken(user.id, user.role);
      
      // Set token in session instead of cookies for simplicity
      req.session.token = token;
      
      return res.status(200).json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  });
  
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    const user = await storage.getUser(payload.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        name: user.name, 
        role: user.role 
      }
    });
  });
  
  // Course routes
  app.get('/api/courses', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    const semester = req.query.semester as string | undefined;
    
    let courses;
    if (semester) {
      courses = await storage.getCoursesBySemester(semester);
    } else {
      courses = await storage.getCourses();
    }
    
    return res.status(200).json(courses);
  });
  
  app.post('/api/courses', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    try {
      const data = insertCourseSchema.parse(req.body);
      const existingCourse = await storage.getCourseByCode(data.courseCode);
      
      if (existingCourse) {
        return res.status(400).json({ message: 'Course with this code already exists' });
      }
      
      const course = await storage.createCourse(data);
      return res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/courses/:id', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    const courseId = parseInt(req.params.id);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    return res.status(200).json(course);
  });
  
  app.put('/api/courses/:id', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const courseId = parseInt(req.params.id);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    try {
      const data = insertCourseSchema.partial().parse(req.body);
      const updatedCourse = await storage.updateCourse(courseId, data);
      
      if (!updatedCourse) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      return res.status(200).json(updatedCourse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.delete('/api/courses/:id', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const courseId = parseInt(req.params.id);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    const success = await storage.deleteCourse(courseId);
    if (!success) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    return res.status(204).end();
  });
  
  // Session routes
  app.post('/api/sessions', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    try {
      const data = insertSessionSchema.parse(req.body);
      const course = await storage.getCourse(data.courseId);
      
      if (!course) {
        return res.status(400).json({ message: 'Course does not exist' });
      }
      
      const session = await storage.createSession(data);
      return res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/courses/:courseId/sessions', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    const courseId = parseInt(req.params.courseId);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const sessions = await storage.getSessionsByCourse(courseId);
    return res.status(200).json(sessions);
  });
  
  // Enrollment routes
  app.post('/api/enrollments', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    try {
      const data = insertEnrollmentSchema.parse(req.body);
      
      const student = await storage.getUser(data.studentId);
      if (!student || student.role !== 'student') {
        return res.status(400).json({ message: 'Student does not exist' });
      }
      
      const course = await storage.getCourse(data.courseId);
      if (!course) {
        return res.status(400).json({ message: 'Course does not exist' });
      }
      
      const enrollment = await storage.createEnrollment(data);
      return res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/student/enrollments', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    const enrollments = await storage.getEnrollmentsByStudent(payload.userId);
    
    // Get additional data for each enrollment
    const enrollmentData = await Promise.all(
      enrollments.map(async (enrollment) => {
        const course = await storage.getCourse(enrollment.courseId);
        const sessions = await storage.getSessionsByCourse(enrollment.courseId);
        const attendances = await storage.getAttendanceByStudentAndCourse(
          enrollment.studentId,
          enrollment.courseId
        );
        
        return {
          enrollment,
          course,
          totalSessions: sessions.length,
          attendedSessions: attendances.length,
          attendancePercentage: sessions.length > 0 
            ? Math.round((attendances.length / sessions.length) * 100) 
            : 0
        };
      })
    );
    
    return res.status(200).json(enrollmentData);
  });
  
  // QR code generation and attendance tracking
  app.get('/api/student/generate-qr', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'student') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const studentId = payload.userId;
    
    // Generate a QR code for this student
    const timestamp = new Date().toISOString();
    
    // For demonstration, we're generating a QR for a random active session
    // In a real app, this would be based on location, time, etc.
    const sessions = await storage.getSessions();
    if (sessions.length === 0) {
      return res.status(404).json({ message: 'No active sessions found' });
    }
    
    // Get most recent session
    const session = sessions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    const hash = generateQRHash(studentId, session.id, timestamp);
    
    return res.status(200).json({
      qrData: {
        studentId,
        sessionId: session.id,
        timestamp,
        hash
      },
      expiresIn: 600 // 10 minutes in seconds
    });
  });
  
  app.post('/api/attendance/scan', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    try {
      const qrData = qrCodeSchema.parse(req.body);
      
      // Verify the hash
      const expectedHash = generateQRHash(
        qrData.studentId, 
        qrData.sessionId, 
        qrData.timestamp
      );
      
      if (qrData.hash !== expectedHash) {
        return res.status(400).json({ message: 'Invalid QR code' });
      }
      
      // Check if QR code is expired (10 minutes)
      const qrTimestamp = new Date(qrData.timestamp);
      const now = new Date();
      const diff = now.getTime() - qrTimestamp.getTime();
      const tenMinutesInMs = 10 * 60 * 1000;
      
      if (diff > tenMinutesInMs) {
        return res.status(400).json({ message: 'QR code expired' });
      }
      
      // Check if student exists
      const student = await storage.getUser(qrData.studentId);
      if (!student || student.role !== 'student') {
        return res.status(400).json({ message: 'Student not found' });
      }
      
      // Check if session exists
      const session = await storage.getSession(qrData.sessionId);
      if (!session) {
        return res.status(400).json({ message: 'Session not found' });
      }
      
      // Check if student is enrolled in the course
      const enrollments = await storage.getEnrollmentsByStudent(qrData.studentId);
      const enrolled = enrollments.some(e => e.courseId === session.courseId);
      
      if (!enrolled) {
        return res.status(400).json({ message: 'Student not enrolled in this course' });
      }
      
      // Check if attendance already recorded
      const existingAttendance = (await storage.getAttendanceBySession(qrData.sessionId))
        .filter(a => a.studentId === qrData.studentId);
      
      if (existingAttendance.length > 0) {
        return res.status(400).json({ message: 'Attendance already recorded' });
      }
      
      // Record attendance
      const attendance = await storage.createAttendance({
        studentId: qrData.studentId,
        sessionId: qrData.sessionId,
        timestamp: new Date(),
        qrCode: qrData.hash
      });
      
      return res.status(201).json({
        message: 'Attendance recorded successfully',
        attendance
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Attendance history for student
  app.get('/api/student/attendance', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'student') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const attendances = await storage.getAttendanceByStudent(payload.userId);
    
    // Get additional data for each attendance record
    const attendanceData = await Promise.all(
      attendances.map(async (attendance) => {
        const session = await storage.getSession(attendance.sessionId);
        if (!session) return null;
        
        const course = await storage.getCourse(session.courseId);
        
        return {
          id: attendance.id,
          date: session.date,
          courseName: course?.courseName || 'Unknown Course',
          courseCode: course?.courseCode || 'Unknown',
          time: `${session.startTime} - ${session.endTime}`,
          status: 'Present',
          timestamp: attendance.timestamp
        };
      })
    );
    
    // Filter out nulls (in case a session or course was deleted)
    const validAttendanceData = attendanceData.filter(a => a !== null);
    
    // Sort by timestamp, newest first
    validAttendanceData.sort((a, b) => 
      new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime()
    );
    
    return res.status(200).json(validAttendanceData);
  });
  
  // Get attendance statistics for admin dashboard
  app.get('/api/admin/statistics', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const students = await storage.getUsersByRole('student');
    const courses = await storage.getCourses();
    // Get all attendance records by combining results across all sessions
    const sessions = await storage.getSessions();
    const attendancesPromises = sessions.map(session => storage.getAttendanceBySession(session.id));
    const attendancesBySession = await Promise.all(attendancesPromises);
    const attendances = attendancesBySession.flat();
    
    // Count at-risk students (attendance below minimum required)
    let atRiskCount = 0;
    
    // For each student
    for (const student of students) {
      const enrollments = await storage.getEnrollmentsByStudent(student.id);
      
      // For each course the student is enrolled in
      for (const enrollment of enrollments) {
        const course = await storage.getCourse(enrollment.courseId);
        if (!course) continue;
        
        const courseSessions = await storage.getSessionsByCourse(course.id);
        const courseAttendances = await storage.getAttendanceByStudentAndCourse(
          student.id,
          course.id
        );
        
        const attendancePercentage = courseSessions.length > 0 
          ? (courseAttendances.length / courseSessions.length) * 100 
          : 0;
        
        if (attendancePercentage < course.minAttendancePercentage) {
          atRiskCount++;
          break; // Count each student only once
        }
      }
    }
    
    // Calculate today's attendance percentage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessions.filter(s => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime();
    });
    
    let todayAttendancePercentage = 0;
    
    if (todaySessions.length > 0) {
      let totalPossibleAttendances = 0;
      let totalActualAttendances = 0;
      
      // For each session today
      for (const session of todaySessions) {
        const course = await storage.getCourse(session.courseId);
        if (!course) continue;
        
        const enrollments = await storage.getEnrollmentsByCourse(course.id);
        totalPossibleAttendances += enrollments.length;
        
        const sessionAttendances = await storage.getAttendanceBySession(session.id);
        totalActualAttendances += sessionAttendances.length;
      }
      
      todayAttendancePercentage = totalPossibleAttendances > 0 
        ? Math.round((totalActualAttendances / totalPossibleAttendances) * 100) 
        : 0;
    }
    
    return res.status(200).json({
      totalStudents: students.length,
      activeCourses: courses.length,
      atRiskStudents: atRiskCount,
      attendanceToday: `${todayAttendancePercentage}%`
    });
  });
  
  // Get course attendance data for charts
  app.get('/api/admin/courses/:courseId/attendance-data', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const courseId = parseInt(req.params.courseId);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }
    
    const course = await storage.getCourse(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    const sessions = await storage.getSessionsByCourse(courseId);
    
    // Sort sessions by date
    sessions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const chartData = await Promise.all(
      sessions.map(async (session) => {
        const attendances = await storage.getAttendanceBySession(session.id);
        const enrollments = await storage.getEnrollmentsByCourse(courseId);
        const attendancePercentage = enrollments.length > 0 
          ? Math.round((attendances.length / enrollments.length) * 100) 
          : 0;
        
        const sessionDate = new Date(session.date);
        const dateLabel = sessionDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        
        return {
          session: `${dateLabel} (${session.startTime})`,
          attendanceCount: attendances.length,
          totalStudents: enrollments.length,
          attendancePercentage
        };
      })
    );
    
    return res.status(200).json(chartData);
  });
  
  // Export attendance data as CSV
  app.get('/api/admin/export-attendance', async (req: Request, res: Response) => {
    const token = req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
    
    // If courseId provided, validate it
    if (courseId !== undefined) {
      if (isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
    }
    
    // Get attendance data
    // Get all sessions
    const allSessions = await storage.getSessions();
    
    // Get attendance records for all sessions
    const allAttendancesPromises = allSessions.map(session => 
      storage.getAttendanceBySession(session.id)
    );
    const allAttendancesBySession = await Promise.all(allAttendancesPromises);
    const allAttendances = allAttendancesBySession.flat();
    
    // Filter by courseId if needed
    const filteredAttendances = courseId !== undefined 
      ? await Promise.all(
          allAttendances.filter(async (attendance) => {
            const session = await storage.getSession(attendance.sessionId);
            return session && session.courseId === courseId;
          })
        )
      : allAttendances;
    
    // Generate CSV data
    let csvContent = "Student Name,Student ID,Course,Session Date,Session Time,Timestamp\n";
    
    for (const attendance of filteredAttendances) {
      const student = await storage.getUser(attendance.studentId);
      const session = await storage.getSession(attendance.sessionId);
      
      if (!student || !session) continue;
      
      const course = await storage.getCourse(session.courseId);
      if (!course) continue;
      
      const sessionDate = new Date(session.date).toLocaleDateString();
      const sessionTime = `${session.startTime} - ${session.endTime}`;
      const attendanceTime = new Date(attendance.timestamp).toLocaleString();
      
      csvContent += `${student.name},${student.id},${course.courseName} (${course.courseCode}),${sessionDate},${sessionTime},${attendanceTime}\n`;
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
    
    return res.status(200).send(csvContent);
  });

  const httpServer = createServer(app);
  return httpServer;
}
