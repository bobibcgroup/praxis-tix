/**
 * Evaluation metrics and feedback logging (north star: outfit acceptance rate).
 */

export interface FeedbackPayload {
  event: 'outfit_shown' | 'outfit_accepted' | 'outfit_rejected' | 'flow_abandoned';
  /** Outfit id (display 1,2,3 or library id) */
  outfit_id?: number | string;
  /** Session or user id */
  session_id?: string;
  user_id?: string;
  /** Time from outfits shown to selection (ms) */
  time_to_decision_ms?: number;
  /** User overrode / chose alternative */
  override?: boolean;
  /** Confidence shown (0-100) */
  confidence_shown?: number;
  /** Step when abandoned (if event = flow_abandoned) */
  step?: number;
  occasion?: string;
  mode?: 'quick' | 'personal';
}

export interface EvaluationMetrics {
  outfit_acceptance_rate: number;
  time_to_decision_avg_ms: number;
  override_frequency: number;
  repeat_usage_rate: number;
  confidence_rating_avg: number;
}
