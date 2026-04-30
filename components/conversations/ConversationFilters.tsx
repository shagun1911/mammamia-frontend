"use client";

import { useState, useEffect } from "react";
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
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { settingsService } from "@/services/settings.service";
import { toast } from "@/lib/toast";

interface ConversationFiltersProps {
  onFilterChange?: (filter: string) => void;
  selectedFilter?: string;
}

export function ConversationFilters({
  onFilterChange,
  selectedFilter: externalFilter,
}: ConversationFiltersProps) {
  const [internalFilter, setInternalFilter] = useState("all");
  const selectedFilter = externalFilter !== undefined ? externalFilter : internalFilter;
  const [colleaguesExpanded, setColleaguesExpanded] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [folders, setFolders] = useState<any[]>([]);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  const handleFilterSelect = (filter: string) => {
    if (externalFilter === undefined) {
      setInternalFilter(filter);
    }
    onFilterChange?.(filter);
  };

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const foldersData = await settingsService.getFolders();
      console.log('Loaded folders:', foldersData);
      // Ensure foldersData is an array
      const foldersArray = Array.isArray(foldersData) ? foldersData : [];
      setFolders(foldersArray);
    } catch (error) {
      console.error('Failed to load folders:', error);
      setFolders([]);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      setCreatingFolder(true);
      await settingsService.createFolder(newFolderName.trim());
      toast.success('Folder created successfully');
      setNewFolderName("");
      setShowNewFolderInput(false);
      await loadFolders();
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      toast.error(error.message || 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete "${folderName}"? This will remove the folder but not the conversations inside.`)) {
      return;
    }

    try {
      setDeletingFolderId(folderId);
      await settingsService.deleteFolder(folderId);
      toast.success('Folder deleted successfully');
      await loadFolders();
      // Reset filter if deleted folder was selected
      if (selectedFilter === `folder:${folderId}`) {
        handleFilterSelect("all");
      }
    } catch (error: any) {
      console.error('Failed to delete folder:', error);
      toast.error(error.message || 'Failed to delete folder');
    } finally {
      setDeletingFolderId(null);
    }
  };

  return (
    <div className="w-[300px] bg-card border-r border-border h-full flex flex-col overflow-hidden shadow-lg">
      {/* Enhanced Header with Search */}
      <div className="px-5 py-4 border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Filters</h2>
          </div>
          <button 
            className="p-1.5 rounded-lg text-foreground hover:bg-secondary transition-colors cursor-pointer hover:scale-110 active:scale-95"
            title="Create new conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
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
                <span data-no-translate>WhatsApp</span>
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
                <span data-no-translate>Instagram</span>
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
                <span data-no-translate>Facebook</span>
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
              <button 
                onClick={() => setShowNewFolderInput(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer hover:scale-110"
                title="Create new folder"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {foldersExpanded && (
            <div className="space-y-2 pl-9">
              
              {/* Create New Folder Input */}
              {showNewFolderInput && (
                <div className="mt-2 p-2 bg-secondary/50 border border-border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                      placeholder="Folder name..."
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        setShowNewFolderInput(false);
                        setNewFolderName("");
                      }}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={handleCreateFolder}
                    disabled={creatingFolder || !newFolderName.trim()}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingFolder ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Folder</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Folders List */}
              {folders.length > 0 ? (
                folders.map((folder) => {
                  const folderId = folder._id || folder.id;
                  const isDeleting = deletingFolderId === folderId;
                  return (
                    <div
                      key={folderId}
                      className={cn(
                        "group flex items-center gap-2",
                        selectedFilter === `folder:${folderId}` && "bg-gradient-to-r from-primary/5 to-transparent rounded-lg px-1"
                      )}
                    >
                      <button
                        onClick={() => handleFilterSelect(`folder:${folderId}`)}
                        className={cn(
                          "flex-1 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all text-left flex items-center gap-3 cursor-pointer",
                          selectedFilter === `folder:${folderId}`
                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md"
                            : "bg-secondary/50 text-secondary-foreground hover:bg-accent/50 hover:shadow-sm hover:translate-x-1"
                        )}
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                          selectedFilter === `folder:${folderId}`
                            ? "bg-primary-foreground/20"
                            : "bg-primary/10 group-hover:bg-primary/20"
                        )}>
                          <Folder className={cn(
                            "w-4 h-4",
                            selectedFilter === `folder:${folderId}` ? "text-primary-foreground" : "text-primary"
                          )} />
                        </div>
                        <span className="truncate flex-1">{folder.name}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folderId, folder.name);
                        }}
                        disabled={isDeleting}
                        className={cn(
                          "p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100",
                          isDeleting && "opacity-100 cursor-not-allowed"
                        )}
                        title="Delete folder"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                !showNewFolderInput && (
                  <p className="text-xs text-muted-foreground px-3.5 py-2 pl-9">
                    No folders yet. Create one using the + button above.
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

