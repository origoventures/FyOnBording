import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function Header() {
  const [location] = useLocation();
  const { 
    user, 
    logout, 
    isAuthenticated, 
    subscription, 
    loading,
    hasActiveSubscription 
  } = useAuth();
  
  // Estrai l'email e preparala per visualizzarla
  const userEmail = user?.email || '';
  const userInitials = userEmail 
    ? userEmail.split('@')[0].slice(0, 2).toUpperCase() 
    : '';
    
  // Gestisci il logout in modo più completo
  const handleLogout = async () => {
    try {
      await logout();
      // Reindirizza l'utente alla home dopo il logout
      window.location.href = '/';
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };
  
  return (
    <header className="bg-[#f9fef0] py-3 px-4 sm:py-4 sm:px-6 lg:px-8 shadow-md">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
        <div className="text-[#03071C] font-bold text-xl sm:text-2xl tracking-tight mb-4 sm:mb-0">
          <Link href="/">
            <span className="cursor-pointer">
              <span className="text-[#03071C]">Meta </span>
              <span className="text-[#00853f]">Muse</span>
              <span className="block text-xs text-gray-500">your seo analyzer</span>
            </span>
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {!isAuthenticated && (
              <Link href="/">
                <span className={`block text-sm font-medium py-2 px-1 border-b-2 ${location === '/' ? 'border-blue-500' : 'border-transparent hover:border-gray-300'} cursor-pointer`}>
                  Pricing
                </span>
              </Link>
            )}
            
            <Link href="/plans">
              <span className={`block text-sm font-medium py-2 px-1 border-b-2 ${location === '/plans' ? 'border-blue-500' : 'border-transparent hover:border-gray-300'} cursor-pointer`}>
                Plans
              </span>
            </Link>
            
            {/* Show SEO Analysis link only for subscribed users */}
            {!loading && hasActiveSubscription && (
              <Link href="/seo">
                <span className={`block text-sm font-medium py-2 px-1 border-b-2 ${location === '/seo' ? 'border-blue-500' : 'border-transparent hover:border-gray-300'} cursor-pointer`}>
                  SEO Analysis
                </span>
              </Link>
            )}
            
            {/* Show Image Optimizer only for Teams or Enterprise plans */}
            {!loading && hasActiveSubscription && subscription?.currentPlan && ['premium', 'enterprise'].includes(subscription.currentPlan) && (
              <Link href="/image-optimizer">
                <span className={`block text-sm font-medium py-2 px-1 border-b-2 ${location === '/image-optimizer' ? 'border-blue-500' : 'border-transparent hover:border-gray-300'} cursor-pointer`}>
                  Image Optimizer
                </span>
              </Link>
            )}
            
          </nav>
          
          {/* Login/Logout Button */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/profile">
                <div className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userInitials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline">
                    {userEmail.split('@')[0]}
                  </span>
                </div>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <UserIcon className="h-4 w-4" />
                <span>Login</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}