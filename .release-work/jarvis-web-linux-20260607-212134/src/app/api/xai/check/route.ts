import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { key, recognizeOnly } = await request.json();

    if (!key) {
      return NextResponse.json({ success: false, error: 'Key is required' }, { status: 400 });
    }

    // xAI key format check (starts with xai-)
    const isRecognized = key.trim().startsWith('xai-');

    if (recognizeOnly) {
      return NextResponse.json({
        success: true,
        result: {
          provider: 'xai',
          recognized: isRecognized,
          verdict: isRecognized ? 'format_valid' : 'format_invalid'
        }
      });
    }

    // Verify by calling xAI API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch('https://api.x.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key.trim()}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return NextResponse.json({
          success: true,
          result: {
            provider: 'xai',
            recognized: true,
            verdict: 'valid'
          }
        });
      } else {
        const errorText = await response.text();
        console.error('xAI API Error:', response.status, errorText);
        return NextResponse.json({
          success: false,
          error: `Verification failed: ${response.status}`,
          result: {
            provider: 'xai',
            recognized: isRecognized,
            verdict: 'invalid'
          }
        });
      }
    } catch (fetchError: any) {
      console.error('Network Error checking xAI key:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Network error connecting to xAI API',
        result: {
          provider: 'xai',
          recognized: isRecognized,
          verdict: 'network_error'
        }
      });
    }

  } catch (error: any) {
    console.error('Handler Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
