export interface Worker {
  id: string;
  name: string;
  is_active?: boolean;
}

export interface HistoryItem {
  id: string;
  image_url: string;
  prediction: string;
  confidence: number;
  worker_name: string;
  created_at: string;
}

export interface PredictionResult {
  class_name: string;
  confidence: number;
  probabilities: Record<string, number>;
  recommendation_data: {
    description: string;
    cause: string;
    immediate_action: string[];
  };
  confidence_threshold: number;
}
