import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FaGoogle, FaMicrosoft, FaApple } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

// Define the form schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [, navigate] = useLocation();
  const { 
    login, 
    signup, 
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithApple,
    user,
    isAuthenticated,
    subscription
  } = useAuth();
  const { toast } = useToast();

  // Get redirect URL from query string if it exists
  const searchParams = new URLSearchParams(window.location.search);
  const redirectUrl = searchParams.get("redirect") || "/";
  
  // Controlla se l'utente aveva selezionato un piano prima di fare login
  const selectedPlan = sessionStorage.getItem('selectedPlan');
  
  // If already logged in, check subscription and redirect
  useEffect(() => {
    if (isAuthenticated) {
      // Se l'utente ha già effettuato l'accesso, controlla se era in processo di acquisto
      if (selectedPlan) {
        // Rimuovi il piano dalla sessionStorage
        sessionStorage.removeItem('selectedPlan');
        
        // Controlla se il piano è "free" per reindirizzare alla pagina SEO
        if (selectedPlan === 'free') {
          toast({
            title: "Login successful",
            description: "Redirecting to SEO analysis...",
          });
          navigate('/seo');
          return;
        }
        
        toast({
          title: "Login successful",
          description: "Redirecting to complete your subscription...",
        });
        
        // Gestisci il checkout direttamente se l'utente esiste
        if (user) {
          // Crea direttamente la sessione di checkout per il piano selezionato
          setIsCheckoutLoading(true);
          
          fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              planType: selectedPlan,
              userId: user.uid
            }),
          })
          .then(res => {
            if (!res.ok) {
              throw new Error('Failed to create checkout session');
            }
            return res.json();
          })
          .then(data => {
            window.location.href = data.url;
          })
          .catch(error => {
            console.error('Error initiating checkout:', error);
            toast({
              title: "Checkout Error",
              description: "There was a problem processing your subscription. Please try again.",
              variant: "destructive",
            });
            navigate('/plans');
          })
          .finally(() => {
            setIsCheckoutLoading(false);
          });
        }
      } else if (subscription?.remainingUsage && subscription.remainingUsage > 0) {
        // User has an active subscription with remaining usage, redirect to requested page
        navigate(redirectUrl);
      } else {
        // User doesn't have an active subscription, redirect to plans page
        navigate('/plans');
      }
    }
  }, [isAuthenticated, subscription, navigate, redirectUrl, selectedPlan, user, toast]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Signup form
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password);
      // Non mostriamo un toast qui perché il redirect verrà gestito
      // dal useEffect quando isAuthenticated diventa true
      // e controlla se c'è un piano selezionato
      
      // Nota: non facciamo navigate qui perché vogliamo che il useEffect
      // gestisca il reindirizzamento in base al piano selezionato
    } catch (error: any) {
      // Speciale gestione per errore di provider diverso
      if (error.message === 'AUTH_PROVIDER_MISMATCH') {
        // L'errore è già stato mostrato all'utente tramite toast nel hook di autenticazione
        toast({
          title: "Metodo di accesso non corretto",
          description: "Hai già un account registrato con un altro metodo di accesso (Google, Apple, ecc). Utilizza lo stesso metodo con cui ti sei registrato in precedenza.",
          variant: "destructive",
        });
      }
      // Altri errori sono gestiti nel hook di autenticazione
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signup submission
  const onSignupSubmit = async (values: SignupFormValues) => {
    setIsLoading(true);
    try {
      await signup(values.email, values.password);
      // Non mostriamo un toast qui perché il redirect verrà gestito
      // dal useEffect quando isAuthenticated diventa true
      // e controlla se c'è un piano selezionato
      
      // Nota: non facciamo navigate qui perché vogliamo che il useEffect
      // gestisca il reindirizzamento in base al piano selezionato
    } catch (error) {
      // Error is handled in the useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth login
  const handleOAuthLogin = async (provider: 'google' | 'microsoft' | 'apple') => {
    setIsLoading(true);
    try {
      if (provider === 'google') {
        await loginWithGoogle();
      } else if (provider === 'microsoft') {
        await loginWithMicrosoft();
      } else if (provider === 'apple') {
        await loginWithApple();
      }
      
      // Non mostriamo un toast qui perché il redirect verrà gestito
      // dal useEffect quando isAuthenticated diventa true
      // e controlla se c'è un piano selezionato
      
      // Nota: non facciamo navigate qui perché vogliamo che il useEffect
      // gestisca il reindirizzamento in base al piano selezionato
    } catch (error: any) {
      // Speciale gestione per errore di provider diverso
      if (error.message === 'AUTH_PROVIDER_MISMATCH') {
        // L'errore è già stato mostrato all'utente tramite toast nel hook di autenticazione
        // Qui possiamo aggiungere un avviso visibile nell'interfaccia per dare istruzioni
        const providerText = provider === 'google' ? 'Google' : 
                           provider === 'microsoft' ? 'Microsoft' : 'Apple';
        
        toast({
          title: "Metodo di accesso non corretto",
          description: `Hai già un account registrato con un altro metodo di accesso. Utilizza lo stesso metodo con cui ti sei registrato in precedenza.`,
          variant: "destructive",
        });
      }
      // Altri errori sono gestiti nel hook di autenticazione
    } finally {
      setIsLoading(false);
    }
  };

  // Mostra schermata di caricamento durante il processo di checkout
  if (isCheckoutLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f9fef0] px-4">
        <div className="mb-6">
          <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Creating checkout session...</h2>
        <p className="text-muted-foreground mb-8">Please wait, you'll be redirected to complete payment.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f9fef0] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to SEO Analyzer</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            
            {/* Login Form */}
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Login"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Signup Form */}
            <TabsContent value="signup">
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={signupForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Loading..." : "Sign up"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2">Or continue with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-4">
              <Button 
                variant="outline" 
                className="flex items-center justify-center" 
                onClick={() => handleOAuthLogin('google')}
                disabled={isLoading}
              >
                <FaGoogle className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={() => handleOAuthLogin('microsoft')}
                disabled={isLoading}
              >
                <FaMicrosoft className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center justify-center"
                onClick={() => handleOAuthLogin('apple')}
                disabled={isLoading}
              >
                <FaApple className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground border rounded-md p-2 bg-slate-50">
              <p className="text-xs">
                <strong>Nota:</strong> Per motivi di sicurezza, devi sempre utilizzare lo stesso metodo di accesso 
                con cui ti sei registrato originariamente. Se hai creato un account con Google, devi continuare 
                ad accedere con Google.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-center text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}