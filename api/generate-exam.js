export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt가 없습니다.' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: '서버 환경변수 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.' });
    }

    const toolSchema = {
      name: 'submit_exam',
      description: '완성된 중학교 영어 내신 모의고사 문항 배열을 제출합니다.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          questions: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: true,
              properties: {
                number: { type: 'integer' },
                type: { type: 'string' },
                subtype: { type: 'string' },
                format: { type: 'string', enum: ['객관식', '서술형'] },
                difficulty: { type: 'string' },
                passage: { type: 'string' },
                stem: { type: 'string' },
                choices: { type: 'array', items: { type: 'string' } },
                answer: {},
                explanation: { type: 'string' },
                points: { type: 'integer' }
              },
              required: ['number', 'type', 'format', 'difficulty', 'stem', 'choices', 'answer', 'explanation']
            }
          }
        },
        required: ['questions']
      }
    };

    const compactPrompt = `${prompt}\n\n[매우 중요]\n- 반드시 submit_exam 도구를 사용해 문항을 제출하세요.\n- 일반 텍스트나 코드블록으로 JSON을 쓰지 마세요.\n- passage, stem, choices, explanation은 너무 길게 쓰지 말고 간결하게 작성하세요.\n- 객관식 choices는 반드시 5개입니다.\n- 서술형 choices는 빈 배열 []입니다.`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
        max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 3500),
        tools: [toolSchema],
        tool_choice: { type: 'tool', name: 'submit_exam' },
        messages: [{ role: 'user', content: compactPrompt }]
      })
    });

    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({
        error: data?.error?.message || 'Claude API 오류',
        raw: data
      });
    }

    const toolUse = Array.isArray(data?.content)
      ? data.content.find(block => block.type === 'tool_use' && block.name === 'submit_exam')
      : null;

    if (toolUse?.input?.questions) {
      return res.status(200).json({ questions: toolUse.input.questions });
    }

    const text = data?.content?.map(block => block.text || '').join('\n') || '';
    return res.status(200).json({ text });
  } catch (err) {
    console.error('SERVER_ERROR:', err);
    return res.status(500).json({ error: err.message || '서버 오류' });
  }
}
