import { auth } from '@/lib/firebase';

interface TextRequest {
  prompt: string;
  context?: string;
}

interface ImageRequest {
  imageDataUri: string;
  prompt: string;
}

interface MedGemmaResponse {
  response: string;
  tokens_used: number;
  success: boolean;
}

class MedGemmaClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MEDGEMMA_API_URL || 'http://localhost:3001';
  }

  private async makeRequest<T>(
    endpoint: string,
    data: any,
    method: 'POST' = 'POST'
  ): Promise<T> {
    const apiKey = process.env.NEXT_PUBLIC_MEDGEMMA_API_KEY;
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey || '',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async processText(request: TextRequest): Promise<MedGemmaResponse> {
    return this.makeRequest<MedGemmaResponse>('/api/process-text', request);
  }

  async processImage(request: ImageRequest): Promise<MedGemmaResponse> {
    return this.makeRequest<MedGemmaResponse>('/api/process-image', request);
  }
}

export const medGemmaClient = new MedGemmaClient(); 