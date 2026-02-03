"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Settings, ExternalLink, Edit } from "lucide-react";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  connected: boolean;
  onSetup: () => void;
  onEdit?: () => void;
  onTest?: () => void;
  onDisconnect?: () => void;
  isLoading?: boolean;
}

export function IntegrationCard({
  name,
  description,
  icon,
  category,
  connected,
  onSetup,
  onEdit,
  onTest,
  onDisconnect,
  isLoading = false,
}: IntegrationCardProps) {
  return (
    <Card className="border-border hover:border-primary/50 transition-colors">
      <CardHeader className="pb-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg mb-1.5 break-words">{name}</CardTitle>
              <CardDescription className="text-sm leading-relaxed break-words">
                {description}
              </CardDescription>
            </div>
          </div>
          <div className="flex-shrink-0">
            {connected ? (
              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 whitespace-nowrap">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground whitespace-nowrap">
                <XCircle className="h-3 w-3 mr-1" />
                Not Setup
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4 px-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Badge variant="secondary" className="text-xs whitespace-nowrap">
            {category}
          </Badge>
          <div className="flex gap-2 flex-wrap">
            {connected && onTest && (
              <Button
                size="sm"
                variant="outline"
                onClick={onTest}
                disabled={isLoading}
                className="cursor-pointer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Test
              </Button>
            )}
            {connected && onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
                disabled={isLoading}
                className="cursor-pointer"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {connected && onDisconnect ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDisconnect}
                disabled={isLoading}
                className="cursor-pointer text-destructive hover:text-destructive"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onSetup}
                disabled={isLoading}
                className="cursor-pointer"
              >
                <Settings className="h-4 w-4 mr-1" />
                Setup
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

