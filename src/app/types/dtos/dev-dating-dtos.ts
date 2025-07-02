import { Gender } from "../enums/dev-dating-enums";
import { TechnologyStack, ExperienceLevel, ZodiacSign } from "../enums/enums";

export interface DatingSetupRequest {
  gender: Gender;
  preference: Gender;
  bio: string;
}

export interface PotentialMatchDto {
  userId: number;
  username: string;
  firstName: string;
  age: number;
  techStack: string;
  experience: string;
  bio: string;
  zodiacSign: string;
}

export interface SwipeRequest {
  targetUserId: number;
  isLike: boolean;
}

export interface SwipeResponse {
  isMatch: boolean;
  matchId?: number;
  message: string;
}

export interface ChatMessageDto {
  id: number;
  senderId: number;
  senderUsername: string;
  message: string;
  isAIGenerated: boolean;
  sentAt: Date;
}

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessageDto;
  aiResponse?: ChatMessageDto;
}

export interface DatingProfileStatus {
  hasProfile: boolean;
}

export interface Match {
  id: number;
  user1Id: number;
  user2Id: number;
  matchedAt: Date;
  isActive: boolean;
  otherUser: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    techStack: TechnologyStack;
    experience: ExperienceLevel;
    zodiacSign: ZodiacSign;
  };
}

export interface Match {
  id: number;
  user1Id: number;
  user2Id: number;
  matchedAt: Date;
  isActive: boolean;
  otherUser: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    techStack: TechnologyStack;
    experience: ExperienceLevel;
    zodiacSign: ZodiacSign;
  };
}

export interface MatchUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  techStack: TechnologyStack;
  experience: ExperienceLevel;
  zodiacSign: ZodiacSign;
}