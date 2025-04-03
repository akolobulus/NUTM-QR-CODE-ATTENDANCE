import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getAdminStatistics, getCourseAttendanceData, downloadAttendanceReport } from '@/lib/attendance';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Sidebar } from '@/components/layout/sidebar';
import AddCourseModal from '@/components/add-course-modal';
import AttendanceChart from '@/components/attendance-chart';
import {
  Download,
  Upload,
  Search,
  FileOutput,
  Filter,
  Edit,
  Trash,
  Eye,
} from 'lucide-react';
import { useIsMobile as useMobile } from '@/hooks/use-mobile';

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const isMobile = useMobile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState('Beta Semester');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCourseForChart, setSelectedCourseForChart] = useState<number | null>(null);

  // Redirect if not logged in or not an admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      navigate('/');
      toast({
        title: 'Access Denied',
        description: 'You must be logged in as an admin to view this page.',
        variant: 'destructive',
      });
    }
  }, [user, authLoading, navigate, toast]);

  // Fetch dashboard statistics
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/statistics'],
    queryFn: getAdminStatistics,
  });

  // Fetch courses
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses', selectedSemester],
    queryFn: async () => {
      const res = await fetch(`/api/courses?semester=${encodeURIComponent(selectedSemester)}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    }
  });

  // Fetch chart data for a specific course
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['/api/admin/courses', selectedCourseForChart, 'attendance-data'],
    queryFn: () => getCourseAttendanceData(selectedCourseForChart || 1),
    enabled: selectedCourseForChart !== null,
  });

  // Filter courses based on search query
  const filteredCourses = courses?.filter((course: { courseName: string; courseCode: string; lecturer: string }) => 
    course.courseName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    course.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.lecturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Set a default selected course for chart if we haven't selected one yet but have courses
  useEffect(() => {
    if (courses?.length && selectedCourseForChart === null) {
      setSelectedCourseForChart(courses[0].id);
    }
  }, [courses, selectedCourseForChart]);
  
  const handleExportAttendance = () => {
    downloadAttendanceReport(selectedCourseForChart || undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for desktop */}
      {!isMobile && <Sidebar setMobileMenuOpen={setMobileMenuOpen} />}

      {/* Mobile sidebar - controlled by mobileMenuOpen state */}
      {isMobile && mobileMenuOpen && <Sidebar setMobileMenuOpen={setMobileMenuOpen} />}

      {/* Main content */}
      <div className="flex flex-col w-full">
        {/* Mobile header */}
        {isMobile && (
          <div className="bg-primary fixed top-0 left-0 right-0 z-10">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} className="text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </Button>
                <div className="h-8 w-auto ml-3 text-white font-bold">NUTM</div>
              </div>
              <div className="text-white font-medium">Admin Dashboard</div>
            </div>
          </div>
        )}

        <main className={`flex-1 relative overflow-y-auto focus:outline-none ${isMobile ? 'pt-16' : ''}`}>
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 font-heading">Admin Dashboard</h1>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
              {/* Semester Toggle */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-700 mb-3 sm:mb-0 font-heading">Semester Overview</h2>
                <div className="flex items-center">
                  <span className="mr-3 text-sm font-medium text-gray-700">Select Semester:</span>
                  <Select 
                    value={selectedSemester} 
                    onValueChange={setSelectedSemester}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beta Semester">Beta Semester</SelectItem>
                      <SelectItem value="Gamma Semester">Gamma Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Dashboard Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statsLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-lg" />
                  ))
                ) : statistics && (
                  <>
                    <Card>
                      <CardContent className="p-6 flex items-center">
                        <div className="rounded-full bg-primary-light p-3 mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary text-xl"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500">Total Students</div>
                          <div className="mt-1 text-3xl font-semibold text-gray-900">{statistics.totalStudents}</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 flex items-center">
                        <div className="rounded-full bg-blue-100 p-3 mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 text-xl"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"></path><path d="M8 7h6"></path><path d="M8 11h8"></path><path d="M8 15h5"></path></svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500">Active Courses</div>
                          <div className="mt-1 text-3xl font-semibold text-gray-900">{statistics.activeCourses}</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 flex items-center">
                        <div className="rounded-full bg-yellow-100 p-3 mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 text-xl"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500">At Risk Students</div>
                          <div className="mt-1 text-3xl font-semibold text-gray-900">{statistics.atRiskStudents}</div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-6 flex items-center">
                        <div className="rounded-full bg-green-100 p-3 mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 text-xl"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><path d="m9 11 3 3L22 4"></path></svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-500">Attendance Today</div>
                          <div className="mt-1 text-3xl font-semibold text-gray-900">{statistics.attendanceToday}</div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
              
              {/* Real-Time Chart */}
              <Card className="mb-8">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 font-heading">Attendance Trends</h3>
                  <div className="flex space-x-3">
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary-dark"
                      onClick={handleExportAttendance}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    
                    <Select
                      value={selectedCourseForChart?.toString() || ''}
                      onValueChange={(value) => setSelectedCourseForChart(Number(value))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses?.map((course: { id: number; courseCode: string; courseName: string }) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.courseCode} - {course.courseName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="h-80">
                    {chartLoading && <Skeleton className="h-full w-full" />}
                    {chartData && selectedCourseForChart && (
                      <AttendanceChart data={chartData} />
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Course Management */}
              <Card>
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 font-heading">Course Management</h3>
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary-dark"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Add Course
                  </Button>
                </div>
                
                <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200">
                  <div className="relative max-w-xs w-full mb-3 sm:mb-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input 
                      type="text" 
                      placeholder="Search courses..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mr-3"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Import
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExportAttendance}>
                      <FileOutput className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  {coursesLoading ? (
                    <div className="p-6">
                      <Skeleton className="h-64 w-full" />
                    </div>
                  ) : filteredCourses && filteredCourses.length > 0 ? (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Code</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course Name</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lecturer</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sessions</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredCourses.map((course: { id: number; courseCode: string; courseName: string; lecturer: string; totalSessions: number }) => (
                          <tr key={course.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{course.courseCode}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.courseName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.lecturer}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.totalSessions}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-primary hover:text-primary-dark" 
                                  onClick={() => toast({ title: "Edit Course", description: "Edit functionality is not implemented in this demo" })}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => toast({ title: "Delete Course", description: "Delete functionality is not implemented in this demo" })}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="text-blue-500 hover:text-blue-700"
                                  onClick={() => {
                                    setSelectedCourseForChart(course.id);
                                    // Scroll to chart
                                    document.querySelector('.mb-8')?.scrollIntoView({ behavior: 'smooth' });
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No courses found</p>
                    </div>
                  )}
                </div>
                
                {filteredCourses && filteredCourses.length > 0 && (
                  <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredCourses.length}</span> of <span className="font-medium">{filteredCourses.length}</span> courses
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Add Course Modal */}
      <AddCourseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
