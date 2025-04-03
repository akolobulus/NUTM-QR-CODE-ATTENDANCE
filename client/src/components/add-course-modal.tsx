import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const courseSchema = z.object({
  courseName: z.string().min(3, { message: "Course name must be at least 3 characters" }),
  courseCode: z.string().min(2, { message: "Course code must be at least 2 characters" }),
  lecturer: z.string().min(3, { message: "Lecturer name must be at least 3 characters" }),
  semester: z.string().min(1, { message: "Semester is required" }),
  description: z.string().optional(),
  totalSessions: z.coerce.number().min(1, { message: "Must have at least 1 session" }),
  minAttendancePercentage: z.coerce.number().min(0).max(100, { message: "Percentage must be between 0 and 100" }),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function AddCourseModal({ isOpen, onClose }: AddCourseModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultValues: CourseFormValues = {
    courseName: '',
    courseCode: '',
    lecturer: '',
    semester: 'Spring 2025',
    description: '',
    totalSessions: 12,
    minAttendancePercentage: 75,
  };

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues,
  });

  const resetForm = () => {
    form.reset(defaultValues);
  };

  const createCourseMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const res = await apiRequest('POST', '/api/courses', values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: "Success",
        description: "Course added successfully",
      });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add course",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: CourseFormValues) => {
    createCourseMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Create a new course in the system. Students can then be enrolled in this course.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="courseName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduction to Programming" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Code</FormLabel>
                    <FormControl>
                      <Input placeholder="CS101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="lecturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lecturer</FormLabel>
                    <FormControl>
                      <Input placeholder="Dr. John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <FormControl>
                      <Input placeholder="Spring 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A brief description of the course" 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="totalSessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Sessions</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minAttendancePercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min. Attendance (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="bg-primary hover:bg-primary-dark" disabled={createCourseMutation.isPending}>
                {createCourseMutation.isPending ? "Adding..." : "Add Course"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}