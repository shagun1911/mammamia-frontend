import axios, { AxiosInstance } from 'axios';

const INTEGRATION_API_URL = process.env.NEXT_PUBLIC_INTEGRATION_API_URL || 'https://keplerov1-python-2.onrender.com';

class IntegrationService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: INTEGRATION_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ==================== SETUP ENDPOINTS ====================

  async setupShopify(config: {
    shop_url: string;
    admin_api_key: string;
    api_version?: string;
  }) {
    const response = await this.api.post('/integration/setup/shopify', config);
    return response.data;
  }

  async setupWooCommerce(config: {
    store_url: string;
    consumer_key: string;
    consumer_secret: string;
    api_version?: string;
  }) {
    const response = await this.api.post('/integration/setup/woocommerce', config);
    return response.data;
  }

  async setupMagento2(config: {
    store_url: string;
    consumer_key: string;
    consumer_secret: string;
    access_token: string;
    access_token_secret: string;
    api_version?: string;
  }) {
    const response = await this.api.post('/integration/setup/magento2', config);
    return response.data;
  }

  async setupPrestaShop(config: {
    store_url: string;
    api_key: string;
    api_version?: string;
  }) {
    const response = await this.api.post('/integration/setup/prestashop', config);
    return response.data;
  }

  async setupQapla(config: {
    api_key: string;
    base_url?: string;
  }) {
    const response = await this.api.post('/integration/setup/qapla', config);
    return response.data;
  }

  async setupVerticalBooking(config: {
    hotel_id: string;
    style_id: string;
    dc: string;
    base_url?: string;
  }) {
    const response = await this.api.post('/integration/setup/vertical-booking', config);
    return response.data;
  }

  async setupBookingExpert(config: {
    engine_url: string;
    layout_id: string;
    adult_type_id: string;
    teen_type_id: string;
    child_type_id: string;
  }) {
    const response = await this.api.post('/integration/setup/booking-expert', config);
    return response.data;
  }

  async setupMCP(config: {
  name: string;
    url: string;
    headers?: Record<string, string>;
  }) {
    const response = await this.api.post('/integration/setup/mcp', config);
    return response.data;
  }

  // ==================== SHOPIFY ENDPOINTS ====================

  async getShopifyProducts(limit: number = 50) {
    const response = await this.api.get('/integration/shopify/products', {
      params: { limit },
    });
    return response.data;
  }

  async getShopifyProduct(productId: string) {
    const response = await this.api.get(`/integration/shopify/products/${productId}`);
    return response.data;
  }

  async updateShopifyProduct(productId: string, updates: any) {
    const response = await this.api.put(`/integration/shopify/products/${productId}`, updates);
    return response.data;
  }

  async getShopifyOrders(limit: number = 50) {
    const response = await this.api.get('/integration/shopify/orders', {
      params: { limit },
    });
    return response.data;
  }

  async getShopifyOrder(orderId: string) {
    const response = await this.api.get(`/integration/shopify/orders/${orderId}`);
    return response.data;
  }

  async testShopifyConnection() {
    const response = await this.api.get('/integration/shopify/test-connection');
    return response.data;
  }

  // ==================== WOOCOMMERCE ENDPOINTS ====================

  async getWooCommerceProducts(per_page: number = 50) {
    const response = await this.api.get('/integration/woocommerce/products', {
      params: { per_page },
    });
    return response.data;
  }

  async getWooCommerceProduct(productId: string) {
    const response = await this.api.get(`/integration/woocommerce/products/${productId}`);
    return response.data;
  }

  async updateWooCommerceProduct(productId: string, updates: any) {
    const response = await this.api.put(`/integration/woocommerce/products/${productId}`, updates);
    return response.data;
  }

  async getWooCommerceOrders(per_page: number = 50) {
    const response = await this.api.get('/integration/woocommerce/orders', {
      params: { per_page },
    });
    return response.data;
  }

  async getWooCommerceOrder(orderId: string) {
    const response = await this.api.get(`/integration/woocommerce/orders/${orderId}`);
    return response.data;
  }

  async testWooCommerceConnection() {
    const response = await this.api.get('/integration/woocommerce/test-connection');
    return response.data;
  }

  // ==================== MAGENTO2 ENDPOINTS ====================

  async getMagento2Products(page_size: number = 50, current_page: number = 1) {
    const response = await this.api.get('/integration/magento2/products', {
      params: { page_size, current_page },
    });
    return response.data;
  }

  async getMagento2Product(sku: string) {
    const response = await this.api.get(`/integration/magento2/products/${sku}`);
    return response.data;
  }

  async updateMagento2Product(sku: string, updates: any) {
    const response = await this.api.put(`/integration/magento2/products/${sku}`, updates);
    return response.data;
  }

  async getMagento2Orders(page_size: number = 50, current_page: number = 1) {
    const response = await this.api.get('/integration/magento2/orders', {
      params: { page_size, current_page },
    });
    return response.data;
  }

  async getMagento2Order(orderId: string) {
    const response = await this.api.get(`/integration/magento2/orders/${orderId}`);
    return response.data;
  }

  async testMagento2Connection() {
    const response = await this.api.get('/integration/magento2/test-connection');
    return response.data;
  }

  // ==================== PRESTASHOP ENDPOINTS ====================

  async getPrestaShopProducts(limit: number = 50, offset: number = 0) {
    const response = await this.api.get('/integration/prestashop/products', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getPrestaShopProduct(productId: string) {
    const response = await this.api.get(`/integration/prestashop/products/${productId}`);
    return response.data;
  }

  async getPrestaShopOrders(limit: number = 50, offset: number = 0) {
    const response = await this.api.get('/integration/prestashop/orders', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getPrestaShopOrder(orderId: string) {
    const response = await this.api.get(`/integration/prestashop/orders/${orderId}`);
    return response.data;
  }

  async testPrestaShopConnection() {
    const response = await this.api.get('/integration/prestashop/test-connection');
    return response.data;
  }

  // ==================== QAPLA ENDPOINTS ====================

  async getQaplaProducts(page: number = 1, per_page: number = 50) {
    const response = await this.api.get('/integration/qapla/products', {
      params: { page, per_page },
    });
    return response.data;
  }

  async getQaplaProduct(productId: string) {
    const response = await this.api.get(`/integration/qapla/products/${productId}`);
    return response.data;
  }

  async getQaplaOrders(page: number = 1, per_page: number = 50) {
    const response = await this.api.get('/integration/qapla/orders', {
      params: { page, per_page },
    });
    return response.data;
  }

  async getQaplaOrder(orderId: string) {
    const response = await this.api.get(`/integration/qapla/orders/${orderId}`);
    return response.data;
  }

  async testQaplaConnection() {
    const response = await this.api.get('/integration/qapla/test-connection');
    return response.data;
  }

  // ==================== VERTICAL BOOKING ENDPOINTS ====================

  async generateVerticalBookingLink(data: {
    check_in: string;
    check_out: string;
    adults: number;
    children?: number;
    extra_params?: Record<string, any>;
  }) {
    const response = await this.api.post('/integration/vertical-booking/generate-link', data);
    return response.data;
  }

  async testVerticalBookingConnection() {
    const response = await this.api.get('/integration/vertical-booking/test-connection');
    return response.data;
  }

  // ==================== BOOKING EXPERT ENDPOINTS ====================

  async generateBookingExpertLink(data: {
    hotel_id: string;
    check_in: string;
    check_out: string;
    adults: number;
    teens?: number;
    children?: number;
    extra_params?: Record<string, any>;
  }) {
    const response = await this.api.post('/integration/booking-expert/generate-link', data);
    return response.data;
  }

  async testBookingExpertConnection() {
    const response = await this.api.get('/integration/booking-expert/test-connection');
    return response.data;
  }

  // ==================== MCP MICROSERVICE ENDPOINTS ====================

  async mcpRequest(data: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: Record<string, any>;
    data?: Record<string, any>;
  }) {
    const response = await this.api.post('/integration/mcp/request', data);
    return response.data;
  }

  async mcpSetHeader(key: string, value: string) {
    const response = await this.api.post('/integration/mcp/set-header', { key, value });
    return response.data;
  }

  async mcpRemoveHeader(key: string) {
    const response = await this.api.delete(`/integration/mcp/remove-header/${key}`);
    return response.data;
  }

  // ==================== REGISTRY & DISCOVERY ENDPOINTS ====================

  async listAllIntegrations() {
    const response = await this.api.get('/integration/registry/list-all');
    return response.data;
  }

  async listByCategory(category: string) {
    const response = await this.api.get(`/integration/registry/by-category/${category}`);
    return response.data;
  }

  async listByTag(tag: string) {
    const response = await this.api.get(`/integration/registry/by-tag/${tag}`);
    return response.data;
  }

  async searchIntegrations(query: string) {
    const response = await this.api.get('/integration/registry/search', {
      params: { query },
    });
    return response.data;
  }

  // ==================== STATUS & MANAGEMENT ENDPOINTS ====================

  async listInitializedIntegrations() {
    const response = await this.api.get('/integration/status/initialized');
    return response.data;
  }

  async testAllConnections() {
    const response = await this.api.get('/integration/status/test-connections');
    return response.data;
  }

  async removeIntegration(integrationName: string) {
    const response = await this.api.delete(`/integration/remove/${integrationName}`);
    return response.data;
  }

  async removeAllIntegrations() {
    const response = await this.api.delete('/integration/remove-all');
    return response.data;
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }
}

export const integrationService = new IntegrationService();
