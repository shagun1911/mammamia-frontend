"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ChevronDown, UserCircle2 } from "lucide-react";
import { Conversation } from "@/data/mockConversations";
import { ConversationCard } from "./ConversationCard";
import { useQueryClient } from "@tanstack/react-query";


interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelectConversation?: (id: string) => void;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelectConversation,
}: ConversationListProps) {
  const toSafeTime = (value: string) => {
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? 0 : t;
  };

  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all"); // Changed from "open" to "all"
  const [sortBy, setSortBy] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (conv) => {
          // Safely check customer fields with null/undefined handling
          const customerName = conv.customer?.name?.toLowerCase() || '';
          const customerEmail = conv.customer?.email?.toLowerCase() || '';
          const customerPhone = conv.customer?.phone?.toLowerCase() || '';
          const lastMessage = conv.lastMessage?.toLowerCase() || '';
          
          return (
            customerName.includes(query) ||
            customerEmail.includes(query) ||
            customerPhone.includes(query) ||
            lastMessage.includes(query)
          );
        }
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((conv) => conv.status === statusFilter);
    }

    // Apply sorting
    if (sortBy === "recent") {
      filtered.sort((a, b) => toSafeTime(b.timestamp) - toSafeTime(a.timestamp));
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => toSafeTime(a.timestamp) - toSafeTime(b.timestamp));
    } else if (sortBy === "unread") {
      filtered.sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0));
    }

    return filtered;
  }, [conversations, searchQuery, statusFilter, sortBy]);

  return (
    <div className="w-[400px] bg-card/50 backdrop-blur-sm border-r border-border/60 h-full flex flex-col shadow-[2px_0_8px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Premium Header */}
      <div className="h-18 px-6 py-4 flex items-center justify-between border-b border-border/50 bg-gradient-to-br from-card via-card to-primary/[0.02] backdrop-blur-sm">
        <button className="flex items-center gap-2.5 text-sm font-bold text-foreground hover:opacity-90 transition-all cursor-pointer px-4 py-2 rounded-xl hover:bg-accent/50 hover:shadow-sm">
          <UserCircle2 className="w-4.5 h-4.5" />
          <span>Assigned to me</span>
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2.5 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer ${
              showSearch ? "text-foreground bg-accent shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer ${
              showFilters ? "text-foreground bg-accent shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Premium Search Bar */}
      {showSearch && (
        <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all shadow-sm"
            />
          </div>
        </div>
      )}

      {/* Premium Filter Row */}
      {showFilters && (
        <div className="px-5 py-4 border-b border-border/50 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm space-y-3">
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-4 py-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl text-sm font-medium text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="unread">Unread</option>
              <option value="support_request">Support Request</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-4 py-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl text-sm font-medium text-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="unread">Unread First</option>
            </select>
          </div>
        </div>
      )}

      {/* Conversation Cards */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <ConversationCard
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedId === conversation.id}
              onClick={() => onSelectConversation?.(conversation.id)}
              onUpdate={() => {
                // Refresh conversations list
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
              }}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary/50 to-secondary/30 flex items-center justify-center mb-5 shadow-inner">
              <Search className="w-8 h-8 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-bold text-foreground mb-2 tracking-tight">
              {searchQuery ? "No conversations match your search" : "No conversations found"}
            </p>
            {searchQuery && (
              <p className="text-xs text-muted-foreground/70 mt-1 font-medium">
                Try adjusting your search or filters
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

