import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const studentSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  facultyId: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function AddStudentModal({ isOpen, onClose }: AddStudentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [faculties, setFaculties] = useState<any[]>([]);

  const { data: facultiesData, isLoading: facultiesLoading } = useQuery({
    queryKey: ['/api/faculties'],
    enabled: isOpen,
  });

  useEffect(() => {
    if (facultiesData) {
      setFaculties(facultiesData as any[]);
    }
  }, [facultiesData]);

  const defaultValues: StudentFormValues = {
    name: '',
    email: '',
    username: '',
    password: '',
    facultyId: undefined,
  };

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues,
  });

  const resetForm = () => {
    form.reset(defaultValues);
  };

  const createStudentMutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      const payload = {
        ...values,
        facultyId: values.facultyId ? parseInt(values.facultyId) : null,
      };
      const res = await apiRequest('POST', '/api/students', payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Success",
        description: "Student added successfully",
      });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add student",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: StudentFormValues) => {
    createStudentMutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Add a new student to the system. They will be able to log in and view their courses and attendance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="student@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••••" type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="facultyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Faculty</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={facultiesLoading || createStudentMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a faculty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {faculties && faculties.map((faculty) => (
                        <SelectItem key={faculty.id} value={faculty.id.toString()}>
                          {faculty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="bg-primary hover:bg-primary-dark" disabled={createStudentMutation.isPending}>
                {createStudentMutation.isPending ? "Adding..." : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}