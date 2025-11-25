import axios from 'axios';

const PYTHON_RAG_URL = process.env.NEXT_PUBLIC_RAG_API_URL || 'https://keplerov1-python-production.up.railway.app';

export interface CreateCollectionRequest {
  collection_name: string;
}

export interface DataIngestionRequest {
  collection_name: string;
  url_links?: string;
  pdf_files?: File[];
  excel_files?: File[];
}

export interface ChatRequest {
  query: string;
  collection_name: string;
  top_k?: number;
  thread_id?: string;
  system_prompt?: string;
  provider?: string;
  api_key?: string;
}

export interface ChatResponse {
  query: string;
  answer: string;
  retrieved_docs: string[];
  context: string;
  thread_id: string;
}

export interface RAGResponse {
  status: string;
  message: string;
  details?: any;
  transcript?: any;
}

export class PythonRagService {
  /**
   * Create a new collection in Python RAG
   */
  async createCollection(collectionName: string): Promise<RAGResponse> {
    try {
      const response = await axios.post<RAGResponse>(
        `${PYTHON_RAG_URL}/rag/create_collection`,
        { collection_name: collectionName },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to create collection'
      );
    }
  }

  /**
   * Delete a collection from Python RAG
   */
  async deleteCollection(collectionName: string): Promise<RAGResponse> {
    try {
      const response = await axios.delete<RAGResponse>(
        `${PYTHON_RAG_URL}/rag/delete_collection`,
        {
          headers: { 'Content-Type': 'application/json' },
          data: { collection_name: collectionName }
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to delete collection'
      );
    }
  }

  /**
   * Ingest data into a collection
   */
  async ingestData(
    params: DataIngestionRequest,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<RAGResponse> {
    try {
      const formData = new FormData();
      formData.append('collection_name', params.collection_name);

      // Add URL links as comma-separated string
      if (params.url_links) {
        formData.append('url_links', params.url_links);
      }

      // Add PDF files
      if (params.pdf_files && params.pdf_files.length > 0) {
        params.pdf_files.forEach((file) => {
          formData.append('pdf_files', file);
        });
      }

      // Add Excel files
      if (params.excel_files && params.excel_files.length > 0) {
        params.excel_files.forEach((file) => {
          formData.append('excel_files', file);
        });
      }

      const response = await axios.post<RAGResponse>(
        `${PYTHON_RAG_URL}/rag/data_ingestion`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress
        }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to ingest data'
      );
    }
  }

  /**
   * Chat with RAG system
   */
  async chat(params: ChatRequest): Promise<ChatResponse> {
    try {
      console.log('🔧 [Python RAG Service] Chat request initiated');
      console.log('📦 [Python RAG Service] Parameters:', {
        collection: params.collection_name,
        query: params.query?.substring(0, 50) + '...',
        threadId: params.thread_id,
        topK: params.top_k,
        hasSystemPrompt: !!params.system_prompt,
        provider: params.provider,
        hasApiKey: !!params.api_key
      });

      // Fetch API keys if not provided
      let provider = params.provider;
      let apiKey = params.api_key;

      if (!provider || !apiKey) {
        console.log('🔑 [Python RAG Service] API keys not provided, fetching from service...');
        try {
          const { apiKeysService } = await import('./apiKeys.service');
          const apiKeys = await apiKeysService.getApiKeys();
          if (apiKeys) {
            provider = apiKeys.llmProvider;
            apiKey = apiKeys.apiKey;
            console.log('✅ [Python RAG Service] API keys fetched:', {
              provider,
              apiKeyLength: apiKey?.length || 0
            });
          } else {
            console.warn('⚠️  [Python RAG Service] No API keys found in service');
          }
        } catch (error) {
          console.warn('❌ [Python RAG Service] Failed to fetch API keys:', error);
        }
      }

      const requestBody = {
        query: params.query,
        collection_name: params.collection_name,
        top_k: params.top_k || 5,
        thread_id: params.thread_id,
        system_prompt: params.system_prompt,
        provider: provider,
        api_key: apiKey
      };

      const chatUrl = `${PYTHON_RAG_URL}/rag/chat`;
      
      console.log('\n========== PYTHON RAG - CHAT REQUEST ==========');
      console.log('💬 [Python RAG] URL:', chatUrl);
      console.log('📦 [Python RAG] Full Request Body:', JSON.stringify({
        ...requestBody,
        api_key: requestBody.api_key ? `${requestBody.api_key.substring(0, 10)}...***` : 'NOT_SET'
      }, null, 2));
      console.log('=====================================================\n');

      const response = await axios.post<ChatResponse>(
        chatUrl,
        requestBody,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log('\n========== PYTHON RAG - CHAT RESPONSE ==========');
      console.log('✅ [Python RAG] Response Status:', response.status);
      console.log('📦 [Python RAG] Full Response Body:', JSON.stringify(response.data, null, 2));
      console.log('=====================================================\n');

      return response.data;
    } catch (error: any) {
      console.error('❌ [Python RAG Service] Request failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to chat with RAG'
      );
    }
  }

  /**
   * Get list of collections from Python RAG (Note: This endpoint may not exist on Python backend)
   * Returns empty array if endpoint doesn't exist
   */
  async getCollections(): Promise<Array<{ collection_name: string }>> {
    try {
      const response = await axios.get(`${PYTHON_RAG_URL}/rag/collections`, { timeout: 5000 });
      return response.data.collections || [];
    } catch (error) {
      console.warn('Collections endpoint not available, returning empty array');
      return [];
    }
  }

  /**
   * Health check for Python RAG service
   */
  async healthCheck(): Promise<boolean> {
    try {
      await axios.get(`${PYTHON_RAG_URL}/health`, { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const pythonRagService = new PythonRagService();

