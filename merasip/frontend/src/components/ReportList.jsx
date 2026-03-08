const TYPE_ICONS = {
  individual: { icon: 'U', label: 'Individual', color: '#0A7C4E' },
  family:     { icon: 'F', label: 'Family', color: '#1B3A6B' },
  rebalancing:{ icon: 'R', label: 'Rebalancing', color: '#92400E' },
  tax:        { icon: 'T', label: 'Tax', color: '#5B21B6' },
  onepager:   { icon: '1', label: 'One-Pager', color: '#2E5299' },
}

export default function ReportList({ reports = [], onDownload, onEmail, onWhatsApp }) {
  if (!reports.length) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: '#6B7280', fontSize: 13 }}>
        No reports generated yet.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {reports.map(report => {
        const t = TYPE_ICONS[report.type] || TYPE_ICONS.individual
        return (
          <div key={report.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: '#fff',
            border: '1px solid #D1D5DB', borderRadius: 8,
          }}>
            {/* Type badge */}
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: t.color + '15', color: t.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, flexShrink: 0,
            }}>
              {t.icon}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#111827' }}>
                {t.label} Report
              </div>
              <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>
                {report.created_at ? new Date(report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                {report.pages ? ` | ${report.pages} pages` : ''}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {report.pdf_url && onDownload && (
                <button onClick={() => onDownload(report)} style={btnStyle('#1B3A6B')}>
                  PDF
                </button>
              )}
              {onEmail && (
                <button onClick={() => onEmail(report)} style={btnStyle('#2E5299')}
                  title={report.sent_email ? 'Sent' : 'Send Email'}>
                  {report.sent_email ? 'Sent' : 'Email'}
                </button>
              )}
              {onWhatsApp && (
                <button onClick={() => onWhatsApp(report)} style={btnStyle('#0A7C4E')}
                  title={report.sent_whatsapp ? 'Sent' : 'Send WhatsApp'}>
                  {report.sent_whatsapp ? 'Sent' : 'WA'}
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const btnStyle = (color) => ({
  background: color, color: '#fff', border: 'none',
  borderRadius: 4, padding: '4px 10px', fontSize: 10,
  fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
})
