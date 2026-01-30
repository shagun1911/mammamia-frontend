"use client";

import { useState, useEffect } from "react";
import { Lock, Folder, Plus, Users, Activity, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contact } from "@/data/mockContacts";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactModal } from "@/components/contacts/ContactModal";
import { CSVImportModal } from "@/components/contacts/CSVImportModal";
import { CSVImportProgress } from "@/components/contacts/CSVImportProgress";
import { Pagination } from "@/components/contacts/Pagination";
import { AddListModal } from "@/components/contacts/AddListModal";
import { AddToListModal } from "@/components/contacts/AddToListModal";
import { 
  useContacts, 
  useContactLists, 
  useCreateContact, 
  useUpdateContact, 
  useDeleteContact, 
  useBulkDeleteContacts,
  useCreateList,
  useBulkAddToList
} from "@/hooks/useContacts";
import { contactService } from "@/services/contact.service";
import { ContactCardSkeleton } from "@/components/LoadingSkeleton";
import { NoContacts } from "@/components/EmptyState";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useSidebar } from "@/contexts/SidebarContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";

export default function ContactsPage() {
  const { getSidebarWidth } = useSidebar();
  const [selectedList, setSelectedList] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [isAddListModalOpen, setIsAddListModalOpen] = useState(false);
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [importId, setImportId] = useState<string | null>(null);
  const [showImportProgress, setShowImportProgress] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({ current: 0, total: 0, percent: 0 });

  // Fetch contacts and lists from API with pagination
  const { data: contactsData, isLoading, isError } = useContacts({ 
    listIds: selectedList === "all" ? undefined : [selectedList],
    page: currentPage,
    limit: 30
  });
  const { data: listsData } = useContactLists();
  
  // Mutations
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const bulkDeleteContacts = useBulkDeleteContacts();
  const createList = useCreateList();
  const bulkAddToList = useBulkAddToList();
  const queryClient = useQueryClient();

  const contacts = contactsData?.contacts || [];
  const lists = listsData || [];
  const pagination = contactsData?.pagination || {
    page: 1,
    limit: 30,
    total: 0,
    totalPages: 1
  };

  // Calculate total contacts across all lists for "All Contacts" view
  const totalAllContacts = lists.reduce((sum: number, list: any) => sum + (list.contactCount || 0), 0);

  // Reset to page 1 when list changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [selectedList]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    setSelectedIds(selectedIds.length === contacts.length ? [] : contacts.map((c: Contact) => c.id));
  };

  const handleEditContact = (contact: any) => {
    setEditingContact(contact);
    setIsModalOpen(true);
  };

  const handleSaveContact = async (data: any) => {
    try {
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, data });
        setEditingContact(null);
      } else {
        await createContact.mutateAsync(data);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      // Error is already handled by React Query and toast notifications
      // Keep modal open so user can correct the data
      console.error('Failed to save contact:', error);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!id || id === 'undefined' || id === 'null' || id === '') {
      toast.error('Contact ID is missing or invalid');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this contact? This action cannot be undone.');
    if (!confirmed) return;

    try {
      if (!deleteContact?.mutateAsync) {
        toast.error('Delete is not available');
        return;
      }
      await deleteContact.mutateAsync(id);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      // Success toast is shown by useDeleteContact onSuccess
    } catch (error: any) {
      // Toast is already shown by useDeleteContact onError
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      setIsDeleting(true);
      setDeleteProgress({ current: 0, total: selectedIds.length, percent: 0 });
      
      // Delete in batches with progress updates
      const batchSize = 50;
      let deletedCount = 0;
      
      for (let i = 0; i < selectedIds.length; i += batchSize) {
        const batch = selectedIds.slice(i, i + batchSize);
        await bulkDeleteContacts.mutateAsync(batch);
        deletedCount += batch.length;
        
        const percent = Math.round((deletedCount / selectedIds.length) * 100);
        setDeleteProgress({
          current: deletedCount,
          total: selectedIds.length,
          percent
        });
        
        // Small delay for UI update
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      setSelectedIds([]);
      setIsDeleting(false);
      setDeleteProgress({ current: 0, total: 0, percent: 0 });
      
      // Refresh contacts list
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
      toast.success(`Successfully deleted ${selectedIds.length} contact(s)`);
    } catch (error: any) {
      console.error('Failed to delete contacts:', error);
      toast.error(error.message || 'Failed to delete contacts');
      setIsDeleting(false);
      setDeleteProgress({ current: 0, total: 0, percent: 0 });
    }
  };

  const handleCSVImport = async (file: File): Promise<{ 
    importId?: string; 
    imported?: number;
    duplicates?: number;
    failed?: number;
    totalRows?: number;
  }> => {
    if (selectedList === "all") {
      toast.error("Please select a list first");
      throw new Error("Please select a list first");
    }
    
    // Import contacts to the currently selected list
    const result: any = await contactService.importCSV(file, selectedList);
    
    // Return result for modal to handle progress tracking
    return {
      importId: result.importId || result.data?.importId,
      imported: result.imported || result.data?.imported || 0,
      duplicates: result.duplicates || result.data?.duplicates || 0,
      failed: result.failed || result.data?.failed || 0,
      totalRows: result.totalRows || result.data?.totalRows || 0
    };
  };

  const handleImportModalClose = () => {
    setIsCSVImportOpen(false);
    // Refresh contacts when modal closes (import might have completed)
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
  };

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
    setShowImportProgress(false);
    setImportId(null);
  };

  const handleCreateList = async (name: string) => {
    await createList.mutateAsync(name);
  };

  const handleAddToList = async (listId: string) => {
    await bulkAddToList.mutateAsync({ contactIds: selectedIds, listId });
    setIsAddToListModalOpen(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        {/* Navbar */}
        <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                Contacts
                <Activity className="w-5 h-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage your contact database</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-60 bg-card border-r border-border" />
          <div className="flex-1 p-6 overflow-auto">
            <ContactCardSkeleton count={6} />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
        {/* Navbar */}
        <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                Contacts
                <Activity className="w-5 h-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage your contact database</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Contacts</h2>
            <p className="text-muted-foreground">Failed to load contacts. Please try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col transition-all duration-300" style={{ left: `${getSidebarWidth()}px` }}>
      {/* Enhanced Professional Navbar */}
      <div className="h-20 px-8 flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Contacts
              <Activity className="w-5 h-5 text-primary" />
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your contact database</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
      {/* Left sidebar - Lists */}
      <div className="w-60 bg-card border-r border-border flex flex-col">
        <div className="px-3 py-4">
          <h2 className="text-base font-semibold text-foreground px-3">Lists</h2>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {/* All Contacts */}
          <button
            onClick={() => setSelectedList("all")}
            className={cn(
              "w-full flex items-center gap-3 h-10 px-3 rounded-md text-sm transition-colors",
              selectedList === "all"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            )}
          >
            <Folder className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left truncate">All Contacts</span>
            <span className="text-xs text-muted-foreground">{totalAllContacts}</span>
          </button>

          {/* Dynamic Lists from API */}
          {lists.map((list: any) => {
            const listId = list.id || list._id;
            return (
              <button
                key={listId}
                onClick={() => setSelectedList(listId)}
                className={cn(
                  "w-full flex items-center gap-3 h-10 px-3 rounded-md text-sm transition-colors",
                  selectedList === listId
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <Folder className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left truncate">{list.name}</span>
                <span className="text-xs text-muted-foreground">{list.contactCount || 0}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 pb-5">
          <button
            onClick={() => setIsAddListModalOpen(true)}
            className="w-full h-10 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add List</span>
          </button>
        </div>
      </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col">
          {/* Delete Progress Bar (if deleting all from list) */}
          {isDeleting && deleteProgress.total > 0 && selectedList !== "all" && (
            <div className="mx-6 mt-4 px-6 py-4 bg-gradient-to-br from-red-500/5 to-red-500/10 rounded-xl border-2 border-red-500/20 shadow-lg">
              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    Deleting All Contacts from List...
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {deleteProgress.current} / {deleteProgress.total} contacts
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-red-500">{deleteProgress.percent}%</span>
                  <div className="text-xs text-muted-foreground mt-1">
                    {deleteProgress.total - deleteProgress.current} remaining
                  </div>
                </div>
              </div>
              
              {/* TV Volume Bar Style Progress Bar */}
              <div className="relative">
                <div className="w-full h-6 bg-secondary/80 rounded-full overflow-hidden shadow-inner border border-border/50">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-red-500/90 to-red-500/80 rounded-full transition-all duration-300 ease-out relative flex items-center justify-end pr-2"
                    style={{ width: `${Math.max(deleteProgress.percent, 2)}%`, minWidth: deleteProgress.percent > 0 ? '2%' : '0%' }}
                  >
                    {deleteProgress.percent > 5 && (
                      <span className="text-[10px] font-bold text-white">
                        {deleteProgress.percent}%
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
                  </div>
                </div>
                {/* Volume bar style indicators */}
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">0%</span>
                  <span className="text-[10px] text-muted-foreground">50%</span>
                  <span className="text-[10px] text-muted-foreground">100%</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-card/50">
            <div className="flex gap-3">
              {selectedList !== "all" && (
              <>
              <button
                onClick={() => setIsCSVImportOpen(true)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`Are you sure you want to delete ALL contacts from this list? This action cannot be undone.`)) {
                    return;
                  }
                  
                  try {
                    setIsDeleting(true);
                    // Get total count first
                    const listContacts = await contactService.getAll({ listIds: [selectedList], limit: 10000 });
                    const totalCount = listContacts.pagination?.total || 0;
                    
                    setDeleteProgress({ current: 0, total: totalCount, percent: 0 });
                    
                    // Delete all contacts from list
                    await contactService.deleteAllContactsFromList(selectedList);
                    
                    // Simulate progress for better UX
                    let progress = 0;
                    const progressInterval = setInterval(() => {
                      progress += 5;
                      if (progress <= 100) {
                        setDeleteProgress({
                          current: Math.round((progress / 100) * totalCount),
                          total: totalCount,
                          percent: progress
                        });
                      } else {
                        clearInterval(progressInterval);
                      }
                    }, 100);
                    
                    // Wait a bit for progress animation
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    clearInterval(progressInterval);
                    
                    setDeleteProgress({ current: totalCount, total: totalCount, percent: 100 });
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    toast.success(`Successfully deleted ${totalCount} contacts from list`);
                    queryClient.invalidateQueries({ queryKey: ['contacts'] });
                    queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
                    
                    setIsDeleting(false);
                    setDeleteProgress({ current: 0, total: 0, percent: 0 });
                  } catch (error: any) {
                    toast.error(error.message || 'Failed to delete contacts');
                    setIsDeleting(false);
                    setDeleteProgress({ current: 0, total: 0, percent: 0 });
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete All Contacts</span>
                  </>
                )}
              </button>
              </>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

        {/* Bulk actions toolbar */}
        {selectedIds.length > 0 && (
          <div className="mx-6 mt-4 space-y-3">
            <div className="h-14 px-6 bg-primary rounded-xl flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {selectedIds.length} selected
              </span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsAddToListModalOpen(true)}
                  className="px-4 py-2 bg-white/10 text-foreground rounded-lg text-sm font-medium hover:bg-white/20 transition-colors cursor-pointer"
                  disabled={isDeleting}
                >
                  Add to list
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-red-500 text-foreground rounded-lg text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Delete Progress Bar */}
            {isDeleting && (
              <div className="px-6 py-4 bg-gradient-to-br from-red-500/5 to-red-500/10 rounded-xl border-2 border-red-500/20 shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      Deleting Contacts...
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {deleteProgress.current} / {deleteProgress.total} contacts
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-red-500">{deleteProgress.percent}%</span>
                    <div className="text-xs text-muted-foreground mt-1">
                      {deleteProgress.total - deleteProgress.current} remaining
                    </div>
                  </div>
                </div>
                
                {/* TV Volume Bar Style Progress Bar */}
                <div className="relative">
                  <div className="w-full h-6 bg-secondary/80 rounded-full overflow-hidden shadow-inner border border-border/50">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 via-red-500/90 to-red-500/80 rounded-full transition-all duration-300 ease-out relative flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(deleteProgress.percent, 2)}%`, minWidth: deleteProgress.percent > 0 ? '2%' : '0%' }}
                    >
                      {deleteProgress.percent > 5 && (
                        <span className="text-[10px] font-bold text-white">
                          {deleteProgress.percent}%
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
                    </div>
                  </div>
                  {/* Volume bar style indicators */}
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">0%</span>
                    <span className="text-[10px] text-muted-foreground">50%</span>
                    <span className="text-[10px] text-muted-foreground">100%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gradient-to-br from-background via-background to-secondary/5">
          <div className="flex-1 min-w-0 overflow-auto">
            <div className="p-6 min-w-0">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        {selectedList === "all" ? "Total Contacts" : "Contacts in List"}
                      </p>
                      <p className="text-2xl font-bold text-foreground">{pagination.total.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-4 border border-blue-500/20 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Selected</p>
                      <p className="text-2xl font-bold text-foreground">{selectedIds.length.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl p-4 border border-purple-500/20 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Lists</p>
                      <p className="text-2xl font-bold text-foreground">{lists.length.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <Folder className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Contacts Table */}
              <div className="min-w-0 max-w-full rounded-xl border border-border overflow-hidden">
                <ContactsTable
                  contacts={contacts}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onEdit={handleEditContact}
                  onDelete={handleDeleteContact}
                />
              </div>
            </div>
          </div>
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(page) => {
                setCurrentPage(page);
                setSelectedIds([]);
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </div>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        initialData={
          editingContact
            ? {
                name: editingContact.name,
                email: editingContact.email,
                phone: editingContact.phone,
                tags: editingContact.tags,
                metadata: editingContact.metadata,
              }
            : undefined
        }
        mode={editingContact ? "edit" : "add"}
        lists={lists}
        preSelectedListId={selectedList !== "all" ? selectedList : undefined}
      />

      {/* Add List Modal */}
      <AddListModal
        isOpen={isAddListModalOpen}
        onClose={() => setIsAddListModalOpen(false)}
        onSave={handleCreateList}
      />

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isCSVImportOpen}
        onClose={handleImportModalClose}
        onImport={handleCSVImport}
        listName={lists.find((l: any) => (l.id || l._id) === selectedList)?.name}
      />

      {/* Add to List Modal */}
      <AddToListModal
        isOpen={isAddToListModalOpen}
        onClose={() => setIsAddToListModalOpen(false)}
        onSave={handleAddToList}
        lists={lists}
        selectedCount={selectedIds.length}
      />

      {/* CSV Import Progress - Always mounted, handles null importId internally */}
      <CSVImportProgress
        importId={showImportProgress ? importId : null}
        onComplete={handleImportComplete}
        onClose={() => setShowImportProgress(false)}
      />
    </div>
  );
}
