"use client";

import { useState, useEffect } from "react";
import { X, Folder, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FolderSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string | null) => void;
  currentFolderId?: string | null;
}

export function FolderSelectModal({
  isOpen,
  onClose,
  onSelect,
  currentFolderId
}: FolderSelectModalProps) {
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      
      const response = await fetch(`${API_URL}/conversations/folders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('FolderSelectModal - Loaded folders:', data);
        // Backend returns { success: true, data: folders }
        const foldersArray = data.data || data.folders || [];
        setFolders(Array.isArray(foldersArray) ? foldersArray : []);
      } else {
        const errorData = await response.json();
        console.error('Failed to load folders:', errorData);
        toast.error('Failed to load folders');
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
      toast.error('Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      setCreating(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
      
      const response = await fetch(`${API_URL}/conversations/folders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newFolderName })
      });

      if (response.ok) {
        toast.success('Folder created');
        setNewFolderName("");
        setShowNewFolder(false);
        await loadFolders();
      } else {
        throw new Error('Failed to create folder');
      }
    } catch (error: any) {
      console.error('Failed to create folder:', error);
      toast.error(error.message || 'Failed to create folder');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Move to Folder</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* None option */}
              <button
                onClick={() => {
                  onSelect(null);
                  onClose();
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  !currentFolderId
                    ? 'bg-primary/10 text-primary border border-primary'
                    : 'hover:bg-accent text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <X className="w-4 h-4" />
                  <span>No Folder</span>
                </div>
              </button>

              {/* Folders list */}
              {folders.map((folder) => (
                <button
                  key={folder._id || folder.id}
                  onClick={() => {
                    onSelect(folder._id || folder.id);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    currentFolderId === (folder._id || folder.id)
                      ? 'bg-primary/10 text-primary border border-primary'
                      : 'hover:bg-accent text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    <span>{folder.name}</span>
                  </div>
                </button>
              ))}

              {folders.length === 0 && !loading && (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  No folders yet. Create one below.
                </p>
              )}
            </>
          )}
        </div>

        {/* Create New Folder */}
        <div className="mt-4 pt-4 border-t border-border">
          {!showNewFolder ? (
            <button
              onClick={() => setShowNewFolder(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create New Folder
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowNewFolder(false);
                    setNewFolderName("");
                  }}
                  className="flex-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={creating || !newFolderName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-foreground rounded-lg text-sm font-medium hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

