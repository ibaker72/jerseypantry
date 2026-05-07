// Telegram Bot client for OpenClaw notifications.
// Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your environment.
// Get a bot token from @BotFather on Telegram, then message your bot once
// and call https://api.telegram.org/bot<TOKEN>/getUpdates to find your chat_id.

const TELEGRAM_API = 'https://api.telegram.org'

export function isTelegramConfigured(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.log('[OpenClaw/Telegram] Not configured — skipping send.\n', text)
    return
  }

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[OpenClaw/Telegram] Send failed:', res.status, body)
  }
}

// Escape special Markdown characters for Telegram MarkdownV1
export function md(strings: TemplateStringsArray, ...values: (string | number)[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}
