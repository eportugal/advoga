"use client";

import {
  Home,
  Bot,
  Settings,
  MessageCircle,
  LogOut,
  LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import {
  Box,
  Typography,
  Divider,
  Paper,
  IconButton,
  useMediaQuery,
  Drawer,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useState } from "react";

type MenuItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: string | number;
};

type AppInfo = {
  name: string;
  version: string;
  logo: string;
};

type SidebarProps = {
  activeItem: string;
  onItemClick?: (id: string, href: string) => void;
  menuItems?: MenuItem[];
  appInfo?: AppInfo;
};

export default function Sidebar({
  activeItem,
  onItemClick,
  menuItems,
  appInfo,
}: SidebarProps) {
  const router = useRouter();
  const { isAuthenticated, dbUser, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:768px)");

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const defaultMenuItems: MenuItem[] = [
    { id: "dashboard", label: "Início", icon: Home, href: "/dashboard" },
    { id: "chat", label: "Conversar com a IA", icon: Bot, href: "/chat" },
    {
      id: "consultorias",
      label: "Consultoria",
      icon: MessageCircle,
      href: "/messages",
      badge: "3",
    },
    {
      id: "settings",
      label: "Configurações",
      icon: Settings,
      href: "/settings",
    },
  ];

  const defaultAppInfo: AppInfo = {
    name: "Minha App",
    version: "v2.0.1",
    logo: "A",
  };

  const items = menuItems || defaultMenuItems;
  const app = appInfo || defaultAppInfo;

  const fullName =
    dbUser?.firstName || dbUser?.lastName
      ? `${dbUser?.firstName ?? ""} ${dbUser?.lastName ?? ""}`.trim()
      : dbUser?.email?.split("@")[0] ?? "Usuário";

  const MenuItemComponent = ({ item }: { item: MenuItem }) => {
    const Icon = item.icon;
    const isActive = activeItem.startsWith(item.href);

    return (
      <Box
        className={`
        flex items-center space-x-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group
        ${
          isActive
            ? "bg-blue-600 text-white shadow-lg"
            : "hover:bg-blue-50 hover:text-blue-700 text-slate-600"
        }
      `}
        onClick={() => onItemClick?.(item.id, item.href)}
      >
        <Icon
          size={20}
          className={`$ {
            isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600"
          }`}
        />
        <Typography className="font-medium flex-1">{item.label}</Typography>
        {item.badge && (
          <Box
            className={`text-xs px-2 py-1 rounded-full font-medium ${
              isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
            }`}
          >
            {item.badge}
          </Box>
        )}
      </Box>
    );
  };

  const drawerContent = (
    <Box className="flex flex-col h-full bg-white border-r border-slate-200">
      <Box className="p-6 border-b border-slate-200">
        <Box className="flex items-center space-x-3">
          <Box className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Typography className="text-white font-bold text-lg">
              {app.logo}
            </Typography>
          </Box>
          <Box>
            <Typography className="font-bold text-slate-900">
              {app.name}
            </Typography>
            <Typography className="text-sm text-slate-500">
              {app.version}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className="flex-1 p-4 space-y-2 overflow-y-auto">
        {items.map((item) => (
          <MenuItemComponent key={item.id} item={item} />
        ))}
      </Box>

      {isAuthenticated && dbUser && (
        <Box className="p-4 border-t border-slate-200">
          <Box className="flex items-center gap-4 justify-between">
            <Box className="flex items-center gap-4 justify-between">
              <Box className="w-8 h-8 p-2 rounded-full flex items-center justify-center bg-gray-400 text-white font-bold text-lg shadow-sm">
                <Typography fontSize={12}>
                  {fullName
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </Typography>
              </Box>
              <Box className="flex flex-col">
                <Typography
                  className="font-semibold text-slate-800"
                  fontSize={12}
                >
                  {fullName}
                </Typography>
                <Typography className="text-slate-500" fontSize={10}>
                  {dbUser.email || "Email não disponível"}
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={handleSignOut}
              className="text-slate-400 hover:text-slate-600 ml-auto"
            >
              <LogOut size={16} />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <>
          <IconButton
            onClick={() => setMobileOpen(true)}
            className="fixed top-4 left-4 z-50 text-slate-700"
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            anchor="left"
            ModalProps={{ keepMounted: true }}
          >
            {drawerContent}
          </Drawer>
        </>
      ) : (
        <Box className="fixed left-0 top-0 h-full z-40">{drawerContent}</Box>
      )}
    </>
  );
}
