import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { EnrollmentData } from '@/lib/attendance';

interface AttendanceProgressProps {
  data: EnrollmentData;
}

export default function AttendanceProgress({ data }: AttendanceProgressProps) {
  const { course, attendancePercentage, attendedSessions, totalSessions } = data;
  
  // Determine status based on percentage
  const getStatus = () => {
    const minRequired = course.minAttendancePercentage;
    if (attendancePercentage >= minRequired) {
      return { 
        color: 'bg-primary',
        badgeColor: 'bg-primary-light text-primary-dark',
        icon: <CheckCircle className="mr-1 h-3 w-3" />,
        text: 'Eligible for Exams'
      };
    } else if (attendancePercentage >= minRequired - 10) {
      return { 
        color: 'bg-yellow-500',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        icon: <AlertTriangle className="mr-1 h-3 w-3" />,
        text: 'Near Threshold'
      };
    } else {
      return { 
        color: 'bg-red-500',
        badgeColor: 'bg-red-100 text-red-800',
        icon: <XCircle className="mr-1 h-3 w-3" />,
        text: 'Not Eligible for Exams'
      };
    }
  };
  
  const status = getStatus();
  
  return (
    <div className="mb-6 border-b pb-6 last:border-b-0 last:pb-0">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-800">{course.courseName} ({course.courseCode})</h3>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-light text-primary-dark">
          {course.semester}
        </span>
      </div>
      
      <div className="flex items-center text-sm text-gray-600 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        <span>{course.lecturer}</span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        Attendance: <span className="font-bold">{attendedSessions}</span>/<span>{totalSessions}</span> sessions (<span className="font-bold">{attendancePercentage}%</span>)
      </p>
      
      <Progress value={attendancePercentage} className="h-2.5 mb-3" indicatorClassName={status.color} />
      
      <div className="flex items-center">
        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${status.badgeColor}`}>
          {status.icon} {status.text}
        </span>
        <span className="text-xs text-gray-500 ml-3">Minimum required: {course.minAttendancePercentage}%</span>
      </div>
    </div>
  );
}
