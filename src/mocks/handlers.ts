
// This file contains mock handlers for the frontend to work without a real backend
// In a real application, these would be replaced with actual API calls

import { User } from "@/store/slices/authSlice";
import { TranslationStatus } from "@/store/slices/translationSlice";

// Mock users database
const users: Record<string, { password: string }> = {};

// Mock translations database
const translations: any[] = [];

// Mock auth functions
export const requestPasswordHandler = async (email: string): Promise<boolean> => {
  // Generate a random password
  const password = Math.random().toString(36).slice(-8);
  users[email] = { password };
  
  console.log(`Password for ${email}: ${password}`);
  
  // In a real app, this would send an email
  return true;
};

export const loginHandler = async (email: string, password: string): Promise<User | null> => {
  // Check if user exists and password matches
  if (users[email] && users[email].password === password) {
    return { 
      id: "mock-user-id-123", 
      username: email, 
      email: email, 
      isLoggedIn: true 
    };
  }
  return null;
};

// Mock translation functions
export const uploadDocumentHandler = async (file: File, targetLanguage: string): Promise<any> => {
  // Generate a checksum to detect duplicates
  const checksum = await generateChecksum(file);
  
  // Check for duplicate document
  const existingTranslation = translations.find(
    t => t.checksum === checksum && t.targetLanguage === targetLanguage
  );
  
  if (existingTranslation) {
    return existingTranslation;
  }
  
  // Create new translation
  const newTranslation = {
    id: Math.random().toString(36).substring(2, 9),
    originalFileName: file.name,
    targetLanguage,
    status: TranslationStatus.PROCESSING,
    checksum,
    createdAt: new Date().toISOString(),
  };
  
  translations.unshift(newTranslation);
  
  // Simulate translation process
  setTimeout(() => {
    const index = translations.findIndex(t => t.id === newTranslation.id);
    if (index !== -1) {
      translations[index] = {
        ...translations[index],
        status: TranslationStatus.COMPLETED,
        downloadUrl: "#/mock-download-link",
      };
    }
  }, 5000);
  
  return newTranslation;
};

export const fetchTranslationsHandler = async (): Promise<any[]> => {
  return translations;
};

// Utility function to generate a checksum for a file
const generateChecksum = async (file: File): Promise<string> => {
  // In a real app, this would create a hash of the file content
  // For this demo, we'll use a combination of filename and size
  return `${file.name}-${file.size}-${file.lastModified}`;
};
