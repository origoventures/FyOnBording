import React from 'react';
import { motion } from "framer-motion";
import fylleLogoDefault from "../assets/fylle-logo-default.png";

export default function Footer() {
  return (
    <footer className="bg-[#f9fef0] text-[#03071C] py-8 px-4 sm:px-6 lg:px-8 mt-16 relative overflow-hidden">
      <div className="absolute opacity-20 top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#03071C] to-transparent"></div>
      <div className="container mx-auto relative z-10">
        <div className="flex justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-lg text-center"
          >
            <div className="flex items-center space-x-2 mb-4 justify-center">
              <motion.img 
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                src={fylleLogoDefault} 
                alt="MetaMuse" 
                className="h-10" 
              />
              <div className="text-[#03071C] font-bold text-xl">
                <span className="text-[#03071C]">Meta</span>
                <span className="text-[#03071C]">Muse</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-2">
              Analyze your website's SEO meta tags and get valuable insights to improve your search engine rankings.
            </p>
          </motion.div>
        </div>
        
        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} MetaMuse. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a 
              href="https://www.fylle.ai" 
              target="_blank"
              rel="noopener noreferrer" 
              className="text-sm text-[#03071C] hover:underline"
            >
              Powered by Fylle AI
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}