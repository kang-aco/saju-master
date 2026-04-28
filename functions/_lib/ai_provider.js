// ai_provider.js — Claude / NVIDIA NIM AI Provider 통합 추상화
//
// 사용법:
//   import { callAI } from '../_lib/ai_provider.js';
//   const text = await callAI('claude', env, prompt, 6000);
//   const text = await callAI('nvidia', env, prompt, 6000);
//
// 환경변수:
//   CLAUDE_API_KEY  — Anthropic Claude API 키
//   NVIDIA_API_KEY  — NVIDIA NIM (build.nvidia.com) API 키

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Claude (Anthropic) — claude-sonnet-4-6
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function callClaude(apiKey, prompt, maxTokens = 6000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API 오류: ${res.status} ${err}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  if (data.stop_reason === 'max_tokens') {
    return text + '\n\n*(응답이 길이 제한으로 일부 잘렸습니다.)*';
  }
  return text;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  NVIDIA NIM (OpenAI 호환) — Llama 3.3 70B 기본
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  지원 모델:
//    meta/llama-3.3-70b-instruct          (기본, 한국어 ○)
//    meta/llama-3.1-405b-instruct         (최고 품질, 느림)
//    deepseek-ai/deepseek-r1              (추론 특화)
//    mistralai/mistral-large-2-instruct   (대안)
//    nvidia/llama-3.1-nemotron-70b-instruct (NVIDIA 튜닝판)
async function callNvidia(apiKey, prompt, maxTokens = 6000, model = 'meta/llama-3.3-70b-instruct') {
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '당신은 자평진전(子平眞詮)에 능통한 한국어 명리학 전문가입니다. 한국어로만 답변하세요.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.4,
      top_p: 0.9,
      stream: false,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NVIDIA NIM API 오류: ${res.status} ${err}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  const finish = data.choices?.[0]?.finish_reason;
  if (finish === 'length') {
    return text + '\n\n*(응답이 길이 제한으로 일부 잘렸습니다.)*';
  }
  return text;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  통합 호출 함수
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/**
 * @param {'claude'|'nvidia'} provider
 * @param {object} env — Cloudflare Pages 환경변수 객체
 * @param {string} prompt
 * @param {number} maxTokens
 * @param {string} [nvidiaModel]
 * @returns {Promise<string>} AI 응답 텍스트
 */
export async function callAI(provider, env, prompt, maxTokens = 6000, nvidiaModel) {
  const p = (provider || 'claude').toLowerCase();

  if (p === 'nvidia') {
    if (!env.NVIDIA_API_KEY) {
      // NVIDIA 키 없으면 Claude로 자동 폴백
      if (env.CLAUDE_API_KEY) {
        return await callClaude(env.CLAUDE_API_KEY, prompt, maxTokens) +
          '\n\n*(NVIDIA_API_KEY가 설정되지 않아 Claude로 응답합니다.)*';
      }
      return '※ NVIDIA_API_KEY가 설정되지 않았습니다. Cloudflare Pages 환경변수를 확인하세요.';
    }
    return await callNvidia(env.NVIDIA_API_KEY, prompt, maxTokens, nvidiaModel);
  }

  // 기본값: Claude
  if (!env.CLAUDE_API_KEY) {
    if (env.NVIDIA_API_KEY) {
      return await callNvidia(env.NVIDIA_API_KEY, prompt, maxTokens, nvidiaModel) +
        '\n\n*(CLAUDE_API_KEY가 설정되지 않아 NVIDIA로 응답합니다.)*';
    }
    return '※ CLAUDE_API_KEY가 설정되지 않았습니다. Cloudflare Pages 환경변수를 확인하세요.';
  }
  return await callClaude(env.CLAUDE_API_KEY, prompt, maxTokens);
}

// 사용 가능 여부 체크 (UI에서 활용)
export function getAvailableProviders(env) {
  return {
    claude: !!env.CLAUDE_API_KEY,
    nvidia: !!env.NVIDIA_API_KEY,
  };
}
