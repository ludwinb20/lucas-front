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
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MEDGEMMA_API_URL || 'http://137.184.163.232:8000';
    
    // Buscar la API key en múltiples variables de entorno
    this.apiKey = process.env.MEDGEMMA_API_KEY || 
                   process.env.NEXT_PUBLIC_MEDGEMMA_API_KEY || 
                   process.env.API_KEY || 
                   '';
    
    if (!this.apiKey) {
      console.error('❌ ERROR: API Key no encontrada');
      console.error('❌ Variables buscadas: MEDGEMMA_API_KEY, NEXT_PUBLIC_MEDGEMMA_API_KEY, API_KEY');
      console.error('❌ Agrega una de estas variables en tu .env');
    } else {
      console.log('✅ API Key encontrada:', this.apiKey.substring(0, 10) + '...');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    data: any,
    method: 'POST' = 'POST'
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('API Key no configurada. Agrega MEDGEMMA_API_KEY en .env');
    }

    console.log('🔍 Debug - Enviando request a:', `${this.baseUrl}${endpoint}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: JSON.stringify(data),
    });

    console.log('🔍 Debug - Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('🔍 Debug - Error data:', errorData);
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