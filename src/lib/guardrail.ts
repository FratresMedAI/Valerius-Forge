export interface ClassifyResponse {
  violation: boolean;
  confidence: number;
  decision: string;
  risk_score: number;
  reason_codes: string[];
  detail: string | null;
  version: string;
  mini_rescue: boolean;
  mini_entropy: string | null;
}

export interface GuardResult {
  ok: boolean;
  blocked: boolean;
  unavailable: boolean;
  response?: ClassifyResponse;
  error?: string;
}

const ENDPOINT = '/api/classify';

export async function guard(text: string): Promise<GuardResult> {
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      return { ok: false, blocked: false, unavailable: true, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as ClassifyResponse;
    const blocked = data.decision === 'block' || data.violation === true;
    return { ok: !blocked, blocked, unavailable: false, response: data };
  } catch (err) {
    return {
      ok: false,
      blocked: false,
      unavailable: true,
      error: err instanceof Error ? err.message : 'Mini Templar unreachable',
    };
  }
}
