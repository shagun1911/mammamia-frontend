import { apiClient } from '@/lib/api';

export interface ContactFilters {
  search?: string;
  listIds?: string[];
  tags?: string[];
  status?: string;
  kanbanStatus?: string;
  page?: number;
  limit?: number;
}

export interface CreateContactData {
  name: string;
  phone?: string;
  email?: string;
  customProperties?: Record<string, any>;
  tags?: string[];
  listIds?: string[];
  kanbanStatus?: string;
}

export interface UpdateContactData extends Partial<CreateContactData> {}

/**
 * Contact Service
 * Handles all contact-related API calls
 */
class ContactService {
  /**
   * Get all contacts with optional filters
   */
  async getAll(filters?: ContactFilters) {
    try {
      // Map listIds to listId for backend compatibility
      const params: any = { ...filters };
      if (params.listIds && params.listIds.length > 0) {
        params.listId = params.listIds[0]; // Backend expects singular listId
        delete params.listIds;
      }
      
      const response = await apiClient.get('/contacts', {
        params,
      });
      // Backend uses paginatedResponse which returns { success: true, data: { items: [...], pagination: {...} } }
      // Access nested data structure: response.data.data.items
      const responseData = response.data?.data || response.data;
      const items = responseData?.items || [];
      
      // Transform _id to id for frontend compatibility and add UI defaults
      const contacts = (Array.isArray(items) ? items : []).map((contact: any) => ({
        ...contact,
        id: contact._id || contact.id,
        avatar: contact.avatar || contact.name?.charAt(0).toUpperCase() || '?',
        color: contact.color || '#6366f1',
        tags: contact.tags || [],
      }));
      
      return {
        contacts,
        pagination: responseData?.pagination || { page: 1, limit: 30, total: contacts.length, totalPages: 1 },
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch contacts');
    }
  }

  /**
   * Get contact by ID
   */
  async getById(id: string) {
    try {
      const response = await apiClient.get(`/contacts/${id}`);
      // Backend uses successResponse which returns { data: <contact> }
      // Transform _id to id for frontend compatibility
      return {
        ...response.data,
        id: response.data._id,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch contact');
    }
  }

  /**
   * Create new contact
   */
  async create(data: CreateContactData) {
    try {
      // Map listIds to lists for backend compatibility
      const payload = {
        ...data,
        lists: data.listIds, // Backend expects 'lists' field
      };
      delete payload.listIds; // Remove listIds to avoid confusion
      
      const response = await apiClient.post('/contacts', payload);
      // Backend uses successResponse which returns { data: <contact> }
      // Transform _id to id for frontend compatibility and add UI defaults
      const contact = response.data;
      return {
        ...contact,
        id: contact._id,
        avatar: contact.avatar || contact.name?.charAt(0).toUpperCase() || '?',
        color: contact.color || '#6366f1',
        tags: contact.tags || [],
      };
    } catch (error: any) {
      // Handle specific error codes
      if (error.status === 409) {
        throw new Error('A contact with this email already exists');
      }
      throw new Error(error.message || 'Failed to create contact');
    }
  }

  /**
   * Update contact
   */
  async update(id: string, data: UpdateContactData) {
    try {
      // Map listIds to lists for backend compatibility
      const payload: any = { ...data };
      if (payload.listIds) {
        payload.lists = payload.listIds;
        delete payload.listIds;
      }
      
      const response = await apiClient.patch(`/contacts/${id}`, payload);
      // Backend uses successResponse which returns { data: <contact> }
      // Transform _id to id for frontend compatibility
      return {
        ...response.data,
        id: response.data._id,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update contact');
    }
  }

  /**
   * Delete contact
   */
  async delete(id: string) {
    if (!id) {
      console.error('[Contact Service] Delete called without ID');
      throw new Error('Contact ID is required');
    }
    
    try {
      console.log('[Contact Service] Deleting contact with ID:', id);
      console.log('[Contact Service] Full URL will be:', `/contacts/${id}`);
      
      const response = await apiClient.delete(`/contacts/${id}`);
      
      console.log('[Contact Service] Delete response status:', response.status);
      console.log('[Contact Service] Delete response data:', response.data);
      
      // Handle both nested and direct response structures
      const result = response.data?.data || response.data;
      return result;
    } catch (error: any) {
      console.error('[Contact Service] Delete error details:');
      console.error('[Contact Service] Error message:', error?.message);
      console.error('[Contact Service] Error response:', error?.response);
      console.error('[Contact Service] Error response data:', error?.response?.data);
      console.error('[Contact Service] Error response status:', error?.response?.status);
      
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.error?.message
        || error?.message 
        || 'Failed to delete contact';
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Bulk delete contacts
   */
  async bulkDelete(contactIds: string[]) {
    try {
      const response = await apiClient.post('/contacts/bulk-delete', {
        contactIds,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to bulk delete contacts');
    }
  }

  /**
   * Import contacts from CSV
   */
  async importCSV(file: File, listId?: string) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // If listId is provided, use the list-specific import endpoint
      const endpoint = listId 
        ? `/contacts/lists/${listId}/import`
        : '/contacts/import';

      console.log('[CSV Import] Uploading to:', endpoint);
      console.log('[CSV Import] File:', file.name, file.size, 'bytes');
      
      const response = await apiClient.uploadFile(endpoint, formData);
      console.log('[CSV Import] Response:', response);
      
      // Handle both response formats: { data: { data: ... } } or { data: ... }
      return response.data?.data || response.data || response;
    } catch (error: any) {
      console.error('[CSV Import] Error:', error);
      throw new Error(error.message || 'Failed to import contacts');
    }
  }

  /**
   * Export contacts to CSV
   */
  async exportCSV(filters?: ContactFilters) {
    try {
      const response = await apiClient.get('/contacts/export', {
        params: filters,
        responseType: 'blob',
      });
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to export contacts');
    }
  }

  /**
   * Add contacts to list
   */
  async addToList(contactIds: string[], listId: string) {
    try {
      const response = await apiClient.post('/contacts/add-to-list', {
        contactIds,
        listId,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add contacts to list');
    }
  }

  /**
   * Remove contacts from list
   */
  async removeFromList(contactIds: string[], listId: string) {
    try {
      const response = await apiClient.post('/contacts/remove-from-list', {
        contactIds,
        listId,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove contacts from list');
    }
  }

  /**
   * Update contact kanban status
   */
  async updateKanbanStatus(contactId: string, status: string) {
    try {
      const response = await apiClient.patch(`/contacts/${contactId}/kanban-status`, {
        status,
      });
      return response.data.contact;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update kanban status');
    }
  }

  /**
   * Add tags to contact
   */
  async addTags(contactId: string, tags: string[]) {
    try {
      const response = await apiClient.post(`/contacts/${contactId}/tags`, {
        tags,
      });
      return response.data.contact;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add tags');
    }
  }

  /**
   * Remove tags from contact
   */
  async removeTags(contactId: string, tags: string[]) {
    try {
      const response = await apiClient.delete(`/contacts/${contactId}/tags`, {
        data: { tags },
      });
      return response.data.contact;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove tags');
    }
  }

  /**
   * Get contact lists
   */
  async getLists() {
    try {
      const response = await apiClient.get('/contacts/lists/all');
      // Backend returns { data: <array> } using successResponse
      const lists = response.data || [];
      // Transform _id to id for frontend compatibility
      return lists.map((list: any) => ({
        ...list,
        id: list._id,
      }));
    } catch (error: any) {
      // If endpoint doesn't exist, return empty array instead of failing
      console.warn('Contact lists endpoint not available:', error.message);
      return [];
    }
  }

  /**
   * Create contact list
   */
  async createList(name: string, description?: string) {
    try {
      const response = await apiClient.post('/contacts/lists', {
        name,
        description,
      });
      // Backend returns { data: <list> } using successResponse
      const list = response.data;
      return {
        ...list,
        id: list._id,
      };
    } catch (error: any) {
      if (error.status === 409) {
        throw new Error('A list with this name already exists');
      }
      throw new Error(error.message || 'Failed to create list');
    }
  }

  /**
   * Bulk add contacts to list
   */
  async bulkAddToList(contactIds: string[], listId: string) {
    try {
      const response = await apiClient.post('/contacts/bulk-add-to-list', {
        contactIds,
        listId,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add contacts to list');
    }
  }

  /**
   * Update contact list
   */
  async updateList(listId: string, name: string, description?: string) {
    try {
      const response = await apiClient.patch(`/contacts/lists/${listId}`, {
        name,
        description,
      });
      return response.data.list;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update list');
    }
  }

  /**
   * Delete contact list
   */
  async deleteList(listId: string) {
    try {
      const response = await apiClient.delete(`/contacts/lists/${listId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete list');
    }
  }

  /**
   * Delete all contacts from a list
   */
  async deleteAllContactsFromList(listId: string) {
    try {
      const response = await apiClient.delete(`/contacts/lists/${listId}/contacts`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete all contacts from list');
    }
  }

  /**
   * Get custom property definitions
   */
  async getCustomProperties() {
    try {
      const response = await apiClient.get('/contacts/custom-properties/all');
      return response.data.properties;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch custom properties');
    }
  }

  /**
   * Create custom property definition
   */
  async createCustomProperty(name: string, type: string, options?: any) {
    try {
      const response = await apiClient.post('/contacts/custom-properties', {
        name,
        type,
        options,
      });
      return response.data.property;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create custom property');
    }
  }
}

// Export singleton instance
export const contactService = new ContactService();

