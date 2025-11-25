import { apiClient } from '@/lib/api';

export interface CreateKnowledgeBaseData {
  name: string;
  description?: string;
  isDefault?: boolean;
}

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
   */
  async getAll() {
    try {
      const response = await apiClient.get('/training/knowledge-bases');
      return response.data.data || response.data.knowledgeBases || response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch knowledge bases');
    }
  }

  /**
   * Get knowledge base by ID
   */
  async getById(id: string) {
    try {
      const response = await apiClient.get(`/training/knowledge-bases/${id}`);
      return response.data.data || response.data.knowledgeBase || response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch knowledge base');
    }
  }

  /**
   * Create knowledge base
   */
  async create(data: CreateKnowledgeBaseData) {
    try {
      const response = await apiClient.post('/training/knowledge-bases', data);
      return response.data.data || response.data.knowledgeBase || response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create knowledge base');
    }
  }

  /**
   * Update knowledge base
   */
  async update(id: string, data: Partial<CreateKnowledgeBaseData>) {
    try {
      const response = await apiClient.patch(`/training/knowledge-bases/${id}`, data);
      return response.data.data || response.data.knowledgeBase || response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update knowledge base');
    }
  }

  /**
   * Delete knowledge base
   */
  async delete(id: string) {
    try {
      const response = await apiClient.delete(`/training/knowledge-bases/${id}`);
      return response.data.data || response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete knowledge base');
    }
  }

  // ============ FAQs ============

  /**
   * Get all FAQs for a knowledge base
   */
  async getFAQs(knowledgeBaseId: string) {
    try {
      const response = await apiClient.get(
        `/training/knowledge-bases/${knowledgeBaseId}/faqs`
      );
      return response.data.faqs;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch FAQs');
    }
  }

  /**
   * Create FAQ
   */
  async createFAQ(knowledgeBaseId: string, data: CreateFAQData) {
    try {
      const response = await apiClient.post(
        `/training/knowledge-bases/${knowledgeBaseId}/faqs`,
        data
      );
      return response.data.faq;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create FAQ');
    }
  }

  /**
   * Update FAQ
   */
  async updateFAQ(knowledgeBaseId: string, faqId: string, data: Partial<CreateFAQData>) {
    try {
      const response = await apiClient.patch(
        `/training/knowledge-bases/${knowledgeBaseId}/faqs/${faqId}`,
        data
      );
      return response.data.faq;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update FAQ');
    }
  }

  /**
   * Delete FAQ
   */
  async deleteFAQ(knowledgeBaseId: string, faqId: string) {
    try {
      const response = await apiClient.delete(
        `/training/knowledge-bases/${knowledgeBaseId}/faqs/${faqId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete FAQ');
    }
  }

  /**
   * Import FAQs from CSV
   */
  async importFAQs(knowledgeBaseId: string, file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.uploadFile(
        `/training/knowledge-bases/${knowledgeBaseId}/faqs/import`,
        formData
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to import FAQs');
    }
  }

  // ============ Websites ============

  /**
   * Get all websites for a knowledge base
   */
  async getWebsites(knowledgeBaseId: string) {
    try {
      const response = await apiClient.get(
        `/training/knowledge-bases/${knowledgeBaseId}/websites`
      );
      return response.data.websites;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch websites');
    }
  }

  /**
   * Add website to knowledge base
   */
  async addWebsite(knowledgeBaseId: string, data: CreateWebsiteData) {
    try {
      const response = await apiClient.post(
        `/training/knowledge-bases/${knowledgeBaseId}/websites`,
        data
      );
      return response.data.website;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add website');
    }
  }

  /**
   * Remove website from knowledge base
   */
  async removeWebsite(knowledgeBaseId: string, websiteId: string) {
    try {
      const response = await apiClient.delete(
        `/training/knowledge-bases/${knowledgeBaseId}/websites/${websiteId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove website');
    }
  }

  /**
   * Resync website
   */
  async resyncWebsite(knowledgeBaseId: string, websiteId: string) {
    try {
      const response = await apiClient.post(
        `/training/knowledge-bases/${knowledgeBaseId}/websites/${websiteId}/update`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to resync website');
    }
  }

  // ============ Files ============

  /**
   * Get all files for a knowledge base
   */
  async getFiles(knowledgeBaseId: string) {
    try {
      const response = await apiClient.get(
        `/training/knowledge-bases/${knowledgeBaseId}/files`
      );
      return response.data.files;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch files');
    }
  }

  /**
   * Upload file to knowledge base
   */
  async uploadFile(
    knowledgeBaseId: string,
    file: File,
    onProgress?: (progress: number) => void
  ) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.uploadFile(
        `/training/knowledge-bases/${knowledgeBaseId}/files`,
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
   * Delete file from knowledge base
   */
  async deleteFile(knowledgeBaseId: string, fileId: string) {
    try {
      const response = await apiClient.delete(
        `/training/knowledge-bases/${knowledgeBaseId}/files/${fileId}`
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
   * Search knowledge base
   */
  async search(knowledgeBaseId: string, query: string) {
    try {
      const response = await apiClient.get(
        `/training/knowledge-bases/${knowledgeBaseId}/search`,
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

