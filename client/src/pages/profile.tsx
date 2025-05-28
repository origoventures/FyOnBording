import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, User as UserIcon, CreditCard, Smartphone, ChevronRight, BarChart, CalendarDays } from "lucide-react";
import { format } from 'date-fns';
import { SeoAnalysis } from '@shared/schema';

export default function ProfilePage() {
  const { user, subscription, loading } = useAuth();
  const [_, navigate] = useLocation();
  const [recentAnalyses, setRecentAnalyses] = useState<SeoAnalysis[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login?redirect=/profile');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          // Fetch recent analyses
          const analysesResponse = await apiRequest({
            url: `/api/user/analyses`,
            method: 'GET',
            params: { userId: user.uid, limit: 5 }
          });
          setRecentAnalyses(analysesResponse);

          // Fetch payment history
          const paymentsResponse = await apiRequest({
            url: `/api/user/payments`,
            method: 'GET',
            params: { userId: user.uid }
          });
          setPayments(paymentsResponse || []);

        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setDataLoading(false);
          setPaymentsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  // Get plan details based on subscription
  const getPlanDetails = () => {
    let planColor = 'bg-blue-100 text-blue-800';
    let planName = 'Free';

    if (subscription?.currentPlan === 'basic') {
      planColor = 'bg-emerald-100 text-emerald-800';
      planName = 'Pro';
    } else if (subscription?.currentPlan === 'premium') {
      planColor = 'bg-violet-100 text-violet-800';
      planName = 'Premium';
    } else if (subscription?.currentPlan === 'enterprise') {
      planColor = 'bg-indigo-100 text-indigo-800';
      planName = 'Enterprise';
    }

    return { planColor, planName };
  };

  const { planColor, planName } = getPlanDetails();

  // Calculate usage percentage
  const usagePercentage = subscription 
    ? Math.min(100, Math.round(((subscription.monthlyUsage ?? 0) / subscription.monthlyLimit) * 100))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled in useEffect
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Profilo Utente</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Informazioni Utente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center">
                  <div className="flex justify-center items-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Email</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex justify-center items-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium">
                      <Badge className={planColor}>{planName}</Badge>
                    </p>
                    <p className="text-xs text-muted-foreground">Piano attuale</p>
                  </div>
                </div>

                {subscription && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">
                      Analisi SEO: {subscription.monthlyUsage ?? 0}/{subscription.monthlyLimit} utilizzate
                      ({subscription.remainingUsage} rimanenti)
                    </p>
                    <Progress value={usagePercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">Reimpostato mensilmente</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/plans')}
              >
                Cambia piano
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Recent Activity Card */}
        <div className="md:col-span-2">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Analisi SEO Recenti</CardTitle>
              <CardDescription>Le tue analisi SEO più recenti</CardDescription>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : recentAnalyses.length > 0 ? (
                <div className="divide-y">
                  {recentAnalyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-4">
                        <div className="flex justify-center items-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                          <BarChart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px] md:max-w-[300px]">
                            {analysis.url}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Score: {analysis.score}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-4">
                          {analysis.createdAt ? format(new Date(String(analysis.createdAt)), 'dd/MM/yyyy') : 'N/A'}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => navigate(`/seo?url=${encodeURIComponent(analysis.url)}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Non hai ancora effettuato analisi SEO</p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/seo')}
                    className="mt-2"
                  >
                    Inizia una nuova analisi
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment History Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Cronologia Pagamenti</CardTitle>
              <CardDescription>I tuoi pagamenti recenti</CardDescription>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : payments.length > 0 ? (
                <div className="divide-y">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-4">
                        <div className="flex justify-center items-center h-10 w-10 rounded-full bg-green-100 text-green-600">
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Piano {payment.planType.charAt(0).toUpperCase() + payment.planType.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {payment.stripeSessionId.substring(0, 10)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="text-right">
                          <p className="text-sm font-medium">€{(payment.amount / 100).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.createdAt ? format(new Date(String(payment.createdAt)), 'dd/MM/yyyy') : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Non hai ancora effettuato pagamenti</p>
                  <Button 
                    variant="link" 
                    onClick={() => navigate('/plans')}
                    className="mt-2"
                  >
                    Scopri i nostri piani
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}