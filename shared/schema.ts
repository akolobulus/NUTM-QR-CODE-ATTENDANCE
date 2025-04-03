import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define tables first
export const faculties = pgTable("faculties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique()
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("student"),
  facultyId: integer("faculty_id")
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  courseCode: text("course_code").notNull().unique(),
  courseName: text("course_name").notNull(),
  lecturer: text("lecturer").notNull(),
  totalSessions: integer("total_sessions").notNull(),
  semester: text("semester").notNull(),
  description: text("description"),
  minAttendancePercentage: integer("min_attendance_percentage").notNull().default(70)
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull()
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  courseId: integer("course_id").notNull()
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  sessionId: integer("session_id").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  qrCode: text("qr_code").notNull()
});

// Define relations
export const facultiesRelations = relations(faculties, ({ many }) => ({
  users: many(users)
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  enrollments: many(enrollments),
  faculty: one(faculties, {
    fields: [users.facultyId],
    references: [faculties.id],
  }),
  attendances: many(attendance, { relationName: "student_attendances" })
}));

export const coursesRelations = relations(courses, ({ many }) => ({
  sessions: many(sessions),
  enrollments: many(enrollments)
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  course: one(courses, {
    fields: [sessions.courseId],
    references: [courses.id]
  }),
  attendances: many(attendance)
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, {
    fields: [enrollments.studentId],
    references: [users.id]
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id]
  })
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  student: one(users, {
    fields: [attendance.studentId],
    references: [users.id],
    relationName: "student_attendances"
  }),
  session: one(sessions, {
    fields: [attendance.sessionId],
    references: [sessions.id]
  })
}));

// Insert schemas and types

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true });
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true });
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

export const insertFacultySchema = createInsertSchema(faculties).omit({ id: true });
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Faculty = typeof faculties.$inferSelect;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional()
});

export type LoginData = z.infer<typeof loginSchema>;

// QR code schema
export const qrCodeSchema = z.object({
  studentId: z.number(),
  sessionId: z.number(),
  timestamp: z.string(),
  hash: z.string()
});

export type QRCodeData = z.infer<typeof qrCodeSchema>;
