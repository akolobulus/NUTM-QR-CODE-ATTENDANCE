import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional().default(false)
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [isStudent, setIsStudent] = useState(true);
  const { login, isLoading, user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // If already logged in, redirect based on role
  if (user) {
    if (user.role === 'student') {
      navigate('/student-dashboard');
    } else if (user.role === 'admin') {
      navigate('/admin-dashboard');
    }
  }
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      remember: false
    }
  });
  
  const onSubmit = async (values: LoginFormValues) => {
    try {
      await login(values.username, values.password, values.remember);
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    }
  };
  
  const toggleUserType = (type: 'student' | 'admin') => {
    setIsStudent(type === 'student');
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:block md:w-1/2 bg-primary-dark">
        <div className="flex items-center justify-center h-full bg-black bg-opacity-40">
          <div className="text-center p-10">
            <img src="/images/nutm-logo-full.png" alt="NUTM Logo" className="mx-auto mb-8 h-28" />
            <h1 className="text-white text-4xl font-bold mb-4 font-heading">Attendance System</h1>
            <p className="text-white text-xl">Show up, stand out, and strive for success—your journey starts with every attendance!</p>
          </div>
        </div>
      </div>
      
      <div className="w-full md:w-1/2 bg-white flex items-center justify-center p-8">
        <Card className="max-w-md w-full shadow-none border-none">
          {/* Mobile Logo (only visible on mobile) */}
          <div className="block md:hidden text-center mb-8">
            <img src="/images/nutm-logo-symbol.jpg" alt="NUTM Logo" className="mx-auto h-16" />
          </div>
          
          <h2 className="text-3xl font-bold mb-8 text-center font-heading">Login to Your Account</h2>
          
          {/* Login Type Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <Button
                onClick={() => toggleUserType('student')}
                variant={isStudent ? 'default' : 'outline'}
                className={`rounded-r-none ${isStudent ? 'bg-primary hover:bg-primary-dark' : ''}`}
              >
                Student
              </Button>
              <Button
                onClick={() => toggleUserType('admin')}
                variant={!isStudent ? 'default' : 'outline'}
                className={`rounded-l-none ${!isStudent ? 'bg-primary hover:bg-primary-dark' : ''}`}
              >
                Admin
              </Button>
            </div>
          </div>
          
          <CardContent className="p-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          placeholder="Enter your username" 
                          {...field} 
                        />
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
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="remember"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <Label 
                          htmlFor="remember" 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Remember me
                        </Label>
                      </FormItem>
                    )}
                  />
                  
                  <div className="text-sm">
                    <a 
                      href="#" 
                      className="font-medium text-primary hover:text-primary-dark"
                      onClick={(e) => {
                        e.preventDefault();
                        toast({
                          title: "Password Recovery",
                          description: "Password recovery feature is not implemented in this demo.",
                        });
                      }}
                    >
                      Forgot your password?
                    </a>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary-dark"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
                
                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>Demo credentials:</p>
                  <p>{isStudent ? 'Student: student / student123' : 'Admin: admin / admin123'}</p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
