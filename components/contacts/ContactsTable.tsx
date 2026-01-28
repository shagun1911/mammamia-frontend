"use client";

import { useState } from "react";
import { Pencil, Trash2, Mail, Phone, Tag, User } from "lucide-react";
import { Contact } from "@/data/mockContacts";
import { cn } from "@/lib/utils";

interface ContactsTableProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void | Promise<void>;
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
  
  // Debug: Log when component renders
  console.error('[ContactsTable] Component rendered with', contacts.length, 'contacts');
  console.error('[ContactsTable] onDelete function:', typeof onDelete, onDelete);
  
  // Test delete function immediately
  if (contacts.length > 0 && typeof onDelete === 'function') {
    console.error('[ContactsTable] ✅ onDelete is available and is a function');
    console.error('[ContactsTable] First contact ID:', contacts[0]?.id);
  } else {
    console.error('[ContactsTable] ❌ onDelete issue - contacts:', contacts.length, 'onDelete type:', typeof onDelete);
  }

  if (contacts.length === 0) {
    console.error('[ContactsTable] No contacts to display');
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No contacts found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Get started by importing contacts from a CSV file or adding a new contact manually.
        </p>
        {/* TEST BUTTON */}
        <button
          onClick={() => {
            console.error('🧪 TEST BUTTON CLICKED');
            alert('TEST BUTTON WORKS!');
            if (typeof onDelete === 'function') {
              console.error('🧪 onDelete is available, calling with test ID');
              onDelete('test-id-123').catch(err => console.error('🧪 Test delete error:', err));
            } else {
              console.error('🧪 onDelete is NOT available');
            }
          }}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
        >
          🧪 TEST DELETE FUNCTION
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      {/* TEST BUTTON - Always visible */}
      <div className="p-2 bg-yellow-200 dark:bg-yellow-900 border-b">
        <button
          onClick={() => {
            console.error('🧪 TEST BUTTON CLICKED FROM TABLE');
            alert('TEST BUTTON WORKS!\n\nContacts: ' + contacts.length + '\nonDelete type: ' + typeof onDelete);
            if (contacts.length > 0 && typeof onDelete === 'function') {
              const testId = contacts[0].id;
              console.error('🧪 Calling onDelete with first contact ID:', testId);
              onDelete(testId).catch(err => console.error('🧪 Test delete error:', err));
            }
          }}
          className="px-3 py-1 bg-red-500 text-white rounded text-sm"
        >
          🧪 TEST DELETE (Click me first!)
        </button>
      </div>
      <table className="w-full">
        {/* Enhanced Header */}
        <thead>
          <tr className="bg-gradient-to-r from-secondary/50 to-secondary/30 border-b border-border">
            <th className="w-12 px-6 py-4">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer transition-all"
              />
            </th>
            <th className="w-16 px-4 py-4"></th>
            <th className="px-6 py-4 text-left">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Name
                </span>
              </div>
            </th>
            <th className="px-6 py-4 text-left">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Email
                </span>
              </div>
            </th>
            <th className="w-[200px] px-6 py-4 text-left">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Phone
                </span>
              </div>
            </th>
            <th className="w-[180px] px-6 py-4 text-left">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tags
                </span>
              </div>
            </th>
            <th className="w-24 px-6 py-4 text-right">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </span>
            </th>
          </tr>
        </thead>

        {/* Enhanced Body */}
        <tbody className="divide-y divide-border">
          {contacts.map((contact, index) => {
            console.error(`[ContactsTable] Rendering contact ${index}:`, contact.name, 'ID:', contact.id);
            return (
            <tr
              key={contact.id}
              className={cn(
                "group hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent transition-all duration-200",
                index % 2 === 0 ? "bg-card" : "bg-secondary/20"
              )}
              onClick={(e) => {
                // Prevent row click from interfering with button clicks
                const target = e.target as HTMLElement;
                console.error('[ContactsTable] Row clicked, target:', target.tagName, target.className);
                if (target.closest('button') || target.closest('input')) {
                  console.error('[ContactsTable] Click was on button/input, allowing it');
                  return; // Let button/input handle their own clicks
                }
                console.error('[ContactsTable] Row click not prevented');
              }}
            >
              <td className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(contact.id)}
                  onChange={() => onToggleSelect(contact.id)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer transition-all"
                />
              </td>
              <td className="px-4 py-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md ring-2 ring-background"
                  style={{ backgroundColor: contact.color }}
                >
                  {contact.avatar}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {contact.name}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                {contact.email ? (
                  <a 
                    href={`mailto:${contact.email}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group/email"
                  >
                    <Mail className="w-3.5 h-3.5 opacity-0 group-hover/email:opacity-100 transition-opacity" />
                    {contact.email}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground/50 italic">No email</span>
                )}
              </td>
              <td className="px-6 py-4">
                {contact.phone ? (
                  <a 
                    href={`tel:${contact.phone}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group/phone"
                  >
                    <Phone className="w-3.5 h-3.5 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
                    {contact.phone}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground/50 italic">No phone</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1.5">
                  {contact.tags && contact.tags.length > 0 ? (
                    contact.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-md border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground/50 italic">No tags</span>
                  )}
                  {contact.tags && contact.tags.length > 3 && (
                    <span className="px-2.5 py-1 bg-secondary text-muted-foreground text-xs font-medium rounded-md">
                      +{contact.tags.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 relative" style={{ zIndex: 100 }}>
                <div className="flex items-center justify-end gap-1 relative" style={{ zIndex: 101 }}>
                  <button
                    onClick={() => {
                      console.log('[ContactsTable] Edit button clicked');
                      onEdit(contact);
                    }}
                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all group/btn relative z-10"
                    title="Edit contact"
                    type="button"
                  >
                    <Pencil className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                  </button>
                  <button
                    onMouseDown={(e) => {
                      console.error('🟢 MOUSEDOWN on delete button');
                      e.stopPropagation();
                    }}
                    onMouseUp={(e) => {
                      console.error('🟢 MOUSEUP on delete button');
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      // FORCE LOG - This MUST appear if click fires
                      console.error('🔴🔴🔴 DELETE BUTTON CLICKED 🔴🔴🔴');
                      console.error('🔴 Contact Name:', contact.name);
                      console.error('🔴 Contact ID:', contact.id);
                      
                      // Force alert to verify click works
                      const shouldProceed = window.confirm('DELETE BUTTON CLICKED!\n\nContact: ' + contact.name + '\nID: ' + contact.id + '\n\nClick OK to proceed with delete.');
                      
                      if (!shouldProceed) {
                        console.error('🔴 User cancelled in button handler');
                        return;
                      }
                      
                      e.preventDefault();
                      e.stopPropagation();
                      
                      // Also log to window for debugging
                      (window as any).lastDeleteClick = {
                        time: new Date().toISOString(),
                        contact: contact,
                        id: contact.id
                      };
                      
                      console.error('🔴 Stored in window.lastDeleteClick');
                      
                      // Try multiple ways to get the ID
                      const contactId = contact.id 
                        || (contact as any)._id 
                        || (contact as any).contactId
                        || (contact as any).contact_id;
                      
                      console.error('🔴 Resolved contactId:', contactId);
                      
                      if (!contactId) {
                        const errorMsg = 'Contact ID is missing. Cannot delete.';
                        console.error('🔴 [DELETE ERROR]', errorMsg);
                        alert(errorMsg + '\n\nContact object: ' + JSON.stringify(contact, null, 2));
                        return;
                      }
                      
                      console.error('🔴 Calling onDelete with ID:', contactId);
                      console.error('🔴 onDelete type:', typeof onDelete);
                      console.error('🔴 onDelete function:', onDelete);
                      
                      // Call the delete handler directly
                      if (typeof onDelete === 'function') {
                        console.error('🔴 onDelete is a function, calling it NOW...');
                        try {
                          const result = onDelete(contactId);
                          console.error('🔴 onDelete returned:', result);
                          
                          // Handle Promise if returned
                          if (result && typeof result === 'object' && 'catch' in result) {
                            console.error('🔴 onDelete returned a Promise, setting up catch handler');
                            (result as Promise<void>).catch((error) => {
                              console.error('🔴 Promise rejected:', error);
                            });
                          } else {
                            console.error('🔴 onDelete returned synchronously');
                          }
                        } catch (error) {
                          console.error('🔴 Exception calling onDelete:', error);
                        }
                      } else {
                        console.error('🔴 [DELETE ERROR] onDelete is NOT a function!', onDelete);
                        alert('ERROR: Delete handler is not available!\n\nType: ' + typeof onDelete);
                      }
                    }}
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all group/btn cursor-pointer relative z-10"
                    title="Delete contact"
                    type="button"
                    style={{ 
                      pointerEvents: 'auto', 
                      zIndex: 1000,
                      position: 'relative',
                      backgroundColor: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform pointer-events-none" />
                  </button>
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

