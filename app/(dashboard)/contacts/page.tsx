"use client";

import { useState } from "react";
import { Lock, Folder, Plus, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Contact } from "@/data/mockContacts";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { ContactModal } from "@/components/contacts/ContactModal";
import { CSVImportModal } from "@/components/contacts/CSVImportModal";
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

  // Fetch contacts and lists from API
  const { data: contactsData, isLoading, isError } = useContacts({ 
    listIds: selectedList === "all" ? undefined : [selectedList] 
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
    try {
      await deleteContact.mutateAsync(id);
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } catch (error: any) {
      console.error('Failed to delete contact:', error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await bulkDeleteContacts.mutateAsync(selectedIds);
      setSelectedIds([]);
    } catch (error: any) {
      console.error('Failed to delete contacts:', error);
    }
  };

  const handleCSVImport = async (file: File) => {
    if (selectedList === "all") {
      toast.error("Please select a list first");
      return;
    }
    try {
      // Import contacts to the currently selected list
      const result: any = await contactService.importCSV(file, selectedList);
      toast.success(`Imported ${result.imported} contacts successfully`);
      // Refresh contacts and lists
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact-lists'] });
      setIsCSVImportOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to import contacts");
    }
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
            <span className="text-xs text-muted-foreground">{contacts.length}</span>
          </button>

          {/* Dynamic Lists from API */}
          {lists.map((list: any) => (
            <button
              key={list.id}
              onClick={() => setSelectedList(list.id)}
              className={cn(
                "w-full flex items-center gap-3 h-10 px-3 rounded-md text-sm transition-colors",
                selectedList === list.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left truncate">{list.name}</span>
              <span className="text-xs text-muted-foreground">{list.contactCount || 0}</span>
            </button>
          ))}
        </nav>

        <div className="p-3">
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
          {/* Action Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-card/50">
            <div className="flex gap-3">
              {selectedList !== "all" && (
              <button
                onClick={() => setIsCSVImportOpen(true)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Import CSV</span>
              </button>
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
          <div className="mx-6 mt-4 h-14 px-6 bg-primary rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.length} selected
            </span>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsAddToListModalOpen(true)}
                className="px-4 py-2 bg-white/10 text-foreground rounded-lg text-sm font-medium hover:bg-white/20 transition-colors cursor-pointer"
              >
                Add to list
              </button>
              <button
                onClick={handleDeleteSelected}
                className="px-4 py-2 bg-red-500 text-foreground rounded-lg text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
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
        onClose={() => setIsCSVImportOpen(false)}
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
    </div>
  );
}
