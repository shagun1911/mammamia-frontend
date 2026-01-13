"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  UserCircle2,
  ChevronDown,
  ChevronRight,
  Folder,
  Plus,
  MessageSquare,
  Phone,
  Instagram,
  Facebook,
  Filter,
  Users,
  Hash,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationFiltersProps {
  onFilterChange?: (filter: string) => void;
}

export function ConversationFilters({
  onFilterChange,
}: ConversationFiltersProps) {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [colleaguesExpanded, setColleaguesExpanded] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    onFilterChange?.(filter);
  };

  return (
    <div className="w-[300px] bg-card border-r border-border h-full flex flex-col overflow-hidden shadow-lg">
      {/* Enhanced Header with Search */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
            <Filter className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Filters</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search filters..."
            className="w-full bg-secondary/50 border border-border rounded-lg pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Filters */}
        <div className="px-5 py-5 space-y-2 border-b border-border bg-gradient-to-b from-background to-transparent">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Access</span>
          </div>
          <button
            onClick={() => handleFilterSelect("all")}
            className={cn(
              "w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer group relative overflow-hidden",
              selectedFilter === "all"
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-secondary/50 text-secondary-foreground hover:bg-accent hover:shadow-md hover:scale-[1.02]"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                selectedFilter === "all" 
                  ? "bg-primary-foreground/20" 
                  : "bg-primary/10 group-hover:bg-primary/20"
              )}>
                <Hash className={cn(
                  "w-4 h-4 transition-colors",
                  selectedFilter === "all" ? "text-primary-foreground" : "text-primary"
                )} />
              </div>
              <span>All Conversations</span>
            </div>
          </button>
          <button
            onClick={() => handleFilterSelect("assigned")}
            className={cn(
              "w-full px-4 py-3.5 rounded-xl text-sm font-semibold transition-all text-left flex items-center gap-3 cursor-pointer group relative overflow-hidden",
              selectedFilter === "assigned"
                ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                : "bg-secondary/50 text-secondary-foreground hover:bg-accent hover:shadow-md hover:scale-[1.02]"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              selectedFilter === "assigned" 
                ? "bg-primary-foreground/20" 
                : "bg-primary/10 group-hover:bg-primary/20"
            )}>
              <UserCircle2 className={cn(
                "w-4.5 h-4.5 transition-colors",
                selectedFilter === "assigned" ? "text-primary-foreground" : "text-primary"
              )} />
            </div>
            <span>Assigned to me</span>
          </button>
        </div>

        {/* Channels Section */}
        <div className="px-5 py-4 border-b border-border">
          <button
            onClick={() => setChannelsExpanded(!channelsExpanded)}
            className="w-full flex items-center gap-2.5 text-sm font-bold text-foreground hover:opacity-80 transition-all mb-4 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              {channelsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>Channels</span>
          </button>
          {channelsExpanded && (
            <div className="space-y-2 pl-9">
              <button
                onClick={() => handleFilterSelect("channel:website")}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-3 cursor-pointer group",
                  selectedFilter === "channel:website"
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                    : "text-secondary-foreground hover:bg-accent/50 hover:shadow-sm hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                  selectedFilter === "channel:website"
                    ? "bg-primary-foreground/20"
                    : "bg-secondary group-hover:bg-primary/10"
                )}>
                  <MessageSquare className={cn(
                    "w-4 h-4",
                    selectedFilter === "channel:website" ? "text-primary-foreground" : "text-foreground"
                  )} />
                </div>
                <span>Chatbot/Website</span>
              </button>
              <button
                onClick={() => handleFilterSelect("channel:whatsapp")}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-3 cursor-pointer group",
                  selectedFilter === "channel:whatsapp"
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                    : "text-secondary-foreground hover:bg-accent/50 hover:shadow-sm hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                  selectedFilter === "channel:whatsapp"
                    ? "bg-primary-foreground/20"
                    : "bg-green-500/10 group-hover:bg-green-500/20"
                )}>
                  <MessageSquare className={cn(
                    "w-4 h-4",
                    selectedFilter === "channel:whatsapp" ? "text-primary-foreground" : "text-green-500"
                  )} />
                </div>
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => handleFilterSelect("channel:instagram")}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-3 cursor-pointer group",
                  selectedFilter === "channel:instagram"
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                    : "text-secondary-foreground hover:bg-accent/50 hover:shadow-sm hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                  selectedFilter === "channel:instagram"
                    ? "bg-primary-foreground/20"
                    : "bg-pink-500/10 group-hover:bg-pink-500/20"
                )}>
                  <Instagram className={cn(
                    "w-4 h-4",
                    selectedFilter === "channel:instagram" ? "text-primary-foreground" : "text-pink-500"
                  )} />
                </div>
                <span>Instagram</span>
              </button>
              <button
                onClick={() => handleFilterSelect("channel:facebook")}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-3 cursor-pointer group",
                  selectedFilter === "channel:facebook"
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                    : "text-secondary-foreground hover:bg-accent/50 hover:shadow-sm hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                  selectedFilter === "channel:facebook"
                    ? "bg-primary-foreground/20"
                    : "bg-blue-500/10 group-hover:bg-blue-500/20"
                )}>
                  <Facebook className={cn(
                    "w-4 h-4",
                    selectedFilter === "channel:facebook" ? "text-primary-foreground" : "text-blue-500"
                  )} />
                </div>
                <span>Facebook</span>
              </button>
              <button
                onClick={() => handleFilterSelect("channel:phone")}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-3 cursor-pointer group",
                  selectedFilter === "channel:phone"
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                    : "text-secondary-foreground hover:bg-accent/50 hover:shadow-sm hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                  selectedFilter === "channel:phone"
                    ? "bg-primary-foreground/20"
                    : "bg-primary/10 group-hover:bg-primary/20"
                )}>
                  <Phone className={cn(
                    "w-4 h-4",
                    selectedFilter === "channel:phone" ? "text-primary-foreground" : "text-primary"
                  )} />
                </div>
                <span>Phone/Call</span>
              </button>
            </div>
          )}
        </div>

        {/* Colleagues Section */}
        <div className="px-5 py-4 border-b border-border">
          <button
            onClick={() => setColleaguesExpanded(!colleaguesExpanded)}
            className="w-full flex items-center gap-2.5 text-sm font-bold text-foreground hover:opacity-80 transition-all mb-4 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              {colleaguesExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-primary" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-primary" />
              )}
            </div>
            <Users className="w-4 h-4 text-primary" />
            <span>Colleagues</span>
          </button>
          {colleaguesExpanded && (
            <div className="pl-9">
              <div className="px-3.5 py-2.5 rounded-lg bg-secondary/50 border border-border/50">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                  No colleagues online
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Folders Section */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setFoldersExpanded(!foldersExpanded)}
              className="flex items-center gap-2.5 text-sm font-bold text-foreground hover:opacity-80 transition-all cursor-pointer group"
            >
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                {foldersExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-primary" />
                )}
              </div>
              <Folder className="w-4 h-4 text-primary" />
              <span>Folders</span>
            </button>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer hover:scale-110">
                <Search className="w-3.5 h-3.5" />
              </button>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer hover:scale-110">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {foldersExpanded && (
            <div className="space-y-2 pl-9">
              <button
                onClick={() => handleFilterSelect("all-folders")}
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-3 cursor-pointer group",
                  selectedFilter === "all-folders"
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                    : "bg-secondary/50 text-secondary-foreground hover:bg-accent/50 hover:shadow-sm hover:translate-x-1"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                  selectedFilter === "all-folders"
                    ? "bg-primary-foreground/20"
                    : "bg-primary/10 group-hover:bg-primary/20"
                )}>
                  <Folder className={cn(
                    "w-4 h-4",
                    selectedFilter === "all-folders" ? "text-primary-foreground" : "text-primary"
                  )} />
                </div>
                <span>All folders</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

