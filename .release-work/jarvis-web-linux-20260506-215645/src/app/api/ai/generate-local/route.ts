/* [CodeGuard Feature Index] */
/* - Function applyDomesticWebSearchOptions -> line 9 */
/* - Function POST -> line 48 */
/* - Section Server-side Key Management Logic -> line 58 */
/* - Section Construct messages -> line 149 */
/* - Section Provider URL and model selection -> line 158 */
/* - Section Upstream request with web-search fallback -> line 203 */
/* - Section Error handling -> line 240 */
/* [/CodeGuard Feature Index] */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSystemConfig } from '@/lib/config';
import { validateApiKey } from '@/lib/apiKeyService';

export const runtime = 'nodejs'; // Use Node.js Runtime for Prisma support

function applyDomesticWebSearchOptions(
  payload: Record<string, any>,
  providerKey: string,
  enableWebSearch: boolean
): { payload: Record<string, any>; applied: boolean } {
  if (!enableWebSearch) {
    return { payload, applied: false };
  }

  const p = (providerKey || '').toLowerCase();
  const next = { ...payload };

  // Qwen (DashScope compatible endpoint): use top-level `enable_search` and `search_options`.
  if (p === 'dashscope' || p === 'qwen' || p === 'aliyun') {
    next.enable_search = true;
    next.search_options = { forced_search: true };
    return { payload: next, applied: true };
  }

  // Doubao native web_search is on Responses API.
  // Current route uses /chat/completions, so keep native switch off here.
  if (p === 'doubao') {
    return { payload, applied: false };
  }

  // Zhipu GLM compatible tool switch.
  if (p === 'zhipu' || p === 'chatglm') {
    next.tools = [{ type: 'web_search', web_search: { enable: true, search_result: true } }];
    return { payload: next, applied: true };
  }

  // Kimi web-search relies on tool-calls loop; this route is one-shot streaming.
  if (p === 'kimi' || p === 'moonshot') {
    return { payload, applied: false };
  }

  // deepseek / siliconflow: no stable native web-search switch in this route.
  return { payload, applied: false };
}

async function fetchZhipuWebSearchContext(
  authHeaders: string[],
  query: string
): Promise<string> {
  const q = (query ?? '').trim();
  if (!q) return '';

  const candidates = [...new Set((authHeaders || []).map(h => String(h || '').trim()).filter(Boolean))];
  for (const authHeader of candidates) {
    try {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/web_search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          search_query: q,
          count: 5,
          search_result: true
        })
      });

      if (!response.ok) {
        const err = await response.text();
        console.warn('[Generate-Local] zhipu web_search failed', { status: response.status, err });
        continue;
      }

      const data = await response.json();
      const list =
        (Array.isArray(data?.search_result) ? data.search_result : null) ||
        (Array.isArray(data?.search_results) ? data.search_results : null) ||
        (Array.isArray(data?.results) ? data.results : null) ||
        (Array.isArray(data?.data?.search_result) ? data.data.search_result : null) ||
        [];

      if (!Array.isArray(list) || list.length === 0) continue;

      const lines = list.slice(0, 5).map((item: any, index: number) => {
        const title = String(item?.title ?? item?.name ?? `搜索结果${index + 1}`).trim();
        const snippet = String(item?.content ?? item?.snippet ?? item?.summary ?? '').trim();
        const link = String(item?.link ?? item?.url ?? '').trim();
        const snippetShort = snippet.length > 240 ? `${snippet.slice(0, 240)}...` : snippet;
        return `${index + 1}. ${title}\n${snippetShort}${link ? `\n来源: ${link}` : ''}`;
      });

      return lines.join('\n\n');
    } catch (error: any) {
      console.warn('[Generate-Local] zhipu web_search exception', error?.message || error);
    }
  }

  return '';
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instruction, provider, model, selectedText, webSearch } = body;
    let authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    // --- Server-side Key Management Logic ---
    let useSystemKey = false;
    let configuredModel = '';
    const token = authHeader.replace('Bearer ', '');
    
    // Check if it's a JWT (starts with eyJ)
    if (token.startsWith('eyJ')) {
        const payload = verifyToken(token);
        if (payload) {
            // Valid user, fetch status to confirm subscription/balance
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: { id: true, tokenBalance: true, licenseType: true, licenses: true }
            });

            if (!user) {
                 return NextResponse.json({ error: 'User not found' }, { status: 401 });
            }

            // Optional: Check balance here (skip for now to focus on connectivity)
            // if (user.tokenBalance <= 0) ...

            useSystemKey = true;
        }
    } else {
        const apiKeyRecord = await validateApiKey(token);

        if (apiKeyRecord) {
             if (!apiKeyRecord.isActive) {
                 return NextResponse.json({ error: 'API Key is disabled' }, { status: 401 });
             }
             if (apiKeyRecord.expiresAt && new Date(apiKeyRecord.expiresAt) < new Date()) {
                 return NextResponse.json({ error: 'API Key expired' }, { status: 401 });
             }
             useSystemKey = true;
        }
    }

    // If using system service, swap the key
    if (useSystemKey) {
        let systemKey = '';
        const providerKey = provider?.toLowerCase();
        
        // Priority: DB Config -> Env Var
        if (providerKey === 'openai') {
            systemKey = await getSystemConfig('platform_openai_key') || process.env.PLATFORM_OPENAI_KEY || '';
            configuredModel = await getSystemConfig('platform_openai_model') || '';
        } else if (providerKey === 'deepseek') {
            const dbKey = await getSystemConfig('platform_deepseek_key');
            const envKey = process.env.PLATFORM_DEEPSEEK_KEY;
            systemKey = dbKey || envKey || '';
            configuredModel = await getSystemConfig('platform_deepseek_model') || '';
            console.log('[Generate-Local] DeepSeek Debug Info:');
            console.log('- DB Key exists:', !!dbKey);
            console.log('- Env Key exists:', !!envKey);
            console.log('- Final System Key Last 4:', systemKey.slice(-4));
            console.log('- Configured Model:', configuredModel);
        } else if (providerKey === 'doubao') {
            systemKey = await getSystemConfig('platform_doubao_key') || process.env.PLATFORM_DOUBAO_KEY || '';
            configuredModel = await getSystemConfig('platform_doubao_model') || '';
        } else if (providerKey === 'dashscope' || providerKey === 'qwen' || providerKey === 'aliyun') {
            systemKey = await getSystemConfig('platform_dashscope_key') || process.env.PLATFORM_DASHSCOPE_KEY || '';
            configuredModel = await getSystemConfig('platform_dashscope_model') || '';
        } else if (providerKey === 'zhipu' || providerKey === 'chatglm') {
            systemKey = await getSystemConfig('platform_zhipu_key') || process.env.PLATFORM_ZHIPU_KEY || '';
            configuredModel = await getSystemConfig('platform_zhipu_model') || '';
        } else if (providerKey === 'kimi' || providerKey === 'moonshot') {
            systemKey = await getSystemConfig('platform_kimi_key') || process.env.PLATFORM_KIMI_KEY || '';
            configuredModel = await getSystemConfig('platform_kimi_model') || '';
        } else {
            // Default to SiliconFlow for 'siliconflow' or unknown
            systemKey = await getSystemConfig('platform_siliconflow_key') || process.env.PLATFORM_SILICONFLOW_KEY || '';
            configuredModel = await getSystemConfig('platform_siliconflow_model') || '';
        }

        if (systemKey) {
            authHeader = `Bearer ${systemKey}`;
        } else {
             // Fallback: If no system key is found but we are in a dev environment or have a fallback, use it.
             // Otherwise, check if the original token was actually an API key (not JWT) and user wanted to use it?
             // But here useSystemKey is true, meaning we decided to use system key.
             
             // If system key is missing, log error but maybe try to proceed if we want to allow "bring your own key" override?
             // No, if useSystemKey is true, it means we are responsible for paying.
             
             console.error(`[Generate-Local] Missing System API Key for ${provider}`);
             // Don't fail immediately, try to see if env var works as last resort or just empty string (will fail upstream)
             // return NextResponse.json({ error: `System API Key for ${provider} not configured` }, { status: 500 });
        }
    }
    // --- End Key Management ---

    // Construct messages
    const messages = [
      { role: 'system', content: 'You are a helpful assistant embedded in Microsoft Word. User may provide selected text context.' },
      { role: 'user', content: selectedText 
        ? `${instruction}\n\nSelected Text Context:\n${selectedText}`
        : instruction 
      }
    ];

    // Determine upstream URL based on provider (simple mapping)
    // Priority: Env Var -> Provider Mapping -> Default
    let baseUrl = process.env.AI_API_BASE_URL || 'https://api.siliconflow.cn/v1'; // Default to SiliconFlow
    
    // You can add more providers here
    const pKey = provider?.toLowerCase();
    if (pKey === 'openai') {
      baseUrl = 'https://api.openai.com/v1';
    } else if (pKey === 'deepseek') {
        baseUrl = 'https://api.deepseek.com';
    } else if (pKey === 'doubao') {
        baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
    } else if (pKey === 'dashscope' || pKey === 'qwen' || pKey === 'aliyun') {
        baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    } else if (pKey === 'zhipu' || pKey === 'chatglm') {
        baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
    } else if (pKey === 'kimi' || pKey === 'moonshot') {
        baseUrl = 'https://api.moonshot.cn/v1';
    }

    // Determine target model
    let defaultModel = 'deepseek-ai/DeepSeek-V3';
    if (pKey === 'openai') defaultModel = 'gpt-3.5-turbo';
    else if (pKey === 'deepseek') defaultModel = 'deepseek-chat';
    else if (pKey === 'doubao') defaultModel = 'doubao-lite-4k';
    else if (pKey === 'dashscope' || pKey === 'qwen') defaultModel = 'qwen-turbo';
    else if (pKey === 'zhipu') defaultModel = 'glm-4';
    else if (pKey === 'kimi' || pKey === 'moonshot') defaultModel = 'moonshot-v1-8k';
    
    // Priority: Request Model -> Configured Model -> Default Model
    // Note: If request model is empty, use configured.
    const targetModel = model || configuredModel || defaultModel;
    const requestTemperature = (pKey === 'kimi' || pKey === 'moonshot') ? 1 : 0.7;
    const enableWebSearch = webSearch === true || webSearch === 'true';
    let effectiveMessages = messages;

    // Provider-specific fallback prefetch:
    // only for providers without stable native web-search in this route,
    // plus zhipu as a timeliness enhancer.
    const prefetchProviders = new Set([
      'zhipu',
      'chatglm',
      'doubao',
      'deepseek',
      'kimi',
      'moonshot',
      'siliconflow'
    ]);
    if (enableWebSearch && prefetchProviders.has(pKey || '')) {
      const query = selectedText ? `${instruction}\n${selectedText}` : instruction;
      const zhipuSystemKey = await getSystemConfig('platform_zhipu_key') || process.env.PLATFORM_ZHIPU_KEY || '';
      const webSearchAuthHeaders: string[] = [];
      if (zhipuSystemKey) webSearchAuthHeaders.push(`Bearer ${zhipuSystemKey}`);
      if (authHeader) webSearchAuthHeaders.push(authHeader);
      const webContext = await fetchZhipuWebSearchContext(webSearchAuthHeaders, query);
      if (webContext) {
        const userContent = String(messages[1]?.content ?? '').trim();
        effectiveMessages = [
          messages[0],
          {
            role: 'user',
            content:
              `${userContent}\n\n[Latest Web Search Results]\n${webContext}\n\n` +
              'Please prioritize the web search results above and include source links in your final answer.'
          }
        ];
      } else {
        console.warn('[Generate-Local] webSearch prefetch enabled but no context', {
          provider: pKey,
          model: targetModel
        });
      }
    }
    const basePayload: Record<string, any> = {
      model: targetModel,
      messages: effectiveMessages,
      stream: true,
      temperature: requestTemperature
    };
    const withSearch = applyDomesticWebSearchOptions(basePayload, pKey || '', enableWebSearch);

    // Call upstream API
    let upstreamRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(withSearch.payload)
    });

    // Some provider/model combinations may reject search params.
    // In that case, retry once with plain payload to avoid breaking generation.
    if (!upstreamRes.ok && withSearch.applied && (upstreamRes.status === 400 || upstreamRes.status === 422)) {
      const firstError = await upstreamRes.text();
      console.warn('[Generate-Local] webSearch params rejected, fallback to plain payload', {
        provider: pKey,
        status: upstreamRes.status,
        error: firstError
      });

      upstreamRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(basePayload)
      });
    }

    if (!upstreamRes.ok) {
      const errorText = await upstreamRes.text();
      console.error('Upstream API Error:', errorText);
      return NextResponse.json({ error: `Provider Error (${upstreamRes.status}): ${errorText}` }, { status: upstreamRes.status });
    }

    // Return the stream directly
    return new NextResponse(upstreamRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error: any) {
    console.error('Generate API Error:', error);
    return NextResponse.json({
      error: `Server Error: ${error?.message || 'Unknown error'}`
    }, { status: 500 });
  }
}
