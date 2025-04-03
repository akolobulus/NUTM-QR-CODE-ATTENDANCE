import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getStudentEnrollments, getStudentAttendanceHistory } from '@/lib/attendance';
import QRCode from '@/components/qr-code';
import AttendanceProgress from '@/components/attendance-progress';
import { LogOut, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useState } from 'react';

export default function StudentDashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Redirect if not logged in or not a student
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'student')) {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You must be logged in as a student to view this page.',
        variant: 'destructive',
      });
    }
  }, [user, authLoading, navigate, toast]);

  // Fetch student's enrollments and attendance data
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['/api/student/enrollments'],
    queryFn: getStudentEnrollments,
  });

  // Fetch student's attendance history
  const { data: attendanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/student/attendance'], 
    queryFn: getStudentAttendanceHistory,
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: 'There was an error logging you out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Calculate total pages for attendance history pagination
  const totalPages = attendanceHistory ? Math.ceil(attendanceHistory.length / itemsPerPage) : 0;
  
  // Get current page items
  const currentAttendanceItems = attendanceHistory
    ? attendanceHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-8 w-32 mb-4 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/images/nutm-logo-symbol.jpg" alt="NUTM" className="h-8 w-8 mr-3" />
            <h1 className="text-xl font-bold font-heading text-gray-800">Student Dashboard</h1>
          </div>
          
          <div className="flex items-center">
            <span className="mr-4 text-sm font-medium text-gray-700">{user.name}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* QR Code Section */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4 font-heading">Your QR Code</h2>
                
                <QRCode />
              </CardContent>
            </Card>
          </div>
          
          {/* Attendance & Eligibility Widget */}
          <div className="md:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4 font-heading">Attendance & Eligibility Status</h2>
                
                {enrollmentsLoading ? (
                  <div className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : enrollments && enrollments.length > 0 ? (
                  enrollments.map((item) => (
                    <AttendanceProgress key={item.enrollment.id} data={item} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <User className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    <p>You are not enrolled in any courses.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Attendance History */}
          <div className="md:col-span-3">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-4 font-heading">Recent Attendance</h2>
                
                {historyLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : attendanceHistory && attendanceHistory.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentAttendanceItems.map((record) => (
                            <tr key={record.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(record.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {record.courseName} ({record.courseCode})
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {record.time}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  {record.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="mt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <PaginationItem key={i}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(i + 1)}
                                  isActive={currentPage === i + 1}
                                >
                                  {i + 1}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <User className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    <p>No attendance records found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
