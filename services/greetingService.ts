
import { GoalOption } from '../types';

export const generateHeaderGreeting = (name: string, goal?: GoalOption): string => {
  const hour = new Date().getHours();
  const timeGreeting = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
  const cleanName = name.trim().split(' ')[0]; // Use first name only for brevity

  if (!cleanName) return "NexusTask AI";

  // Personalized algorithmic greetings based on Goal
  switch (goal) {
    case 'launch_or_scale_business':
    case 'grow_freelance_income':
      return `${timeGreeting} Founder ${cleanName}`;
    
    case 'reduce_mental_load':
      return `${timeGreeting} ${cleanName}, on respire.`;
      
    case 'certification_exam':
    case 'level_up_leadership':
      return `${timeGreeting} ${cleanName}, prêt à progresser ?`;
      
    case 'deliver_work_project':
    case 'build_portfolio':
      return `${timeGreeting} Maker ${cleanName}.`;
      
    case 'get_hired':
      return `${timeGreeting} ${cleanName}, future pépite.`;

    default:
      return `${timeGreeting}, ${cleanName}.`;
  }
};
