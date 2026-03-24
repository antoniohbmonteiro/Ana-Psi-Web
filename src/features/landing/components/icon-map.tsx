import type { ComponentType } from "react";
import {
  Brain,
  Calendar,
  Clock,
  Heart,
  Lightbulb,
  Lock,
  MessageCircle,
  Shield,
  Smile,
  Target,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { LandingInfoItem, LandingPrincipleItem, LandingProcessItem, LandingSpecialtyItem } from "@/features/landing/types/content";

type SpecialtyIconName = LandingSpecialtyItem["icon"];
type PrincipleIconName = LandingPrincipleItem["icon"];
type ProcessIconName = LandingProcessItem["icon"];
type InfoIconName = LandingInfoItem["icon"];

type IconComponent = ComponentType<{ className?: string }>;

const specialtyIcons: Record<SpecialtyIconName, IconComponent> = {
  brain: Brain,
  heart: Heart,
  smile: Smile,
  shield: Shield,
  lightbulb: Lightbulb,
  users: Users,
};

const principleIcons: Record<PrincipleIconName, IconComponent> = {
  heart: Heart,
  users: Users,
  lightbulb: Lightbulb,
  target: Target,
};

const processIcons: Record<ProcessIconName, IconComponent> = {
  "message-circle": MessageCircle,
  calendar: Calendar,
  video: Video,
  "trending-up": TrendingUp,
};

const infoIcons: Record<InfoIconName, IconComponent> = {
  video: Video,
  clock: Clock,
  lock: Lock,
  calendar: Calendar,
};

export function getSpecialtyIcon(name: SpecialtyIconName) {
  return specialtyIcons[name];
}

export function getPrincipleIcon(name: PrincipleIconName) {
  return principleIcons[name];
}

export function getProcessIcon(name: ProcessIconName) {
  return processIcons[name];
}

export function getInfoIcon(name: InfoIconName) {
  return infoIcons[name];
}
