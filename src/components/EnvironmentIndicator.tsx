
import React from 'react';
import config from '../config/environment';
import { Badge } from './ui/badge';

export const EnvironmentIndicator = () => {
  // Only show in development environment
  if (!config.isDevelopment) {
    return null;
  }
  
  return (
    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
      Development Mode
    </Badge>
  );
};
