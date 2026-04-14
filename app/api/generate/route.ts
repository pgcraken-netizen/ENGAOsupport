import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OpenAI APIキーが設定されていません。Vercelの環境変数を確認してください。" },
      { status: 500 }
    );
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { activity, statuses, event } = await request.json();

  if (!activity) {
    return Response.json({ error: "活動を選択してください" }, { status: 400 });
  }

  const statusText = statuses?.length > 0 ? statuses.join("・") : null;

  const userContent = [
    `活動: ${activity}`,
    statusText ? `様子: ${statusText}` : null,
    event?.trim() ? `出来事: ${event.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたは放課後等デイサービスの記録作成補助AIです。
以下を厳守してください：
・入力された事実のみを使用する
・推測や補完をしない
・客観的で丁寧な文章にする
・保護者にも配慮した柔らかい表現にする
・医療・診断的表現をしない
・否定的断定表現を避ける
・丁寧語で統一する
・出力は記録文章のみ（前置き・説明不要）
・100〜150文字程度の簡潔な文章にする

記録文の構成：
本日は【活動】に参加しました。【様子や出来事】の様子が見られましたが、職員が適切に関わることで、その後は落ち着いて過ごすことができました。

様子や出来事がない場合は：
本日は【活動】に参加しました。終始【様子】な様子で、落ち着いて過ごすことができました。`,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const text = response.choices[0].message.content?.trim() ?? "";
    return Response.json({ text });
  } catch (err) {
    console.error("OpenAI error:", err);
    const message = err instanceof Error ? err.message : String(err);
    // 401: キー無効、429: 残高不足・制限超過
    if (message.includes("401") || message.includes("Incorrect API key")) {
      return Response.json({ error: "APIキーが無効です。Vercelの環境変数を更新してRedeployしてください。" }, { status: 500 });
    }
    if (message.includes("429") || message.includes("quota")) {
      return Response.json({ error: "OpenAIの利用上限に達しました。プランまたは残高を確認してください。" }, { status: 500 });
    }
    return Response.json({ error: `生成エラー: ${message}` }, { status: 500 });
  }
}
