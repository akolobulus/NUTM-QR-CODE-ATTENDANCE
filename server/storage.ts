import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  sessions, type Session, type InsertSession,
  enrollments, type Enrollment, type InsertEnrollment,
  attendance, type Attendance, type InsertAttendance,
  faculties, type Faculty, type InsertFaculty
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Course methods
  getCourse(id: number): Promise<Course | undefined>;
  getCourseByCode(code: string): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  getCourses(): Promise<Course[]>;
  getCoursesBySemester(semester: string): Promise<Course[]>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined>;
  deleteCourse(id: number): Promise<boolean>;
  
  // Session methods
  getSession(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  getSessions(): Promise<Session[]>;
  getSessionsByCourse(courseId: number): Promise<Session[]>;
  
  // Enrollment methods
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  getEnrollments(): Promise<Enrollment[]>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]>;
  
  // Attendance methods
  getAttendance(id: number): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByStudent(studentId: number): Promise<Attendance[]>;
  getAttendanceBySession(sessionId: number): Promise<Attendance[]>;
  getAttendanceByStudentAndCourse(studentId: number, courseId: number): Promise<Attendance[]>;
  
  // Faculty methods
  getFaculty(id: number): Promise<Faculty | undefined>;
  createFaculty(faculty: InsertFaculty): Promise<Faculty>;
  getFaculties(): Promise<Faculty[]>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Seed the database with initial data if empty
    this.seedDatabaseIfEmpty();
  }

  private async seedDatabaseIfEmpty() {
    // Check if there are any users in the database
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      console.log('Seeding database with initial data...');
      
      try {
        // Create admin user
        const admin = await this.createUser({
          username: "admin",
          password: "admin123",
          email: "admin@nutm.edu.ng",
          name: "Admin User",
          role: "admin"
        });
        
        // Create student user
        const student = await this.createUser({
          username: "student",
          password: "student123",
          email: "student@nutm.edu.ng",
          name: "John Doe",
          role: "student"
        });
        
        // Create faculty
        const computerScience = await this.createFaculty({
          name: "Computer Science"
        });
        
        // Create courses
        const course1 = await this.createCourse({
          courseCode: "CSC301",
          courseName: "Computer Networks",
          lecturer: "Prof. Sarah Johnson",
          totalSessions: 45,
          semester: "Beta Semester",
          description: "Introduction to computer networking concepts",
          minAttendancePercentage: 70
        });
        
        const course2 = await this.createCourse({
          courseCode: "CSC302",
          courseName: "Database Systems",
          lecturer: "Dr. Michael Wong",
          totalSessions: 45,
          semester: "Beta Semester",
          description: "Database design and implementation",
          minAttendancePercentage: 70
        });
        
        const course3 = await this.createCourse({
          courseCode: "CSC303",
          courseName: "Software Engineering",
          lecturer: "Prof. David Chen",
          totalSessions: 45,
          semester: "Beta Semester",
          description: "Software development life cycle and methodologies",
          minAttendancePercentage: 70
        });
        
        // Create sessions
        const now = new Date();
        
        await this.createSession({
          courseId: course1.id,
          date: now,
          startTime: "10:30",
          endTime: "12:30"
        });
        
        await this.createSession({
          courseId: course2.id,
          date: now,
          startTime: "13:15",
          endTime: "15:15"
        });
        
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        await this.createSession({
          courseId: course3.id,
          date: yesterday,
          startTime: "09:00",
          endTime: "11:00"
        });
        
        // Enroll student in courses
        await this.createEnrollment({
          studentId: student.id,
          courseId: course1.id
        });
        
        await this.createEnrollment({
          studentId: student.id,
          courseId: course2.id
        });
        
        await this.createEnrollment({
          studentId: student.id,
          courseId: course3.id
        });
        
        console.log('Database successfully seeded!');
      } catch (error) {
        console.error('Error seeding database:', error);
      }
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.courseCode, code));
    return course;
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const [newCourse] = await db.insert(courses).values(course).returning();
    return newCourse;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCoursesBySemester(semester: string): Promise<Course[]> {
    return await db.select().from(courses).where(eq(courses.semester, semester));
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const [updatedCourse] = await db.update(courses)
      .set(course)
      .where(eq(courses.id, id))
      .returning();
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    const result = await db.delete(courses).where(eq(courses.id, id));
    return !!result;
  }

  // Session methods
  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async getSessions(): Promise<Session[]> {
    return await db.select().from(sessions);
  }

  async getSessionsByCourse(courseId: number): Promise<Session[]> {
    return await db.select().from(sessions).where(eq(sessions.courseId, courseId));
  }

  // Enrollment methods
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    return enrollment;
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [newEnrollment] = await db.insert(enrollments).values(enrollment).returning();
    return newEnrollment;
  }

  async getEnrollments(): Promise<Enrollment[]> {
    return await db.select().from(enrollments);
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.studentId, studentId));
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
  }

  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const [attendanceRecord] = await db.select().from(attendance).where(eq(attendance.id, id));
    return attendanceRecord;
  }

  async createAttendance(attendanceRecord: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceRecord).returning();
    return newAttendance;
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.studentId, studentId));
  }

  async getAttendanceBySession(sessionId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.sessionId, sessionId));
  }

  async getAttendanceByStudentAndCourse(studentId: number, courseId: number): Promise<Attendance[]> {
    // This is a more complex query where we need to join sessions and attendance
    const courseSessions = await this.getSessionsByCourse(courseId);
    const sessionIds = courseSessions.map(session => session.id);
    
    // Only proceed if there are sessions for this course
    if (sessionIds.length === 0) return [];
    
    // Find attendance records for the student that match any of the course's sessions
    return await db.select()
      .from(attendance)
      .where(
        and(
          eq(attendance.studentId, studentId),
          // In Drizzle, we'd typically use an "in" operator here, but we'll simulate with basic filtering
          // Since we might have multiple sessions, we'll handle this in memory for simplicity
          eq(attendance.studentId, studentId) // Placeholder - we'll filter by sessionIds below
        )
      )
      .then(records => {
        return records.filter(record => sessionIds.includes(record.sessionId));
      });
  }

  // Faculty methods
  async getFaculty(id: number): Promise<Faculty | undefined> {
    const [faculty] = await db.select().from(faculties).where(eq(faculties.id, id));
    return faculty;
  }

  async createFaculty(faculty: InsertFaculty): Promise<Faculty> {
    const [newFaculty] = await db.insert(faculties).values(faculty).returning();
    return newFaculty;
  }

  async getFaculties(): Promise<Faculty[]> {
    return await db.select().from(faculties);
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private sessions: Map<number, Session>;
  private enrollments: Map<number, Enrollment>;
  private attendances: Map<number, Attendance>;
  private faculties: Map<number, Faculty>;
  private currentUserId: number;
  private currentCourseId: number;
  private currentSessionId: number;
  private currentEnrollmentId: number;
  private currentAttendanceId: number;
  private currentFacultyId: number;

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.sessions = new Map();
    this.enrollments = new Map();
    this.attendances = new Map();
    this.faculties = new Map();
    this.currentUserId = 1;
    this.currentCourseId = 1;
    this.currentSessionId = 1;
    this.currentEnrollmentId = 1;
    this.currentAttendanceId = 1;
    this.currentFacultyId = 1;
    
    // Seed data
    this.seedData();
  }

  private seedData() {
    // Create default admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      email: "admin@nutm.edu.ng",
      name: "Admin User",
      role: "admin"
    };
    this.createUser(adminUser);
    
    // Create default student user
    const studentUser: InsertUser = {
      username: "student",
      password: "student123", // In a real app, this would be hashed
      email: "student@nutm.edu.ng",
      name: "John Doe",
      role: "student"
    };
    this.createUser(studentUser);
    
    // Create faculties
    const computerScience: InsertFaculty = {
      name: "Computer Science"
    };
    this.createFaculty(computerScience);
    
    // Create courses
    const course1: InsertCourse = {
      courseCode: "CSC301",
      courseName: "Computer Networks",
      lecturer: "Prof. Sarah Johnson",
      totalSessions: 45,
      semester: "Beta Semester",
      description: "Introduction to computer networking concepts",
      minAttendancePercentage: 70
    };
    const createdCourse1 = this.createCourse(course1);
    
    const course2: InsertCourse = {
      courseCode: "CSC302",
      courseName: "Database Systems",
      lecturer: "Dr. Michael Wong",
      totalSessions: 45,
      semester: "Beta Semester",
      description: "Database design and implementation",
      minAttendancePercentage: 70
    };
    const createdCourse2 = this.createCourse(course2);
    
    const course3: InsertCourse = {
      courseCode: "CSC303",
      courseName: "Software Engineering",
      lecturer: "Prof. David Chen",
      totalSessions: 45,
      semester: "Beta Semester",
      description: "Software development life cycle and methodologies",
      minAttendancePercentage: 70
    };
    const createdCourse3 = this.createCourse(course3);
    
    // Create sessions
    const now = new Date();
    
    const session1: InsertSession = {
      courseId: createdCourse1.id,
      date: now,
      startTime: "10:30",
      endTime: "12:30"
    };
    this.createSession(session1);
    
    const session2: InsertSession = {
      courseId: createdCourse2.id,
      date: now,
      startTime: "13:15",
      endTime: "15:15"
    };
    this.createSession(session2);
    
    const session3: InsertSession = {
      courseId: createdCourse3.id,
      date: new Date(now.getTime() - 24 * 60 * 60 * 1000), // yesterday
      startTime: "09:00",
      endTime: "11:00"
    };
    this.createSession(session3);
    
    // Enroll student in courses
    const enrollment1: InsertEnrollment = {
      studentId: 2, // student user
      courseId: createdCourse1.id
    };
    this.createEnrollment(enrollment1);
    
    const enrollment2: InsertEnrollment = {
      studentId: 2, // student user
      courseId: createdCourse2.id
    };
    this.createEnrollment(enrollment2);
    
    const enrollment3: InsertEnrollment = {
      studentId: 2, // student user
      courseId: createdCourse3.id
    };
    this.createEnrollment(enrollment3);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === role,
    );
  }

  // Course methods
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }

  async getCourseByCode(code: string): Promise<Course | undefined> {
    return Array.from(this.courses.values()).find(
      (course) => course.courseCode.toLowerCase() === code.toLowerCase(),
    );
  }

  async createCourse(course: InsertCourse): Promise<Course> {
    const id = this.currentCourseId++;
    const newCourse: Course = { ...course, id };
    this.courses.set(id, newCourse);
    return newCourse;
  }

  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCoursesBySemester(semester: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      (course) => course.semester === semester,
    );
  }

  async updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course | undefined> {
    const existingCourse = await this.getCourse(id);
    if (!existingCourse) return undefined;
    
    const updatedCourse: Course = { ...existingCourse, ...course };
    this.courses.set(id, updatedCourse);
    return updatedCourse;
  }

  async deleteCourse(id: number): Promise<boolean> {
    return this.courses.delete(id);
  }

  // Session methods
  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(session: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const newSession: Session = { ...session, id };
    this.sessions.set(id, newSession);
    return newSession;
  }

  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async getSessionsByCourse(courseId: number): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.courseId === courseId,
    );
  }

  // Enrollment methods
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.currentEnrollmentId++;
    const newEnrollment: Enrollment = { ...enrollment, id };
    this.enrollments.set(id, newEnrollment);
    return newEnrollment;
  }

  async getEnrollments(): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values());
  }

  async getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.studentId === studentId,
    );
  }

  async getEnrollmentsByCourse(courseId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.courseId === courseId,
    );
  }

  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendances.get(id);
  }

  async createAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const id = this.currentAttendanceId++;
    const newAttendance: Attendance = { ...attendance, id };
    this.attendances.set(id, newAttendance);
    return newAttendance;
  }

  async getAttendanceByStudent(studentId: number): Promise<Attendance[]> {
    return Array.from(this.attendances.values()).filter(
      (attendance) => attendance.studentId === studentId,
    );
  }

  async getAttendanceBySession(sessionId: number): Promise<Attendance[]> {
    return Array.from(this.attendances.values()).filter(
      (attendance) => attendance.sessionId === sessionId,
    );
  }

  async getAttendanceByStudentAndCourse(studentId: number, courseId: number): Promise<Attendance[]> {
    // Get all sessions for the course
    const courseSessions = await this.getSessionsByCourse(courseId);
    const sessionIds = courseSessions.map(session => session.id);
    
    // Return attendances for those sessions by the student
    return Array.from(this.attendances.values()).filter(
      (attendance) => 
        attendance.studentId === studentId && 
        sessionIds.includes(attendance.sessionId)
    );
  }

  // Faculty methods
  async getFaculty(id: number): Promise<Faculty | undefined> {
    return this.faculties.get(id);
  }

  async createFaculty(faculty: InsertFaculty): Promise<Faculty> {
    const id = this.currentFacultyId++;
    const newFaculty: Faculty = { ...faculty, id };
    this.faculties.set(id, newFaculty);
    return newFaculty;
  }

  async getFaculties(): Promise<Faculty[]> {
    return Array.from(this.faculties.values());
  }
}

// Use the DatabaseStorage implementation instead of MemStorage
export const storage = new DatabaseStorage();
