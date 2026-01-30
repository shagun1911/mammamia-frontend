"use client";

import { Pencil, Trash2, Mail, Phone, Tag, User, Building2 } from "lucide-react";
import { Contact } from "@/data/mockContacts";
import { cn } from "@/lib/utils";

interface ContactsTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => Promise<void>;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

export function ContactsTable({
  contacts,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: ContactsTableProps) {
  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length;

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No contacts found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Get started by importing contacts from a CSV file or adding a new contact manually.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed" style={{ minWidth: 0 }}>
          <thead>
            <tr className="bg-gradient-to-r from-secondary/50 to-secondary/30 border-b border-border">
              <th className="w-12 px-3 py-3 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                />
              </th>
              <th className="w-14 px-2 py-3"></th>
              <th className="w-[14%] px-3 py-3 text-left">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Name</span>
                </div>
              </th>
              <th className="w-[18%] px-3 py-3 text-left">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Email</span>
                </div>
              </th>
              <th className="w-[13%] px-3 py-3 text-left">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Phone</span>
                </div>
              </th>
              <th className="w-[12%] px-3 py-3 text-left">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Company</span>
                </div>
              </th>
              <th className="w-[16%] px-3 py-3 text-left">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">Tags</span>
                </div>
              </th>
              <th className="w-24 px-3 py-3 text-right shrink-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map((contact, index) => {
              const company = (contact as any).metadata?.["Company name"] ?? (contact as any).metadata?.company ?? "—";
              const tagList = contact.tags || [];
              const tagDisplay = tagList.length > 2 ? tagList.slice(0, 2) : tagList;
              const extraTags = tagList.length > 2 ? tagList.length - 2 : 0;
              return (
                <tr
                  key={contact.id}
                  className={cn(
                    "group hover:from-primary/5 hover:to-transparent transition-colors",
                    index % 2 === 0 ? "bg-card" : "bg-secondary/20"
                  )}
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(contact.id)}
                      onChange={() => onToggleSelect(contact.id)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-xs shadow ring-2 ring-background shrink-0"
                      style={{ backgroundColor: contact.color }}
                    >
                      {contact.avatar}
                    </div>
                  </td>
                  <td className="px-3 py-3 min-w-0">
                    <span className="block text-sm font-medium text-foreground truncate" title={contact.name}>
                      {contact.name}
                    </span>
                  </td>
                  <td className="px-3 py-3 min-w-0">
                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}`}
                        className="block text-sm text-muted-foreground hover:text-primary truncate max-w-full"
                        title={contact.email}
                      >
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground/50 italic">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 min-w-0">
                    {contact.phone ? (
                      <a
                        href={`tel:${contact.phone}`}
                        className="block text-sm text-muted-foreground hover:text-primary truncate max-w-full"
                        title={contact.phone}
                      >
                        {contact.phone}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground/50 italic">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 min-w-0">
                    <span className="block text-sm text-muted-foreground truncate" title={company}>
                      {company}
                    </span>
                  </td>
                  <td className="px-3 py-3 min-w-0">
                    <div className="flex flex-wrap gap-1 items-center min-w-0 overflow-hidden">
                      {tagDisplay.length > 0 ? (
                        <>
                          {tagDisplay.map((tag) => (
                            <span
                              key={tag}
                              className="shrink-0 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded border border-primary/20 truncate max-w-[80px]"
                              title={tag}
                            >
                              {tag}
                            </span>
                          ))}
                          {extraTags > 0 && (
                            <span className="shrink-0 px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded">
                              +{extraTags}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 w-24 shrink-0">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(contact); }}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit contact"
                        type="button"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const contactId = contact.id || (contact as any)._id || (contact as any).contactId || (contact as any).contact_id;
                          if (contactId && typeof onDelete === "function") onDelete(contactId);
                        }}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete contact"
                        type="button"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

