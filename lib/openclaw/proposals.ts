import { sendTelegramMessage } from './telegram'

export interface LeadForProposal {
  id: string
  business_name: string
  contact_name: string | null
  email: string
  business_type: string | null
  estimated_budget: string | null
  notes: string | null
  follow_up_count: number
}

// Sent via Telegram when a lead reaches "qualified" status
export async function sendCloseAssistAlert(lead: LeadForProposal): Promise<void> {
  const contactLabel = lead.contact_name ? ` (${lead.contact_name})` : ''
  const budgetLine = lead.estimated_budget ? `\n  Budget: ${lead.estimated_budget}` : ''
  const notesLine = lead.notes ? `\n  Notes: ${lead.notes}` : ''

  const message = [
    `🔔 *Close Assist — Lead Qualified!*`,
    '',
    `*${lead.business_name}*${contactLabel}`,
    `  Type: ${lead.business_type ?? 'Unknown'}`,
    `  Email: ${lead.email}`,
    `  Follow-ups sent: ${lead.follow_up_count}`,
    budgetLine,
    notesLine,
    '',
    `📋 *Suggested next step:* Send a proposal within 24h.`,
    `Draft below 👇`,
    '',
    draftProposal(lead),
  ]
    .filter((l) => l !== undefined)
    .join('\n')

  await sendTelegramMessage(message)
}

export function draftProposal(lead: LeadForProposal): string {
  const firstName = lead.contact_name?.split(' ')[0] ?? 'there'
  const businessType = lead.business_type ?? 'your office'

  return [
    `---`,
    `*Draft Proposal Email*`,
    `To: ${lead.email}`,
    `Subject: Office Snack & Drink Delivery for ${lead.business_name} — My Corner Store`,
    '',
    `Hi ${firstName},`,
    '',
    `Thanks for your interest in My Corner Store's Office Refill service. Based on what you shared about ${businessType}, here's a plan that could work well for your team:`,
    '',
    `*Starter Plan — $99/month*`,
    `• Weekly delivery of snacks, drinks & essentials`,
    `• Curated selection based on your team's preferences`,
    `• Free delivery to your door in North Jersey`,
    `• Dedicated account portal for reorders & invoices`,
    '',
    `*Standard Plan — $199/month*`,
    `• Everything in Starter`,
    `• Bi-weekly restocks + priority fulfillment`,
    `• Custom product catalog (you choose what's stocked)`,
    `• Net-30 billing available`,
    '',
    `I'd love to set up a quick 15-minute call to dial in exactly what your team needs.`,
    `You can also sign up directly at [your-site]/office-refill`,
    '',
    `Looking forward to keeping your team stocked,`,
    `[Your Name]`,
    `My Corner Store`,
    `---`,
  ].join('\n')
}
