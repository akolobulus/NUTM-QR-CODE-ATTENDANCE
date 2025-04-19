# NUTM QR-Based Attendance Tracking System

A modern, QR-based attendance tracking system for NUTM (National University of Technology and Management), offering comprehensive management tools for students and administrators through an intuitive, technology-driven platform.

## 📋 Overview

This application streamlines the tracking of student attendance using QR code technology. It replaces traditional paper-based attendance systems with a digital solution that provides real-time insights and reporting capabilities.

### Key Features

- **QR Code Generation & Scanning**: Dynamic QR codes generated for each student session
- **Role-Based Access Control**: Separate interfaces for students and administrators
- **Real-Time Attendance Tracking**: Instant recording of student attendance
- **Dashboard Analytics**: Visual representation of attendance trends
- **Course Management**: Tools to add, edit, and manage courses
- **Student Management**: Tools to add students and track individual performance
- **Attendance Reports**: Ability to export attendance data for analysis
- **Mobile-Friendly Design**: Responsive interface works on all devices

## 🏗️ Technology Stack

### Frontend
- React.js with TypeScript
- TanStack Query for data fetching
- Shadcn UI + Tailwind CSS for styling
- Recharts for data visualization
- React Hook Form for form management
- Zod for schema validation

### Backend
- Express.js with TypeScript
- Passport.js for authentication
- PostgreSQL database for data persistence
- Drizzle ORM for database access
- Session-based authentication

## 🗄️ Data Model

### Core Entities

- **Users**: Students and administrators with role-based permissions
- **Faculties**: Academic departments 
- **Courses**: Academic courses with attendance requirements
- **Sessions**: Individual class sessions for each course
- **Enrollments**: Student enrollment in courses
- **Attendance**: Records of student attendance at sessions

## 👥 User Roles and Features

### Student Features
- Generate QR codes for attendance scanning
- View personal attendance records
- Monitor attendance status for all enrolled courses
- Track attendance eligibility status
- Access attendance history

### Administrator Features
- Scan student QR codes to mark attendance
- Add and manage courses
- Add and manage students
- View attendance statistics and analytics
- Export attendance reports
- Monitor at-risk students based on attendance

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/nutm-attendance-system.git
   cd nutm-attendance-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     DATABASE_URL=postgresql://username:password@localhost:5432/nutm_attendance
     SESSION_SECRET=your-secure-session-secret
     PORT=5000
     ```

4. Push database schema:
   ```
   npm run db:push
   ```

5. Start the development server:
   ```
   npm run dev
   ```

6. Access the application:
   - Open your browser and navigate to `http://localhost:5000`
   - Default admin credentials: username: `admin`, password: `admin`
   - Default student credentials: username: `student`, password: `student`

## 📱 Application Usage

### For Students
1. Log in using your student credentials
2. View your attendance status for all enrolled courses
3. During class, open the QR code page
4. Show the generated QR code to your instructor to mark attendance

### For Administrators
1. Log in using your admin credentials
2. View dashboard analytics showing attendance trends
3. Add courses and students as needed
4. During class, use the "Scan QR Code" feature to mark student attendance
5. Export attendance reports for further analysis

## 🛠️ Development

### Project Structure
- `/client`: Frontend React application
- `/server`: Backend Express API
- `/shared`: Shared types and schemas

### Key Commands
- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run db:push`: Push schema changes to the database

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- NUTM faculty and students for feedback during development
- Open source libraries and tools that made this project possible