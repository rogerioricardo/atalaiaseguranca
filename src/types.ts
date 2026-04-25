
export enum UserRole {
  ADMIN = 'ADMIN',
  INTEGRATOR = 'INTEGRATOR',
  SCR = 'SCR',
  RESIDENT = 'RESIDENT'
}

export type UserPlan = 'FREE' | 'FAMILY' | 'PREMIUM';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  neighborhoodId?: string;
  lat?: number;
  lng?: number;
  approved?: boolean;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  photoUrl?: string;
  mpPublicKey?: string;
  mpAccessToken?: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  iframeUrl?: string;
  description?: string;
  cameraUrl?: string;
  lat?: number;
  lng?: number;
}

export interface Camera {
  id: string;
  neighborhoodId: string;
  name: string;
  iframeCode: string;
  lat?: number;
  lng?: number;
  locationPhotoUrl?: string;
}

export interface SupportTicket {
    id: string;
    userId: string;
    userName: string;
    neighborhoodId: string | null;
    message: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
    createdAt: Date;
}

export interface IoTDevice {
  id: string;
  name: string;
  type: 'SWITCH' | 'LIGHT' | 'SIREN' | 'GATE';
  status: 'on' | 'off';
  neighborhoodId: string;
  deviceId: string; // ID da eWeLink
}

export interface CameraProtocol {
  id: string;
  name: string;
  rtmp: string;
  rtsp: string;
  lat?: number;
  lng?: number;
}

export interface Alert {
  id: string;
  type: 'PANIC' | 'DANGER' | 'SUSPICIOUS' | 'OK';
  userId: string;
  userName: string;
  neighborhoodId: string;
  timestamp: Date;
  message?: string;
  image?: string;
}

export interface ChatMessage {
  id: string;
  neighborhoodId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  timestamp: Date;
  isSystemAlert?: boolean;
  alertType?: 'PANIC' | 'DANGER' | 'SUSPICIOUS' | 'OK';
  image?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  features: string[];
  recommended?: boolean;
}

export interface Notification {
  id: string;
  userId?: string;
  type: 'PROTOCOL_SUBMISSION' | 'PATROL_ALERT' | 'REGISTRATION_REQUEST';
  title: string;
  message: string;
  data?: any;
  fromUserName: string;
  timestamp: Date;
  read: boolean;
}

export interface PatrolLog {
    id: string;
    userId: string;
    targetUserId?: string;
    neighborhoodId: string;
    timestamp: Date;
    note: string;
    lat?: number;
    lng?: number;
}

export interface ServiceRequest {
    id: string;
    userId: string;
    userName: string;
    neighborhoodId: string;
    requestType: 'ESCORT' | 'EXTRA_ROUND' | 'TRAVEL_NOTICE';
    status: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED';
    createdAt: Date;
}
