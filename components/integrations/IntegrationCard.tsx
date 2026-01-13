"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Settings, ExternalLink } from "lucide-react";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  connected: boolean;
  onSetup: () => void;
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
  onTest,
  onDisconnect,
  isLoading = false,
}: IntegrationCardProps) {
  return (
    <Card className="border-border hover:border-primary/50 transition-colors p-6">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg mb-1.5">{name}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                {description}
              </CardDescription>
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            {connected ? (
              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <XCircle className="h-3 w-3 mr-1" />
                Not Setup
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <div className="flex gap-2">
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
            {connected && onDisconnect ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDisconnect}
                disabled={isLoading}
                className="cursor-pointer"
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

