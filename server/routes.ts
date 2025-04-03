import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as crypto from "crypto";
import { promisify } from "util";
import { 
  insertCourseSchema, 
  insertSessionSchema,
  insertEnrollmentSchema,
  insertAttendanceSchema,
  qrCodeSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";

// Generate a secure hash for QR codes
const generateQRHash = (studentId: number, sessionId: number, timestamp: string): string => {
  const data = `${studentId}:${sessionId}:${timestamp}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Authentication middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

// Admin role middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user!.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  next();
};

// Student role middleware
const requireStudent = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user!.role !== 'student') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Course routes
  app.get('/api/courses', authenticate, async (req: Request, res: Response) => {
    try {
      const semester = req.query.semester as string | undefined;
      
      let courses;
      if (semester) {
        courses = await storage.getCoursesBySemester(semester);
      } else {
        courses = await storage.getCourses();
      }
      
      return res.status(200).json(courses);
    } catch (error) {
      console.error('Error fetching courses:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/courses', requireAdmin, async (req: Request, res: Response) => {
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
      console.error('Error creating course:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/courses/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      return res.status(200).json(course);
    } catch (error) {
      console.error('Error fetching course:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.put('/api/courses/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
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
      console.error('Error updating course:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.delete('/api/courses/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const courseId = parseInt(req.params.id);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
      
      const success = await storage.deleteCourse(courseId);
      if (!success) {
        return res.status(404).json({ message: 'Course not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error('Error deleting course:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Session routes
  app.post('/api/sessions', requireAdmin, async (req: Request, res: Response) => {
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
      console.error('Error creating session:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/courses/:courseId/sessions', authenticate, async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Student management routes
  app.get('/api/students', requireAdmin, async (req: Request, res: Response) => {
    try {
      const students = await storage.getUsersByRole('student');
      return res.status(200).json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  app.get('/api/faculties', requireAdmin, async (req: Request, res: Response) => {
    try {
      const faculties = await storage.getFaculties();
      return res.status(200).json(faculties);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/students', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, email, password, username, facultyId } = req.body;
      
      // Check if user with this email or username already exists
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: 'User with this username already exists' });
      }
      
      // Hash the password
      const salt = crypto.randomBytes(16).toString("hex");
      const buf = await promisify(crypto.scrypt)(password, salt, 64) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      // Create the student user
      const student = await storage.createUser({
        name,
        email,
        username,
        password: hashedPassword,
        role: 'student',
        facultyId: facultyId || null
      });
      
      return res.status(201).json({
        id: student.id,
        name: student.name,
        email: student.email,
        username: student.username,
        role: student.role,
        facultyId: student.facultyId
      });
    } catch (error) {
      console.error('Error creating student:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

// Enrollment routes
  app.post('/api/enrollments', requireAdmin, async (req: Request, res: Response) => {
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
      console.error('Error creating enrollment:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.get('/api/student/enrollments', requireStudent, async (req: Request, res: Response) => {
    try {
      const studentId = req.user!.id;
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      
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
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // QR code generation and attendance tracking
  app.get('/api/student/generate-qr', requireStudent, async (req: Request, res: Response) => {
    try {
      const studentId = req.user!.id;
      
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
    } catch (error) {
      console.error('Error generating QR code:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  app.post('/api/attendance/scan', requireAdmin, async (req: Request, res: Response) => {
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
      console.error('Error scanning QR code:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Attendance history for student
  app.get('/api/student/attendance', requireStudent, async (req: Request, res: Response) => {
    try {
      const studentId = req.user!.id;
      const attendances = await storage.getAttendanceByStudent(studentId);
      
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
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get attendance statistics for admin dashboard
  app.get('/api/admin/statistics', requireAdmin, async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      console.error('Error fetching admin statistics:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get course attendance data for charts
  app.get('/api/admin/courses/:courseId/attendance-data', requireAdmin, async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      console.error('Error fetching course attendance data:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Export attendance data as CSV
  app.get('/api/admin/export-attendance', requireAdmin, async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
      console.error('Error exporting attendance data:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
