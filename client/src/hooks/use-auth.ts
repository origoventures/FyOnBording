import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  User 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export interface UserSubscription {
  currentPlan: string | null;
  remainingUsage: number;
  monthlyLimit: number;
  planName?: string;
  isSubscribed?: boolean;
  monthlyUsage?: number;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const { toast } = useToast();

  // Set up firebase auth listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Prima sincronizza l'utente con il database registrandolo/aggiornandolo
          await syncUserWithDatabase(firebaseUser);
          
          // Store user in local storage for other components
          localStorage.setItem('user', JSON.stringify({ 
            id: firebaseUser.uid,
            email: firebaseUser.email 
          }));
          
          // Check subscription status
          const response = await fetch(`/api/user/subscription?userId=${firebaseUser.uid}`, {
            headers: {
              'user-id': firebaseUser.uid,
              'user-email': firebaseUser.email || ''
            }
          });
          const subscriptionData = await response.json();
          setSubscription(subscriptionData);
        } catch (error) {
          console.error('Error syncing user with API:', error);
        }
      } else {
        localStorage.removeItem('user');
        setSubscription(null);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Funzione per sincronizzare l'utente Firebase con il database
  const syncUserWithDatabase = async (firebaseUser: User) => {
    try {
      // Tenta prima il login per vedere se l'utente esiste già
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': firebaseUser.uid,
          'user-email': firebaseUser.email || ''
        },
        body: JSON.stringify({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          authProvider: firebaseUser.providerData[0]?.providerId?.includes('google') ? 'google' : 
                        firebaseUser.providerData[0]?.providerId?.includes('apple') ? 'apple' : 
                        firebaseUser.providerData[0]?.providerId?.includes('github') ? 'github' : 
                        firebaseUser.providerData[0]?.providerId?.includes('facebook') ? 'facebook' : 
                        firebaseUser.providerData[0]?.providerId?.includes('twitter') ? 'twitter' : 'email'
        })
      });
      
      // Gestione errore provider diverso
      if (loginResponse.status === 400) {
        const errorData = await loginResponse.json();
        if (errorData.error === 'AUTH_PROVIDER_MISMATCH') {
          toast({
            title: "Accesso fallito",
            description: errorData.message || "Account già esistente con un altro metodo di accesso. Utilizzare lo stesso metodo di registrazione.",
            variant: "destructive"
          });
          throw new Error('AUTH_PROVIDER_MISMATCH');
        }
      }
      
      // Se l'utente non esiste (404), registralo
      if (loginResponse.status === 404) {
        console.log('User not found, registering new user:', firebaseUser.uid);
        const registerResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': firebaseUser.uid,
            'user-email': firebaseUser.email || ''
          },
          body: JSON.stringify({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            photoURL: firebaseUser.photoURL,
            authProvider: firebaseUser.providerData[0]?.providerId?.includes('google') ? 'google' : 
                          firebaseUser.providerData[0]?.providerId?.includes('apple') ? 'apple' : 
                          firebaseUser.providerData[0]?.providerId?.includes('github') ? 'github' : 
                          firebaseUser.providerData[0]?.providerId?.includes('facebook') ? 'facebook' : 
                          firebaseUser.providerData[0]?.providerId?.includes('twitter') ? 'twitter' : 'email'
          })
        });
        
        if (!registerResponse.ok) {
          const errorData = await registerResponse.json();
          console.error('Registration failed:', errorData);
          throw new Error('Failed to register user');
        }
      }
    } catch (error) {
      console.error('Error synchronizing user with database:', error);
      throw error;
    }
  };

  // Sign up with email/password
  const signup = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user in the backend
      await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': userCredential.user.uid 
        },
        body: JSON.stringify({ 
          id: userCredential.user.uid,
          email: userCredential.user.email,
          authProvider: 'email'
        })
      });
      
      return userCredential.user;
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = "Failed to create account";
      
      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = "Email already in use";
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = "Password is too weak";
      }
      
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  };

  // Login with email/password
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Invia anche il provider all'API di login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': userCredential.user.uid 
        },
        body: JSON.stringify({ 
          id: userCredential.user.uid,
          email: userCredential.user.email,
          authProvider: 'email'
        })
      });
      
      // Gestione errore provider diverso
      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.error === 'AUTH_PROVIDER_MISMATCH') {
          toast({
            title: "Accesso fallito",
            description: errorData.message || "Account già esistente con un altro metodo di accesso. Utilizzare lo stesso metodo di registrazione.",
            variant: "destructive"
          });
          throw new Error('AUTH_PROVIDER_MISMATCH');
        }
      }
      
      return userCredential.user;
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = "Failed to sign in";
      
      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        errorMessage = "Invalid email or password";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  };

  // Logout - versione migliorata
  const logout = async (): Promise<void> => {
    try {
      // Elimina prima i dati di sessione lato client
      localStorage.removeItem('user');
      
      // Disconnetti da Firebase
      await signOut(auth);
      
      // Notifica l'utente
      toast({
        title: "Logout completato",
        description: "Hai effettuato il logout con successo",
      });
      
      // Aggiorna lo stato locale
      setUser(null);
      setSubscription(null);
    } catch (error) {
      console.error("Errore durante il logout:", error);
      toast({
        title: "Logout fallito",
        description: "Non è stato possibile effettuare il logout",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Login with Google
  const loginWithGoogle = async (): Promise<User> => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Registra l'utente se è la prima volta, altrimenti fa login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': userCredential.user.uid
        },
        body: JSON.stringify({ 
          id: userCredential.user.uid,
          email: userCredential.user.email,
          authProvider: 'google'
        })
      });
      
      // Gestione errore provider diverso
      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.error === 'AUTH_PROVIDER_MISMATCH') {
          toast({
            title: "Accesso fallito",
            description: errorData.message || "Account già esistente con un altro metodo di accesso. Utilizzare lo stesso metodo di registrazione.",
            variant: "destructive"
          });
          throw new Error('AUTH_PROVIDER_MISMATCH');
        }
      }
      
      return userCredential.user;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: "Failed to sign in with Google",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Login with Microsoft
  const loginWithMicrosoft = async (): Promise<User> => {
    try {
      const provider = new OAuthProvider('microsoft.com');
      const userCredential = await signInWithPopup(auth, provider);
      
      // Registra l'utente se è la prima volta, altrimenti fa login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': userCredential.user.uid
        },
        body: JSON.stringify({ 
          id: userCredential.user.uid,
          email: userCredential.user.email,
          authProvider: 'github' // Usiamo github perché Microsoft non è presente nell'enum
        })
      });
      
      // Gestione errore provider diverso
      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.error === 'AUTH_PROVIDER_MISMATCH') {
          toast({
            title: "Accesso fallito",
            description: errorData.message || "Account già esistente con un altro metodo di accesso. Utilizzare lo stesso metodo di registrazione.",
            variant: "destructive"
          });
          throw new Error('AUTH_PROVIDER_MISMATCH');
        }
      }
      
      return userCredential.user;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: "Failed to sign in with Microsoft",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Login with Apple
  const loginWithApple = async (): Promise<User> => {
    try {
      const provider = new OAuthProvider('apple.com');
      const userCredential = await signInWithPopup(auth, provider);
      
      // Registra l'utente se è la prima volta, altrimenti fa login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'user-id': userCredential.user.uid
        },
        body: JSON.stringify({ 
          id: userCredential.user.uid,
          email: userCredential.user.email,
          authProvider: 'apple'
        })
      });
      
      // Gestione errore provider diverso
      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData.error === 'AUTH_PROVIDER_MISMATCH') {
          toast({
            title: "Accesso fallito",
            description: errorData.message || "Account già esistente con un altro metodo di accesso. Utilizzare lo stesso metodo di registrazione.",
            variant: "destructive"
          });
          throw new Error('AUTH_PROVIDER_MISMATCH');
        }
      }
      
      return userCredential.user;
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: "Failed to sign in with Apple",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    user,
    loading,
    subscription,
    signup,
    login,
    logout,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithApple,
    isAuthenticated: !!user,
    hasActiveSubscription: !!subscription?.remainingUsage && subscription.remainingUsage > 0
  };
}