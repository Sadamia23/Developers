import { ExperienceLevel, TechnologyStack, ZodiacSign } from "../enums/enums";

export interface RegisterDto {
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  techStack: TechnologyStack;
  experience: ExperienceLevel;
}

export interface LoginDto {
  username: string;
}

export interface UserProfileDto {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  techStack: TechnologyStack;
  experience: ExperienceLevel;
  zodiacSign: ZodiacSign;
  age: number;
  createdAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: UserProfileDto;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  username: string | null;
}