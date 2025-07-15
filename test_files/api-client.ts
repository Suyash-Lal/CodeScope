/**
 * HTTP API client for making requests
 */
interface ApiResponse<T> {
    data: T;
    status: number;
    headers: Record<string, string>;
}

interface RequestConfig {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}

class ApiClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;
    private timeout: number;

    constructor(baseUrl: string, defaultHeaders: Record<string, string> = {}) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = defaultHeaders;
        this.timeout = 30000;
    }

    /**
     * Sends GET request
     */
    async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.sendRequest<T>({
            method: 'GET',
            url: `${this.baseUrl}${endpoint}`,
            headers
        });
    }

    /**
     * Sends POST request
     */
    async post<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.sendRequest<T>({
            method: 'POST',
            url: `${this.baseUrl}${endpoint}`,
            body: data,
            headers
        });
    }

    /**
     * Sends PUT request
     */
    async put<T>(endpoint: string, data?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.sendRequest<T>({
            method: 'PUT',
            url: `${this.baseUrl}${endpoint}`,
            body: data,
            headers
        });
    }

    /**
     * Sends DELETE request
     */
    async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.sendRequest<T>({
            method: 'DELETE',
            url: `${this.baseUrl}${endpoint}`,
            headers
        });
    }

    /**
     * Sends HTTP request
     */
    private async sendRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.executeRequest(config);
            return this.handleResponse<T>(response);
        } catch (error) {
            this.handleRequestError(error, config);
            throw error;
        }
    }

    /**
     * Executes HTTP request
     */
    private async executeRequest(config: RequestConfig): Promise<Response> {
        const headers = {
            ...this.defaultHeaders,
            ...config.headers
        };

        const requestOptions: RequestInit = {
            method: config.method,
            headers,
            signal: AbortSignal.timeout(config.timeout || this.timeout)
        };

        if (config.body) {
            requestOptions.body = JSON.stringify(config.body);
            headers['Content-Type'] = 'application/json';
        }

        return fetch(config.url, requestOptions);
    }

    /**
     * Handles API response
     */
    private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
        const data = await response.json();
        
        if (!response.ok) {
            this.handleApiError(response, data);
        }

        return {
            data,
            status: response.status,
            headers: this.parseHeaders(response.headers)
        };
    }

    /**
     * Handles API errors
     */
    private handleApiError(response: Response, data: any): void {
        const error = new Error(`API Error: ${response.status} - ${response.statusText}`);
        console.error('API Error:', { status: response.status, data });
        throw error;
    }

    /**
     * Handles request errors
     */
    private handleRequestError(error: any, config: RequestConfig): void {
        console.error('Request Error:', { error: error.message, config });
        
        if (error.name === 'AbortError') {
            console.error('Request timeout');
        }
    }

    /**
     * Parses response headers
     */
    private parseHeaders(headers: Headers): Record<string, string> {
        const result: Record<string, string> = {};
        headers.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    /**
     * Sets authentication token
     */
    setAuthToken(token: string): void {
        this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Removes authentication token
     */
    removeAuthToken(): void {
        delete this.defaultHeaders['Authorization'];
    }

    /**
     * Sets default timeout
     */
    setTimeout(timeout: number): void {
        this.timeout = timeout;
    }

    /**
     * Validates response data
     */
    private validateResponse<T>(data: any): T {
        // Add validation logic here
        return data as T;
    }
}