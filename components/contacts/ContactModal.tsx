"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required"),
  tags: z.array(z.string()).optional(),
  listIds: z.array(z.string()).optional(),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ContactFormData) => Promise<void>;
  initialData?: Partial<ContactFormData>;
  mode?: "add" | "edit";
  lists?: any[];
  preSelectedListId?: string;
}

export function ContactModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = "add",
  lists = [],
  preSelectedListId,
}: ContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLists, setSelectedLists] = useState<string[]>(
    preSelectedListId ? [preSelectedListId] : (initialData?.listIds || [])
  );
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData || { name: "", email: "", phone: "", tags: [] },
  });

  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (isOpen) {
      reset(initialData || { name: "", email: "", phone: "", tags: [] });
      setSelectedLists(preSelectedListId ? [preSelectedListId] : (initialData?.listIds || []));
    }
  }, [isOpen, initialData, preSelectedListId, reset]);

  const toggleList = (listId: string) => {
    setSelectedLists((prev) =>
      prev.includes(listId)
        ? prev.filter((id) => id !== listId)
        : [...prev, listId]
    );
  };

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true);
      await onSave({ ...data, listIds: selectedLists });
      reset();
      setSelectedLists([]);
      onClose();
    } catch (error) {
      // Error is handled by parent component
      // Keep modal open for user to correct the data
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedLists([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-[560px] bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {mode === "add" ? "Add Contact" : "Edit Contact"}
          </h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Name
            </label>
            <input
              {...register("name")}
              placeholder="Enter name"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="Enter email"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Phone
            </label>
            <input
              {...register("phone")}
              type="tel"
              placeholder="+1 555-0000"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Lists Selection */}
          {lists.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Add to Lists (Optional)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {lists.map((list) => (
                  <button
                    key={list.id || list._id}
                    type="button"
                    onClick={() => toggleList(list.id || list._id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all text-left",
                      selectedLists.includes(list.id || list._id)
                        ? "bg-primary/20 border border-primary"
                        : "bg-secondary hover:bg-accent"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0",
                      selectedLists.includes(list.id || list._id)
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}>
                      {selectedLists.includes(list.id || list._id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm text-foreground">{list.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? "Saving..." 
                : mode === "add" ? "Add Contact" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

