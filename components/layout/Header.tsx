import { Breadcrumb } from "./Breadcrumb";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useChatbotSettings } from "@/hooks/useChatbotSettings";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  title: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}

export function Header({ title, breadcrumbs, actions }: HeaderProps) {
  const { chatbotAvatar } = useChatbotSettings();
  return (
    <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb items={breadcrumbs} />
        )}
        {/* Chatbot avatar next to title if exists */}
        {chatbotAvatar && (
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center">
            <img src={chatbotAvatar} alt="Chatbot Avatar" className="w-full h-full object-cover" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <LanguageSwitcher />
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>
  );
}

