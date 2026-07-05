import type { CSSProperties } from "react";
import {
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  ShoppingCart,
  User,
  Menu,
  X,
  Check,
  CheckCircle2,
  Copy,
  Instagram,
  Facebook,
  Search,
  Star,
  Trash2,
  Plus,
  Minus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Bell,
  Package,
  Truck,
  Info,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  AlertTriangle,
  Upload,
  LogOut,
  Settings,
  Edit,
  Eye,
  ExternalLink,
  Music2,
  type LucideIcon,
} from "lucide-react";

// Neutral name → lucide component map. Preserves the <Icon name="..."/> API
// used throughout the app. Names loosely match Ionicons; unknown names show a dot.
const MAP: Record<string, LucideIcon> = {
  "arrow-forward-outline": ArrowRight,
  "arrow-back-outline": ArrowLeft,
  "chevron-forward-outline": ChevronRight,
  "chevron-back-outline": ChevronLeft,
  "chevron-down-outline": ChevronDown,
  "chevron-up-outline": ChevronUp,
  "bag-outline": ShoppingBag,
  "cart-outline": ShoppingCart,
  "person-circle-outline": User,
  "menu-outline": Menu,
  "close-outline": X,
  "checkmark-outline": Check,
  "checkmark-circle-outline": CheckCircle2,
  "copy-outline": Copy,
  "logo-instagram": Instagram,
  "logo-tiktok": Music2,
  "logo-facebook": Facebook,
  "logo-whatsapp": MessageCircle,
  "search-outline": Search,
  "star-outline": Star,
  "star": Star,
  "trash-outline": Trash2,
  "add-outline": Plus,
  "remove-outline": Minus,
  "notifications-outline": Bell,
  "cube-outline": Package,
  "car-outline": Truck,
  "information-circle-outline": Info,
  "mail-outline": Mail,
  "call-outline": Phone,
  "location-outline": MapPin,
  "warning-outline": AlertTriangle,
  "cloud-upload-outline": Upload,
  "log-out-outline": LogOut,
  "settings-outline": Settings,
  "create-outline": Edit,
  "eye-outline": Eye,
  "open-outline": ExternalLink,
};

export function Icon({
  name,
  className,
  style,
  size = 20,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
  size?: number | string;
}) {
  const Cmp = MAP[name] ?? Info;
  const px = typeof size === "number" ? size : parseInt(String(size), 10) || 20;
  return <Cmp size={px} className={className} style={style} strokeWidth={1.75} />;
}