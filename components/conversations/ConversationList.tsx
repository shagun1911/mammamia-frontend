"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, ChevronDown, UserCircle2 } from "lucide-react";
import { Conversation } from "@/data/mockConversations";
import { ConversationCard } from "./ConversationCard";

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
        (conv) =>
          conv.customer.name.toLowerCase().includes(query) ||
          conv.customer.email.toLowerCase().includes(query) ||
          conv.lastMessage.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter((conv) => conv.status === statusFilter);
    }

    // Apply sorting
    if (sortBy === "recent") {
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else if (sortBy === "unread") {
      filtered.sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0));
    }

    return filtered;
  }, [conversations, searchQuery, statusFilter, sortBy]);

  return (
    <div className="w-[380px] bg-card border-r border-border h-full flex flex-col shadow-sm overflow-hidden">
      {/* Enhanced Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <button className="flex items-center gap-2.5 text-sm font-semibold text-foreground hover:opacity-80 transition-opacity cursor-pointer px-3 py-1.5 rounded-lg hover:bg-secondary">
          <UserCircle2 className="w-4.5 h-4.5" />
          <span>Assigned to me</span>
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-lg hover:bg-secondary transition-all cursor-pointer ${
              showSearch ? "text-foreground bg-secondary" : "text-muted-foreground"
            }`}
          >
            <Search className="w-[18px] h-[18px]" />
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg hover:bg-secondary transition-all cursor-pointer ${
              showFilters ? "text-foreground bg-secondary" : "text-muted-foreground"
            }`}
          >
            <SlidersHorizontal className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Enhanced Search Bar */}
      {showSearch && (
        <div className="px-4 py-3 border-b border-border bg-background/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      )}

      {/* Enhanced Filter Row */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-border bg-background/50 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
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
              className="flex-1 px-3 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
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
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {searchQuery ? "No conversations match your search" : "No conversations found"}
            </p>
            {searchQuery && (
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

