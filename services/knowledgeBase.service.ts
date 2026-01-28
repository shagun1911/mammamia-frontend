import { apiClient } from '@/lib/api';
import { KnowledgeBaseItem } from '@/contexts/KnowledgeBaseContext';

export interface CreateFAQData {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  priority?: number;
}

export interface CreateWebsiteData {
  url: string;
  maxPages?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
}

export interface Website {
  id: string;
  name: string;
  url: string;
  created_at_unix: number;
  type: "url";
  status: "ready" | "processing" | "failed";
}

export interface CreatePromptData {
  name: string;
  type: 'system' | 'greeting' | 'fallback' | 'handoff';
  content: string;
  variables?: string[];
  isActive?: boolean;
}

/**
 * Knowledge Base Service
 * Handles knowledge base, FAQs, websites, files, and prompts
 */
class KnowledgeBaseService {
  // ============ Knowledge Bases ============

  /**
   * Get all knowledge bases
   * Only returns documents with status === "ready" for UI selection
   */
  async getAll(): Promise<KnowledgeBaseItem[]> {
    try {
      // apiClient.get() already returns response.data, so response is the data object
      const response = await apiClient.get<any>('/api/v1/knowledge-base?page_size=100');
      console.log('📦 [KnowledgeBaseService] getAll() full response:', response);
      console.log('📦 [KnowledgeBaseService] response type:', typeof response);
      console.log('📦 [KnowledgeBaseService] response.documents:', response?.documents);
      console.log('📦 [KnowledgeBaseService] response.data:', response?.data);
      
      // Handle different response structures
      let documents: any[] = [];
      
      // Check if response has documents directly (API spec format)
      if (response?.documents && Array.isArray(response.documents)) {
        documents = response.documents;
      }
      // Check if response is wrapped in data
      else if (response?.data?.documents && Array.isArray(response.data.documents)) {
        documents = response.data.documents;
      }
      // Check if response.data is directly an array
      else if (Array.isArray(response?.data)) {
        documents = response.data;
      }
      // Check if response is directly an array
      else if (Array.isArray(response)) {
        documents = response;
      }
      
      console.log('📦 [KnowledgeBaseService] Extracted documents:', documents);
      console.log('📦 [KnowledgeBaseService] Documents count:', documents.length);
      
      if (documents.length === 0) {
        console.warn('⚠️ [KnowledgeBaseService] No documents found in response. Response structure:', JSON.stringify(response, null, 2));
      }
      
      // Filter for only "ready" documents as per requirements
      const readyDocs = documents.filter((doc: any) => {
        const isReady = doc.status === "ready";
        console.log(`📦 [KnowledgeBaseService] Doc ${doc.id || doc.name}: status=${doc.status}, ready=${isReady}`);
        return isReady;
      });
      
      console.log('📦 [KnowledgeBaseService] Ready documents:', readyDocs);
      console.log('📦 [KnowledgeBaseService] Ready documents count:', readyDocs.length);
      
      return readyDocs;
    } catch (error: any) {
      console.error('❌ [KnowledgeBaseService] getAll() error:', error);
      console.error('❌ [KnowledgeBaseService] error response:', error.response);
      console.error('❌ [KnowledgeBaseService] error message:', error.message);
      throw new Error(error.message || 'Failed to fetch knowledge bases');
    }
  }

  /**
   * Get a single knowledge base document by ID
   */
  async getById(documentId: string): Promise<KnowledgeBaseItem | null> {
    try {
      const response = await apiClient.get<KnowledgeBaseItem>(`/api/v1/knowledge-base/${documentId}`);
      console.log('📦 [KnowledgeBaseService] getById() response:', response);
      return response;
    } catch (error: any) {
      console.error('❌ [KnowledgeBaseService] getById() error:', error);
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(error.message || 'Failed to fetch knowledge base');
    }
  }

  // ============ FAQs ============

  /**
   * Get all FAQs for a knowledge base document
   */
  async getFAQs(documentId: string) {
    try {
      const response = await apiClient.get(
        `/api/v1/knowledge-base/${documentId}/faqs`
      );
      return response.data.faqs;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch FAQs');
    }
  }

  /**
   * Create FAQ for a knowledge base document
   */
  async createFAQ(documentId: string, data: CreateFAQData) {
    try {
      const response = await apiClient.post(
        `/api/v1/knowledge-base/${documentId}/faqs`,
        data
      );
      return response.data.faq;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create FAQ');
    }
  }

  /**
   * Update FAQ for a knowledge base document
   */
  async updateFAQ(documentId: string, faqId: string, data: Partial<CreateFAQData>) {
    try {
      const response = await apiClient.patch(
        `/api/v1/knowledge-base/${documentId}/faqs/${faqId}`,
        data
      );
      return response.data.faq;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update FAQ');
    }
  }

  /**
   * Delete FAQ from a knowledge base document
   */
  async deleteFAQ(documentId: string, faqId: string) {
    try {
      const response = await apiClient.delete(
        `/api/v1/knowledge-base/${documentId}/faqs/${faqId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete FAQ');
    }
  }

  /**
   * Import FAQs from CSV to a knowledge base document
   */
  async importFAQs(documentId: string, file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.uploadFile(
        `/api/v1/knowledge-base/${documentId}/faqs/import`,
        formData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to import FAQs');
    }
  }

  // ============ Websites ============

  /**
   * Get all websites for a knowledge base document
   */
  async getWebsites(documentId: string): Promise<Website[]> {
    try {
      const response = await apiClient.get(
        `/api/v1/knowledge-base/${documentId}/websites`
      );
      return response.data.websites;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch websites');
    }
  }

  /**
   * Add website to knowledge base document
   */
  async addWebsite(documentId: string, data: CreateWebsiteData) {
    try {
      const response = await apiClient.post(
        `/api/v1/knowledge-base/${documentId}/websites`,
        data
      );
      return response.data.website;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add website');
    }
  }

  /**
   * Remove website from knowledge base document
   */
  async removeWebsite(documentId: string, websiteId: string) {
    try {
      const response = await apiClient.delete(
        `/api/v1/knowledge-base/${documentId}/websites/${websiteId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove website');
    }
  }

  /**
   * Resync website for a knowledge base document
   */
  async resyncWebsite(documentId: string, websiteId: string) {
    try {
      const response = await apiClient.post(
        `/api/v1/knowledge-base/${documentId}/websites/${websiteId}/update`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to resync website');
    }
  }

  // ============ Files ============

  /**
   * Get all files for a knowledge base document
   */
  async getFiles(documentId: string) {
    try {
      const response = await apiClient.get(
        `/api/v1/knowledge-base/${documentId}/files`
      );
      return response.data.files;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch files');
    }
  }

  /**
   * Upload file to knowledge base document
   */
  async uploadFile(
    documentId: string,
    file: File,
    onProgress?: (progress: number) => void
  ) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.uploadFile(
        `/api/v1/knowledge-base/${documentId}/files`,
        formData,
        onProgress
          ? (progressEvent: any) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          : undefined
      );
      return response.data.file;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload file');
    }
  }

  /**
   * Delete file from knowledge base document
   */
  async deleteFile(documentId: string, fileId: string) {
    try {
      const response = await apiClient.delete(
        `/api/v1/knowledge-base/${documentId}/files/${fileId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete file');
    }  
  }

  // ============ Prompts ============

  /**
   * Get all prompts
   */
  async getPrompts() {
    try {
      const response = await apiClient.get('/training/prompts');
      return response.data.prompts;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch prompts');
    }
  }

  /**
   * Get prompt by ID
   */
  async getPromptById(id: string) {
    try {
      const response = await apiClient.get(`/training/prompts/${id}`);
      return response.data.prompt;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch prompt');
    }
  }

  /**
   * Create prompt
   */
  async createPrompt(data: CreatePromptData) {
    try {
      const response = await apiClient.post('/training/prompts', data);
      return response.data.prompt;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create prompt');
    }
  }

  /**
   * Update prompt
   */
  async updatePrompt(id: string, data: Partial<CreatePromptData>) {
    try {
      const response = await apiClient.patch(`/training/prompts/${id}`, data);
      return response.data.prompt;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update prompt');
    }
  }

  /**
   * Delete prompt
   */
  async deletePrompt(id: string) {
    try {
      const response = await apiClient.delete(`/training/prompts/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete prompt');
    }
  }

  // ============ Search ============

  /**
   * Search knowledge base document
   */
  async search(documentId: string, query: string) {
    try {
      const response = await apiClient.get(
        `/api/v1/knowledge-base/${documentId}/search`,
        {
          params: { query },
        }
      );
      return response.data.results;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search knowledge base');
    }
  }
}

// Export singleton instance
export const knowledgeBaseService = new KnowledgeBaseService();
