import React from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PricingFeature {
  text: string;
  footnote?: string;
}

interface PricingCardProps {
  title: string;
  subtitle?: string;
  price: string;
  period: string;
  features: PricingFeature[];
  action: {
    text: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
    isSelect?: boolean;
    options?: { label: string; value: string }[];
  };
  highlighted?: boolean;
  className?: string;
  intro?: string;
}

export default function PricingCard({
  title,
  subtitle,
  price,
  period,
  features,
  action,
  highlighted = false,
  className = '',
  intro
}: PricingCardProps) {
  return (
    <Card className={`${className} rounded-lg overflow-hidden border-0 h-full flex flex-col bg-[#0a192f] text-white`}>
      <CardHeader className="px-6 pt-6 pb-4 text-center">
        <CardTitle className="text-xl font-bold text-white mb-2">{title}</CardTitle>
        {subtitle && <p className="text-sm text-gray-300 h-12">{subtitle}</p>}
        {!subtitle && <div className="h-12"></div>}
      </CardHeader>
      <CardContent className="px-6 flex-grow">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">
            {price}
            <span className="text-sm font-normal text-white ml-1">{period}</span>
          </div>
        </div>
        
        {intro && (
          <p className="text-sm text-gray-300 mt-6 mb-4 text-center">{intro}</p>
        )}
        {!intro && <div className="mt-6 mb-4 h-5"></div>}
        
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="text-green-400 h-4 w-4 mr-2 mt-1 flex-shrink-0" />
              <div>
                <span className="text-sm text-white">{feature.text}</span>
                {feature.footnote && (
                  <p className="text-xs text-gray-300 mt-1">{feature.footnote}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      <div className="mt-auto px-6 pb-6">
        {action.isSelect ? (
          <Select>
            <SelectTrigger className="w-full bg-[#c8fa5f] hover:bg-[#b8ea4f] text-black font-medium">
              <SelectValue placeholder={action.text} />
            </SelectTrigger>
            <SelectContent>
              {action.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : action.href ? (
          <Button 
            className={`w-full bg-[#c8fa5f] hover:bg-[#b8ea4f] text-black font-medium`}
            variant={action.variant || 'default'}
            asChild
          >
            <a href={action.href}>{action.text}</a>
          </Button>
        ) : (
          <Button 
            className={`w-full bg-[#c8fa5f] hover:bg-[#b8ea4f] text-black font-medium`}
            variant={action.variant || 'default'}
            onClick={action.onClick}
          >
            {action.text}
          </Button>
        )}
      </div>
    </Card>
  );
}