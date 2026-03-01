interface EmailTemplateParams {
  clientName: string
  overallScore: number
  planDate: string
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return '#059669'
  if (score >= 60) return '#F59E0B'
  if (score >= 40) return '#F97316'
  return '#DC2626'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Attention'
  return 'Critical'
}

export function buildReportEmailHTML(params: EmailTemplateParams): string {
  const { clientName, overallScore, planDate } = params
  const scoreColor = getScoreBarColor(overallScore)
  const scoreLabel = getScoreLabel(overallScore)
  const barWidth = Math.min(Math.max(overallScore, 0), 100)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Financial Plan Report</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #0A1628; padding: 32px 40px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <span style="font-size: 24px; font-weight: 700; color: #FFFFFF; letter-spacing: 4px;">TRUSTNER</span>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-top: 4px;">
                    <span style="font-size: 11px; color: #94A3B8; letter-spacing: 2px;">FINANCIAL PLANNING</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <p style="margin: 0; font-size: 16px; color: #0A1628; font-weight: 600;">Dear ${escapeHtml(clientName)},</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 16px 40px 0 40px;">
              <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.6;">
                Your comprehensive financial plan is ready! Please find your detailed report attached to this email.
              </p>
              <p style="margin: 12px 0 0 0; font-size: 14px; color: #374151; line-height: 1.6;">
                Report generated on <strong>${escapeHtml(planDate)}</strong>.
              </p>
            </td>
          </tr>

          <!-- Score Card -->
          <tr>
            <td style="padding: 24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px;">Financial Health Score</p>
                    <p style="margin: 0 0 12px 0; font-size: 36px; font-weight: 700; color: ${scoreColor};">${overallScore}<span style="font-size: 16px; color: #6B7280;">/100</span></p>
                    <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 600; color: ${scoreColor};">${scoreLabel}</p>
                    <!-- Score Bar -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 20px;">
                          <div style="background-color: #E5E7EB; border-radius: 4px; height: 8px; width: 100%;">
                            <div style="background-color: ${scoreColor}; border-radius: 4px; height: 8px; width: ${barWidth}%;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's Inside -->
          <tr>
            <td style="padding: 0 40px 24px 40px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #0A1628;">What's inside your report:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #374151; line-height: 1.5;">
                    &#8226;&nbsp;&nbsp;<strong>Net Worth Statement</strong> — Complete assets and liabilities breakdown
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #374151; line-height: 1.5;">
                    &#8226;&nbsp;&nbsp;<strong>Insurance Gap Analysis</strong> — Term life and health cover assessment
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #374151; line-height: 1.5;">
                    &#8226;&nbsp;&nbsp;<strong>Goal-wise Roadmap</strong> — SIP recommendations for each financial goal
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #374151; line-height: 1.5;">
                    &#8226;&nbsp;&nbsp;<strong>Tax Optimization</strong> — Regime comparison and saving opportunities
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 32px 40px; text-align: center;">
              <a href="https://wealthyhub.in/dashboard" target="_blank" style="display: inline-block; background-color: #1E40AF; color: #FFFFFF; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 32px; border-radius: 6px;">
                View Dashboard
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 0;" />
            </td>
          </tr>

          <!-- Need Guidance -->
          <tr>
            <td style="padding: 24px 40px;">
              <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #0A1628;">Need Guidance?</p>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #374151; line-height: 1.6;">
                Our advisors are here to help you implement your financial plan.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 16px;">
                    <a href="https://wa.me/916003903737?text=Hi%2C%20I%20need%20help%20with%20my%20financial%20plan" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-size: 13px; font-weight: 600; text-decoration: none; padding: 8px 20px; border-radius: 4px;">
                      WhatsApp Us
                    </a>
                  </td>
                  <td>
                    <a href="tel:+916003903737" style="display: inline-block; border: 1px solid #1E40AF; color: #1E40AF; font-size: 13px; font-weight: 600; text-decoration: none; padding: 8px 20px; border-radius: 4px;">
                      Call +91-6003903737
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F9FAFB; padding: 24px 40px; border-top: 1px solid #E5E7EB;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #374151;">Trustner Asset Services Pvt. Ltd.</p>
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: #6B7280;">AMFI ARN-286886 | IRDAI License 1067</p>
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: #6B7280;">
                      This is an automated email. For queries:
                      <a href="mailto:wecare@wealthyhub.in" style="color: #1E40AF; text-decoration: none;">wecare@wealthyhub.in</a> |
                      <a href="tel:+916003903737" style="color: #1E40AF; text-decoration: none;">+91-6003903737</a>
                    </p>
                    <p style="margin: 0; font-size: 10px; color: #9CA3AF; line-height: 1.5;">
                      Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Escape HTML special characters to prevent XSS in rendered email.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
