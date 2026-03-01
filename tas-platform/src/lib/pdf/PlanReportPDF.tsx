import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type {
  FinancialPlan,
  FinancialGoal,
  ActionItem,
} from '@/types/financial-plan'

// ─── Helpers ────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#059669'
  if (score >= 60) return '#F59E0B'
  if (score >= 40) return '#F97316'
  return '#DC2626'
}

function getGoalStatusLabel(goal: FinancialGoal): string {
  const ratio = goal.currentAllocation / goal.inflatedTarget
  if (ratio >= 0.7) return 'feasible'
  if (ratio >= 0.4) return 'stretch'
  return 'needs_attention'
}

function getGoalStatusColor(goal: FinancialGoal): string {
  const status = getGoalStatusLabel(goal)
  if (status === 'feasible') return '#059669'
  if (status === 'stretch') return '#F59E0B'
  return '#DC2626'
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '#DC2626'
    case 'high':
      return '#F97316'
    case 'medium':
      return '#F59E0B'
    case 'low':
      return '#6B7280'
    default:
      return '#6B7280'
  }
}

function getSummaryParagraph(score: number): string {
  if (score >= 80) {
    return 'Excellent! Your financial health is strong. You have a well-structured plan with adequate emergency reserves, insurance coverage, and disciplined investment habits. Continue on this path and fine-tune your strategy for optimal tax efficiency and goal achievement.'
  }
  if (score >= 60) {
    return 'Good progress! Your financial foundation is solid but there are meaningful areas for improvement. Focus on the action items highlighted in this report to close insurance gaps, optimise your tax strategy, and accelerate progress toward your financial goals.'
  }
  if (score >= 40) {
    return 'Your financial plan needs attention in several key areas. Prioritise building an adequate emergency fund, closing insurance gaps, and creating a structured investment plan. The action items in this report will guide you toward a stronger financial position.'
  }
  return 'Your financial health requires urgent attention. Critical gaps exist in emergency preparedness, insurance coverage, and investment planning. Please review the action items carefully and consider scheduling a consultation to create a structured improvement plan.'
}

// ─── Styles ─────────────────────────────────────────────────

const colors = {
  primary: '#0A1628',
  positive: '#059669',
  negative: '#DC2626',
  accent: '#F59E0B',
  blue: '#1E40AF',
  violet: '#7C3AED',
  gray: '#6B7280',
  lightBg: '#F9FAFB',
  white: '#FFFFFF',
  border: '#E5E7EB',
  darkGray: '#374151',
}

const styles = StyleSheet.create({
  // ── Page & Layout ──
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: colors.primary,
    lineHeight: 1.5,
  },
  coverPage: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: colors.primary,
  },

  // ── Footer ──
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: colors.gray,
  },

  // ── Cover Page ──
  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 60,
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    letterSpacing: 6,
    marginBottom: 8,
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 40,
    letterSpacing: 2,
  },
  coverDivider: {
    width: 60,
    height: 3,
    backgroundColor: colors.accent,
    marginBottom: 40,
  },
  coverPreparedFor: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  coverName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    marginBottom: 8,
  },
  coverDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 60,
  },
  coverCompany: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 4,
  },
  coverRegulatory: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 2,
  },

  // ── Section Headers ──
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 4,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: colors.blue,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.darkGray,
    marginTop: 16,
    marginBottom: 8,
  },

  // ── Tables ──
  tableContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.lightBg,
  },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.lightBg,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
  },
  tableTotalText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  tableCell: {
    fontSize: 10,
    color: colors.primary,
  },
  tableCellRight: {
    fontSize: 10,
    color: colors.primary,
    textAlign: 'right',
  },

  // ── Score Cards ──
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 12,
    gap: 8,
  },
  scoreCard: {
    width: '31%',
    padding: 10,
    borderRadius: 4,
    backgroundColor: colors.lightBg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 8,
    color: colors.gray,
    textAlign: 'center',
  },
  overallScoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.lightBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overallScoreValue: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
  },
  overallScoreLabel: {
    fontSize: 11,
    color: colors.gray,
    marginTop: 2,
  },

  // ── Key Metrics Row ──
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  metricBox: {
    width: '23%',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 8,
    color: colors.gray,
    textAlign: 'center',
  },

  // ── Insurance Gap ──
  gapSection: {
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gapLabel: {
    fontSize: 10,
    color: colors.gray,
  },
  gapValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  gapValueRed: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.negative,
  },

  // ── Action Items ──
  actionItem: {
    flexDirection: 'row',
    marginBottom: 10,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.lightBg,
  },
  actionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionNumberText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },
  actionContent: {
    flex: 1,
  },
  actionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 6,
  },
  priorityBadgeText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
    textTransform: 'uppercase',
  },
  actionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  actionDescription: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.4,
  },

  // ── Summary & Body ──
  bodyText: {
    fontSize: 11,
    color: colors.primary,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  boldText: {
    fontFamily: 'Helvetica-Bold',
  },

  // ── Disclaimer ──
  disclaimerTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  disclaimerSection: {
    marginBottom: 14,
  },
  disclaimerHeading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 9,
    color: colors.gray,
    lineHeight: 1.6,
  },

  // ── Allocation Table ──
  allocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  allocationLabel: {
    fontSize: 10,
    color: colors.primary,
  },
  allocationValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },

  // ── Net Worth Highlight ──
  netWorthHighlight: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginTop: 12,
  },
  netWorthLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },
  netWorthValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.white,
  },

  // ── Surplus Row ──
  surplusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: colors.lightBg,
    borderRadius: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  surplusLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  surplusValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },

  // ── Tax Comparison ──
  taxCompareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  taxCompareBox: {
    width: '40%',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  taxCompareLabel: {
    fontSize: 9,
    color: colors.gray,
    marginBottom: 4,
  },
  taxCompareValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
  },
  taxRecommendedBorder: {
    borderColor: colors.positive,
    borderWidth: 2,
  },
})

// ─── Page Footer Component ──────────────────────────────────

function PageFooter({ pageNumber }: { pageNumber: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        Trustner Asset Services Pvt. Ltd. | AMFI ARN-286886
      </Text>
      <Text style={styles.footerText}>Page {pageNumber}</Text>
    </View>
  )
}

// ─── Cover Page ─────────────────────────────────────────────

function CoverPage({ plan }: { plan: FinancialPlan }) {
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverContainer}>
        <Text style={styles.coverTitle}>FINANCIAL PLAN</Text>
        <Text style={styles.coverSubtitle}>COMPREHENSIVE REPORT</Text>
        <View style={styles.coverDivider} />
        <Text style={styles.coverPreparedFor}>Prepared for</Text>
        <Text style={styles.coverName}>{plan.personal.name}</Text>
        <Text style={styles.coverDate}>{formatDate(plan.createdAt)}</Text>
        <Text style={styles.coverCompany}>
          Prepared by: Trustner Asset Services Pvt. Ltd.
        </Text>
        <Text style={styles.coverRegulatory}>
          AMFI ARN-286886 | IRDAI License 1067
        </Text>
        <Text style={styles.coverRegulatory}>
          www.wealthyhub.in | wecare@wealthyhub.in
        </Text>
      </View>
    </Page>
  )
}

// ─── Executive Summary ──────────────────────────────────────

function ExecutiveSummaryPage({ plan }: { plan: FinancialPlan }) {
  const { analysis, expenses, netWorth } = plan
  const scores = [
    { label: 'Emergency Fund', value: analysis.emergencyFundScore },
    { label: 'Insurance', value: analysis.insuranceScore },
    { label: 'Investment', value: analysis.investmentScore },
    { label: 'Debt Management', value: analysis.debtScore },
    { label: 'Retirement', value: analysis.retirementScore },
    { label: 'Tax Efficiency', value: analysis.taxEfficiencyScore },
  ]

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Executive Summary</Text>

      {/* Overall Score */}
      <View style={styles.overallScoreContainer}>
        <Text
          style={[
            styles.overallScoreValue,
            { color: getScoreColor(analysis.overallScore) },
          ]}
        >
          {analysis.overallScore}
        </Text>
        <Text style={styles.overallScoreLabel}>
          Overall Financial Health Score (out of 100)
        </Text>
      </View>

      {/* Sub-scores Grid */}
      <View style={styles.scoreGrid}>
        {scores.map((s) => (
          <View key={s.label} style={styles.scoreCard}>
            <Text style={[styles.scoreValue, { color: getScoreColor(s.value) }]}>
              {s.value}
            </Text>
            <Text style={styles.scoreLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Key Metrics */}
      <Text style={styles.sectionSubtitle}>Key Metrics</Text>
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>{formatINR(netWorth.netWorth)}</Text>
          <Text style={styles.metricLabel}>Net Worth</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>
            {formatINR(expenses.monthlySurplus)}
          </Text>
          <Text style={styles.metricLabel}>Monthly Surplus</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>
            {expenses.savingsRate.toFixed(1)}%
          </Text>
          <Text style={styles.metricLabel}>Savings Rate</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricValue}>
            {analysis.debtToIncomeRatio.toFixed(1)}%
          </Text>
          <Text style={styles.metricLabel}>Debt-to-Income</Text>
        </View>
      </View>

      {/* Summary Paragraph */}
      <Text style={styles.bodyText}>
        {getSummaryParagraph(analysis.overallScore)}
      </Text>

      <PageFooter pageNumber={2} />
    </Page>
  )
}

// ─── Net Worth Statement ────────────────────────────────────

function NetWorthPage({ plan }: { plan: FinancialPlan }) {
  const { netWorth } = plan

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Net Worth Statement</Text>

      {/* Assets Table */}
      <Text style={styles.sectionSubtitle}>Assets</Text>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '25%' }]}>
            Category
          </Text>
          <Text style={[styles.tableHeaderText, { width: '45%' }]}>Name</Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '30%', textAlign: 'right' },
            ]}
          >
            Value
          </Text>
        </View>
        {netWorth.assets.map((asset, idx) => (
          <View
            key={asset.id}
            style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.tableCell, { width: '25%' }]}>
              {asset.category}
            </Text>
            <Text style={[styles.tableCell, { width: '45%' }]}>
              {asset.name}
            </Text>
            <Text style={[styles.tableCellRight, { width: '30%' }]}>
              {formatINR(asset.currentValue)}
            </Text>
          </View>
        ))}
        <View style={styles.tableTotalRow}>
          <Text style={[styles.tableTotalText, { width: '70%' }]}>
            Total Assets
          </Text>
          <Text
            style={[styles.tableTotalText, { width: '30%', textAlign: 'right' }]}
          >
            {formatINR(netWorth.totalAssets)}
          </Text>
        </View>
      </View>

      {/* Liabilities Table */}
      <Text style={styles.sectionSubtitle}>Liabilities</Text>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '20%' }]}>Type</Text>
          <Text style={[styles.tableHeaderText, { width: '30%' }]}>Name</Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '25%', textAlign: 'right' },
            ]}
          >
            Outstanding
          </Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '25%', textAlign: 'right' },
            ]}
          >
            EMI
          </Text>
        </View>
        {netWorth.liabilities.map((liability, idx) => (
          <View
            key={liability.id}
            style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.tableCell, { width: '20%' }]}>
              {liability.type}
            </Text>
            <Text style={[styles.tableCell, { width: '30%' }]}>
              {liability.name}
            </Text>
            <Text style={[styles.tableCellRight, { width: '25%' }]}>
              {formatINR(liability.outstandingAmount)}
            </Text>
            <Text style={[styles.tableCellRight, { width: '25%' }]}>
              {formatINR(liability.emi)}
            </Text>
          </View>
        ))}
        <View style={styles.tableTotalRow}>
          <Text style={[styles.tableTotalText, { width: '50%' }]}>
            Total Liabilities
          </Text>
          <Text
            style={[styles.tableTotalText, { width: '25%', textAlign: 'right' }]}
          >
            {formatINR(netWorth.totalLiabilities)}
          </Text>
          <Text
            style={[styles.tableTotalText, { width: '25%', textAlign: 'right' }]}
          >
            {formatINR(
              netWorth.liabilities.reduce((sum, l) => sum + l.emi, 0)
            )}
          </Text>
        </View>
      </View>

      {/* Net Worth Highlight */}
      <View style={styles.netWorthHighlight}>
        <Text style={styles.netWorthLabel}>NET WORTH</Text>
        <Text style={styles.netWorthValue}>
          {formatINR(netWorth.netWorth)}
        </Text>
      </View>

      {/* Liquid Assets Note */}
      <View style={styles.surplusRow}>
        <Text style={styles.surplusLabel}>Liquid Assets</Text>
        <Text style={[styles.surplusValue, { color: colors.blue }]}>
          {formatINR(netWorth.liquidAssets)}
        </Text>
      </View>

      <PageFooter pageNumber={3} />
    </Page>
  )
}

// ─── Cash Flow Analysis ─────────────────────────────────────

function CashFlowPage({ plan }: { plan: FinancialPlan }) {
  const { income, expenses } = plan

  const incomeItems = [
    { source: 'Monthly Salary', monthly: income.monthlySalary },
    { source: 'Bonus (Annualized)', monthly: income.bonusAnnual / 12 },
    { source: 'Rental Income', monthly: income.rentalIncome },
    { source: 'Business Income', monthly: income.businessIncome },
    { source: 'Other Income', monthly: income.otherIncome },
  ].filter((item) => item.monthly > 0)

  const expenseItems = [
    { category: 'Housing / Rent', monthly: expenses.housing },
    { category: 'Utilities', monthly: expenses.utilities },
    { category: 'Groceries', monthly: expenses.groceries },
    { category: 'Transportation', monthly: expenses.transportation },
    { category: 'Education', monthly: expenses.education },
    { category: 'Healthcare', monthly: expenses.healthcare },
    { category: 'Entertainment', monthly: expenses.entertainment },
    { category: 'Personal Care', monthly: expenses.personalCare },
    { category: 'Insurance Premiums', monthly: expenses.insurance },
    { category: 'EMI Payments', monthly: expenses.emiPayments },
    { category: 'Domestic Help', monthly: expenses.domesticHelp },
    { category: 'Other Expenses', monthly: expenses.other },
  ].filter((item) => item.monthly > 0)

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Cash Flow Analysis</Text>

      {/* Income Table */}
      <Text style={styles.sectionSubtitle}>Income Breakdown</Text>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '40%' }]}>Source</Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '30%', textAlign: 'right' },
            ]}
          >
            Monthly
          </Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '30%', textAlign: 'right' },
            ]}
          >
            Annual
          </Text>
        </View>
        {incomeItems.map((item, idx) => (
          <View
            key={item.source}
            style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.tableCell, { width: '40%' }]}>
              {item.source}
            </Text>
            <Text style={[styles.tableCellRight, { width: '30%' }]}>
              {formatINR(item.monthly)}
            </Text>
            <Text style={[styles.tableCellRight, { width: '30%' }]}>
              {formatINR(item.monthly * 12)}
            </Text>
          </View>
        ))}
        <View style={styles.tableTotalRow}>
          <Text style={[styles.tableTotalText, { width: '40%' }]}>
            Total Income
          </Text>
          <Text
            style={[styles.tableTotalText, { width: '30%', textAlign: 'right' }]}
          >
            {formatINR(income.totalMonthlyIncome)}
          </Text>
          <Text
            style={[styles.tableTotalText, { width: '30%', textAlign: 'right' }]}
          >
            {formatINR(income.totalAnnualIncome)}
          </Text>
        </View>
      </View>

      {/* Expense Table */}
      <Text style={styles.sectionSubtitle}>Expense Breakdown</Text>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '40%' }]}>
            Category
          </Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '30%', textAlign: 'right' },
            ]}
          >
            Monthly
          </Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '30%', textAlign: 'right' },
            ]}
          >
            Annual
          </Text>
        </View>
        {expenseItems.map((item, idx) => (
          <View
            key={item.category}
            style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.tableCell, { width: '40%' }]}>
              {item.category}
            </Text>
            <Text style={[styles.tableCellRight, { width: '30%' }]}>
              {formatINR(item.monthly)}
            </Text>
            <Text style={[styles.tableCellRight, { width: '30%' }]}>
              {formatINR(item.monthly * 12)}
            </Text>
          </View>
        ))}
        <View style={styles.tableTotalRow}>
          <Text style={[styles.tableTotalText, { width: '40%' }]}>
            Total Expenses
          </Text>
          <Text
            style={[styles.tableTotalText, { width: '30%', textAlign: 'right' }]}
          >
            {formatINR(expenses.totalMonthlyExpenses)}
          </Text>
          <Text
            style={[styles.tableTotalText, { width: '30%', textAlign: 'right' }]}
          >
            {formatINR(expenses.totalMonthlyExpenses * 12)}
          </Text>
        </View>
      </View>

      {/* Surplus / Deficit */}
      <View style={styles.surplusRow}>
        <Text style={styles.surplusLabel}>
          Monthly {expenses.monthlySurplus >= 0 ? 'Surplus' : 'Deficit'}
        </Text>
        <Text
          style={[
            styles.surplusValue,
            {
              color:
                expenses.monthlySurplus >= 0
                  ? colors.positive
                  : colors.negative,
            },
          ]}
        >
          {formatINR(expenses.monthlySurplus)}
        </Text>
      </View>

      <View style={styles.surplusRow}>
        <Text style={styles.surplusLabel}>Savings Rate</Text>
        <Text
          style={[
            styles.surplusValue,
            {
              color:
                expenses.savingsRate >= 20 ? colors.positive : colors.accent,
            },
          ]}
        >
          {expenses.savingsRate.toFixed(1)}%
        </Text>
      </View>

      <PageFooter pageNumber={4} />
    </Page>
  )
}

// ─── Insurance Gap Analysis ─────────────────────────────────

function InsuranceGapPage({ plan }: { plan: FinancialPlan }) {
  const { insurance, analysis } = plan

  const totalHealthCover = insurance.healthPolicies.reduce(
    (sum, p) => sum + p.sumInsured,
    0
  )
  const totalTermCover = insurance.termPolicies.reduce(
    (sum, p) => sum + p.sumAssured,
    0
  )

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Insurance Gap Analysis</Text>

      {/* Term Life Insurance */}
      <Text style={styles.sectionSubtitle}>Term Life Insurance</Text>
      <View style={styles.gapSection}>
        <View style={styles.gapRow}>
          <Text style={styles.gapLabel}>Current Cover</Text>
          <Text style={styles.gapValue}>{formatINR(totalTermCover)}</Text>
        </View>
        <View style={styles.gapRow}>
          <Text style={styles.gapLabel}>Recommended Cover</Text>
          <Text style={styles.gapValue}>
            {formatINR(analysis.recommendedTermCover)}
          </Text>
        </View>
        <View style={styles.gapRow}>
          <Text style={styles.gapLabel}>Gap</Text>
          <Text
            style={
              analysis.termInsuranceGap > 0
                ? styles.gapValueRed
                : styles.gapValue
            }
          >
            {analysis.termInsuranceGap > 0
              ? formatINR(analysis.termInsuranceGap)
              : 'Adequately covered'}
          </Text>
        </View>
      </View>

      {insurance.termPolicies.length > 0 && (
        <>
          <Text style={styles.sectionSubtitle}>Existing Term Policies</Text>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '30%' }]}>
                Insurer
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: '25%', textAlign: 'right' },
                ]}
              >
                Sum Assured
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: '25%', textAlign: 'right' },
                ]}
              >
                Premium (p.a.)
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: '20%', textAlign: 'right' },
                ]}
              >
                Remaining Yrs
              </Text>
            </View>
            {insurance.termPolicies.map((policy, idx) => (
              <View
                key={policy.id}
                style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableCell, { width: '30%' }]}>
                  {policy.insurer}
                </Text>
                <Text style={[styles.tableCellRight, { width: '25%' }]}>
                  {formatINR(policy.sumAssured)}
                </Text>
                <Text style={[styles.tableCellRight, { width: '25%' }]}>
                  {formatINR(policy.annualPremium)}
                </Text>
                <Text style={[styles.tableCellRight, { width: '20%' }]}>
                  {policy.remainingYears}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Health Insurance */}
      <Text style={styles.sectionSubtitle}>Health Insurance</Text>
      <View style={styles.gapSection}>
        <View style={styles.gapRow}>
          <Text style={styles.gapLabel}>Current Cover</Text>
          <Text style={styles.gapValue}>{formatINR(totalHealthCover)}</Text>
        </View>
        <View style={styles.gapRow}>
          <Text style={styles.gapLabel}>Recommended Cover</Text>
          <Text style={styles.gapValue}>
            {formatINR(analysis.recommendedHealthCover)}
          </Text>
        </View>
        <View style={styles.gapRow}>
          <Text style={styles.gapLabel}>Gap</Text>
          <Text
            style={
              analysis.healthInsuranceGap > 0
                ? styles.gapValueRed
                : styles.gapValue
            }
          >
            {analysis.healthInsuranceGap > 0
              ? formatINR(analysis.healthInsuranceGap)
              : 'Adequately covered'}
          </Text>
        </View>
      </View>

      {insurance.healthPolicies.length > 0 && (
        <>
          <Text style={styles.sectionSubtitle}>Existing Health Policies</Text>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '25%' }]}>
                Insurer
              </Text>
              <Text style={[styles.tableHeaderText, { width: '20%' }]}>
                Type
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: '25%', textAlign: 'right' },
                ]}
              >
                Sum Insured
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: '15%', textAlign: 'right' },
                ]}
              >
                Premium
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: '15%', textAlign: 'right' },
                ]}
              >
                Members
              </Text>
            </View>
            {insurance.healthPolicies.map((policy, idx) => (
              <View
                key={policy.id}
                style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableCell, { width: '25%' }]}>
                  {policy.insurer}
                </Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>
                  {policy.type}
                </Text>
                <Text style={[styles.tableCellRight, { width: '25%' }]}>
                  {formatINR(policy.sumInsured)}
                </Text>
                <Text style={[styles.tableCellRight, { width: '15%' }]}>
                  {formatINR(policy.annualPremium)}
                </Text>
                <Text style={[styles.tableCellRight, { width: '15%' }]}>
                  {policy.coveredMembers}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <PageFooter pageNumber={5} />
    </Page>
  )
}

// ─── Goal-wise Investment Plan ──────────────────────────────

function GoalPlanPage({ plan }: { plan: FinancialPlan }) {
  const { goals } = plan
  const totalSIP = goals.reduce((sum, g) => sum + g.recommendedSIP, 0)

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Goal-wise Investment Plan</Text>

      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { width: '20%' }]}>Goal</Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '10%', textAlign: 'right' },
            ]}
          >
            Target Yr
          </Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '17%', textAlign: 'right' },
            ]}
          >
            Current
          </Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '18%', textAlign: 'right' },
            ]}
          >
            Infl. Adjusted
          </Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '17%', textAlign: 'right' },
            ]}
          >
            Monthly SIP
          </Text>
          <Text
            style={[
              styles.tableHeaderText,
              { width: '18%', textAlign: 'center' },
            ]}
          >
            Status
          </Text>
        </View>
        {goals.map((goal, idx) => (
          <View
            key={goal.id}
            style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
          >
            <Text style={[styles.tableCell, { width: '20%' }]}>
              {goal.name}
            </Text>
            <Text style={[styles.tableCellRight, { width: '10%' }]}>
              {goal.targetYear}
            </Text>
            <Text style={[styles.tableCellRight, { width: '17%' }]}>
              {formatINR(goal.currentAllocation)}
            </Text>
            <Text style={[styles.tableCellRight, { width: '18%' }]}>
              {formatINR(goal.inflatedTarget)}
            </Text>
            <Text style={[styles.tableCellRight, { width: '17%' }]}>
              {formatINR(goal.recommendedSIP)}
            </Text>
            <View
              style={{
                width: '18%',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  fontFamily: 'Helvetica-Bold',
                  color: getGoalStatusColor(goal),
                  textTransform: 'uppercase',
                }}
              >
                {getGoalStatusLabel(goal)}
              </Text>
            </View>
          </View>
        ))}
        <View style={styles.tableTotalRow}>
          <Text style={[styles.tableTotalText, { width: '65%' }]}>
            Total SIP Required
          </Text>
          <Text
            style={[
              styles.tableTotalText,
              { width: '17%', textAlign: 'right' },
            ]}
          >
            {formatINR(totalSIP)}
          </Text>
          <Text style={{ width: '18%' }} />
        </View>
      </View>

      {/* Goal details */}
      {goals.map((goal) => (
        <View key={goal.id} style={{ marginBottom: 8 }}>
          <View style={styles.gapSection}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'Helvetica-Bold',
                color: colors.primary,
                marginBottom: 4,
              }}
            >
              {goal.name}
            </Text>
            <View style={styles.gapRow}>
              <Text style={styles.gapLabel}>Target Amount</Text>
              <Text style={styles.gapValue}>
                {formatINR(goal.targetAmount)}
              </Text>
            </View>
            <View style={styles.gapRow}>
              <Text style={styles.gapLabel}>
                Inflation-Adjusted ({goal.inflationRate}% p.a.)
              </Text>
              <Text style={styles.gapValue}>
                {formatINR(goal.inflatedTarget)}
              </Text>
            </View>
            <View style={styles.gapRow}>
              <Text style={styles.gapLabel}>Currently Allocated</Text>
              <Text style={styles.gapValue}>
                {formatINR(goal.currentAllocation)}
              </Text>
            </View>
            <View style={styles.gapRow}>
              <Text style={styles.gapLabel}>Recommended Allocation</Text>
              <Text style={styles.gapValue}>{goal.recommendedAllocation}</Text>
            </View>
            <View style={styles.gapRow}>
              <Text style={styles.gapLabel}>Priority</Text>
              <Text style={styles.gapValue}>{goal.priority}</Text>
            </View>
          </View>
        </View>
      ))}

      <PageFooter pageNumber={6} />
    </Page>
  )
}

// ─── Tax Optimization ───────────────────────────────────────

function TaxOptimizationPage({ plan }: { plan: FinancialPlan }) {
  const { tax, analysis } = plan

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Tax Optimization</Text>

      {/* Current vs Recommended Regime */}
      <View style={{ marginTop: 8, marginBottom: 12 }}>
        <View style={styles.gapRow}>
          <Text style={styles.gapLabel}>Current Tax Regime</Text>
          <Text style={styles.gapValue}>
            {tax.regime === 'old' ? 'Old Regime' : 'New Regime'}
          </Text>
        </View>
        <View style={styles.gapRow}>
          <Text style={styles.gapLabel}>Recommended Regime</Text>
          <Text
            style={[styles.gapValue, { color: colors.positive }]}
          >
            {analysis.recommendedRegime === 'old'
              ? 'Old Regime'
              : 'New Regime'}
          </Text>
        </View>
      </View>

      {/* Tax Comparison */}
      <Text style={styles.sectionSubtitle}>Tax Comparison</Text>
      <View style={styles.taxCompareRow}>
        <View
          style={[
            styles.taxCompareBox,
            analysis.recommendedRegime === 'old' ? styles.taxRecommendedBorder : {},
          ]}
        >
          <Text style={styles.taxCompareLabel}>Old Regime</Text>
          <Text style={styles.taxCompareValue}>
            {formatINR(
              tax.regime === 'old' ? tax.taxPayable : tax.taxPayable + analysis.potentialTaxSavings
            )}
          </Text>
          {analysis.recommendedRegime === 'old' && (
            <Text
              style={{
                fontSize: 8,
                color: colors.positive,
                marginTop: 4,
                fontFamily: 'Helvetica-Bold',
              }}
            >
              RECOMMENDED
            </Text>
          )}
        </View>
        <View
          style={[
            styles.taxCompareBox,
            analysis.recommendedRegime === 'new' ? styles.taxRecommendedBorder : {},
          ]}
        >
          <Text style={styles.taxCompareLabel}>New Regime</Text>
          <Text style={styles.taxCompareValue}>
            {formatINR(
              tax.regime === 'new' ? tax.taxPayable : tax.taxPayable + analysis.potentialTaxSavings
            )}
          </Text>
          {analysis.recommendedRegime === 'new' && (
            <Text
              style={{
                fontSize: 8,
                color: colors.positive,
                marginTop: 4,
                fontFamily: 'Helvetica-Bold',
              }}
            >
              RECOMMENDED
            </Text>
          )}
        </View>
      </View>

      {/* Potential Savings */}
      <View style={styles.surplusRow}>
        <Text style={styles.surplusLabel}>Potential Tax Savings</Text>
        <Text style={[styles.surplusValue, { color: colors.positive }]}>
          {formatINR(analysis.potentialTaxSavings)}
        </Text>
      </View>

      {/* Tax Opportunities Table */}
      {analysis.taxOpportunities.length > 0 && (
        <>
          <Text style={styles.sectionSubtitle}>Tax-Saving Opportunities</Text>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '18%' }]}>
                Section
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: '16%', textAlign: 'right' },
                ]}
              >
                Limit
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: '16%', textAlign: 'right' },
                ]}
              >
                Used
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: '16%', textAlign: 'right' },
                ]}
              >
                Unused
              </Text>
              <Text style={[styles.tableHeaderText, { width: '34%' }]}>
                Recommendation
              </Text>
            </View>
            {analysis.taxOpportunities.map((opp, idx) => (
              <View
                key={opp.section}
                style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableCell, { width: '18%' }]}>
                  {opp.section}
                </Text>
                <Text style={[styles.tableCellRight, { width: '16%' }]}>
                  {formatINR(opp.maxLimit)}
                </Text>
                <Text style={[styles.tableCellRight, { width: '16%' }]}>
                  {formatINR(opp.currentUsage)}
                </Text>
                <Text
                  style={[
                    styles.tableCellRight,
                    {
                      width: '16%',
                      color:
                        opp.unusedLimit > 0 ? colors.negative : colors.positive,
                    },
                  ]}
                >
                  {formatINR(opp.unusedLimit)}
                </Text>
                <Text
                  style={[
                    styles.tableCell,
                    { width: '34%', fontSize: 8, color: colors.gray },
                  ]}
                >
                  {opp.suggestedProduct}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <PageFooter pageNumber={7} />
    </Page>
  )
}

// ─── Asset Allocation ───────────────────────────────────────

function AssetAllocationPage({ plan }: { plan: FinancialPlan }) {
  const { analysis } = plan

  const currentItems = [
    { label: 'Equity', value: analysis.currentAllocation.equity },
    { label: 'Debt', value: analysis.currentAllocation.debt },
    { label: 'Gold', value: analysis.currentAllocation.gold },
    { label: 'Cash', value: analysis.currentAllocation.cash },
    { label: 'Real Estate', value: analysis.currentAllocation.realEstate },
  ]

  const recommendedItems = [
    { label: 'Equity', value: analysis.recommendedAllocation.equity },
    { label: 'Debt', value: analysis.recommendedAllocation.debt },
    { label: 'Gold', value: analysis.recommendedAllocation.gold },
    { label: 'Cash', value: analysis.recommendedAllocation.cash },
  ]

  // Calculate rebalancing actions
  const rebalancingActions: { from: string; to: string; pct: number }[] = []
  const diff = {
    equity:
      analysis.recommendedAllocation.equity -
      analysis.currentAllocation.equity,
    debt:
      analysis.recommendedAllocation.debt - analysis.currentAllocation.debt,
    gold:
      analysis.recommendedAllocation.gold - analysis.currentAllocation.gold,
    cash:
      analysis.recommendedAllocation.cash - analysis.currentAllocation.cash,
  }

  const overAllocated = Object.entries(diff)
    .filter(([, v]) => v < 0)
    .map(([k, v]) => ({ asset: k, pct: Math.abs(v) }))
  const underAllocated = Object.entries(diff)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ asset: k, pct: v }))

  for (const over of overAllocated) {
    for (const under of underAllocated) {
      if (over.pct > 0 && under.pct > 0) {
        const moveAmount = Math.min(over.pct, under.pct)
        if (moveAmount >= 1) {
          rebalancingActions.push({
            from: over.asset.charAt(0).toUpperCase() + over.asset.slice(1),
            to: under.asset.charAt(0).toUpperCase() + under.asset.slice(1),
            pct: Math.round(moveAmount),
          })
        }
        over.pct -= moveAmount
        under.pct -= moveAmount
      }
    }
  }

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Asset Allocation</Text>

      {/* Current Allocation */}
      <Text style={styles.sectionSubtitle}>Current Allocation</Text>
      <View style={styles.tableContainer}>
        {currentItems.map((item) => (
          <View key={item.label} style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>{item.label}</Text>
            <Text style={styles.allocationValue}>{item.value.toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      {/* Recommended Allocation */}
      <Text style={styles.sectionSubtitle}>Recommended Allocation</Text>
      <View style={styles.tableContainer}>
        {recommendedItems.map((item) => (
          <View key={item.label} style={styles.allocationRow}>
            <Text style={styles.allocationLabel}>{item.label}</Text>
            <Text style={[styles.allocationValue, { color: colors.blue }]}>
              {item.value.toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>

      {/* Rebalancing Actions */}
      {rebalancingActions.length > 0 && (
        <>
          <Text style={styles.sectionSubtitle}>Rebalancing Actions</Text>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '35%' }]}>
                From
              </Text>
              <Text style={[styles.tableHeaderText, { width: '35%' }]}>
                To
              </Text>
              <Text
                style={[
                  styles.tableHeaderText,
                  { width: '30%', textAlign: 'right' },
                ]}
              >
                Shift (%)
              </Text>
            </View>
            {rebalancingActions.map((action, idx) => (
              <View
                key={`${action.from}-${action.to}`}
                style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
              >
                <Text style={[styles.tableCell, { width: '35%' }]}>
                  {action.from}
                </Text>
                <Text style={[styles.tableCell, { width: '35%' }]}>
                  {action.to}
                </Text>
                <Text style={[styles.tableCellRight, { width: '30%' }]}>
                  {action.pct}%
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <PageFooter pageNumber={8} />
    </Page>
  )
}

// ─── Action Plan ────────────────────────────────────────────

function ActionPlanPage({ plan }: { plan: FinancialPlan }) {
  const { analysis } = plan

  // Group by priority
  const priorityOrder: ActionItem['priority'][] = [
    'urgent',
    'high',
    'medium',
    'low',
  ]
  const sortedItems = [...analysis.actionItems].sort(
    (a, b) =>
      priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  )

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.sectionTitle}>Action Plan</Text>
      <Text style={[styles.bodyText, { marginTop: 8 }]}>
        The following action items are prioritised based on their potential
        impact on your financial health. Focus on urgent and high-priority items
        first.
      </Text>

      {sortedItems.map((item, idx) => (
        <View key={item.id} style={styles.actionItem} wrap={false}>
          <View style={styles.actionNumber}>
            <Text style={styles.actionNumberText}>{idx + 1}</Text>
          </View>
          <View style={styles.actionContent}>
            <View style={styles.actionTitleRow}>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityColor(item.priority) },
                ]}
              >
                <Text style={styles.priorityBadgeText}>{item.priority}</Text>
              </View>
              <Text style={styles.actionTitle}>{item.title}</Text>
            </View>
            <Text style={styles.actionDescription}>{item.description}</Text>
          </View>
        </View>
      ))}

      <PageFooter pageNumber={9} />
    </Page>
  )
}

// ─── Disclaimers Page ───────────────────────────────────────

function DisclaimersPage() {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.disclaimerTitle}>
        IMPORTANT DISCLAIMERS & DISCLOSURES
      </Text>

      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerHeading}>AMFI Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          Mutual Fund investments are subject to market risks. Read all
          scheme-related documents carefully before investing. Past performance
          is not indicative of future returns. The NAV of the units issued under
          the schemes may go up or down depending on the factors and forces
          affecting securities markets. Trustner Asset Services Pvt. Ltd. is a
          registered Mutual Fund Distributor with AMFI Registration Number
          ARN-286886.
        </Text>
      </View>

      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerHeading}>IRDAI Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          Trustner Insurance Brokers Pvt. Ltd. (License No. 1067) is a
          registered insurance broker. Insurance is the subject matter of
          solicitation. The recommendations made in this report are based on the
          information provided by the client and general market conditions. The
          actual policy terms, conditions, and premiums may vary. Please read
          the policy document carefully before subscribing.
        </Text>
      </View>

      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerHeading}>General Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          This report is for educational and illustrative purposes only and does
          not constitute personal financial advice. The projections and analyses
          contained herein are based on the information provided by the client
          and assumptions about future market conditions that may not
          materialise. Actual results may differ materially from the projections
          shown. Consult a qualified financial advisor before making any
          investment decisions.
        </Text>
      </View>

      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerHeading}>Privacy</Text>
        <Text style={styles.disclaimerText}>
          Your data is encrypted and stored securely. We do not share your
          personal or financial data with third parties without your explicit
          consent. Your data is used solely for the purpose of generating this
          financial plan and providing you with relevant financial
          recommendations.
        </Text>
      </View>

      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerHeading}>Regulatory Information</Text>
        <Text style={styles.disclaimerText}>
          Trustner Asset Services Pvt. Ltd. | AMFI ARN-286886 | CIN:
          U67100AS2023PTC023456 | Registered Office: Guwahati, Assam, India |
          Email: wecare@wealthyhub.in | Phone: +91-6003903737 |
          www.wealthyhub.in
        </Text>
      </View>

      <PageFooter pageNumber={10} />
    </Page>
  )
}

// ─── Main Document Component ────────────────────────────────

interface PlanReportPDFProps {
  plan: FinancialPlan
}

export default function PlanReportPDF({ plan }: PlanReportPDFProps) {
  return (
    <Document
      title={`Financial Plan — ${plan.personal.name}`}
      author="Trustner Asset Services Pvt. Ltd."
      subject="Comprehensive Financial Plan Report"
      creator="Trustner Financial Planner"
    >
      <CoverPage plan={plan} />
      <ExecutiveSummaryPage plan={plan} />
      <NetWorthPage plan={plan} />
      <CashFlowPage plan={plan} />
      <InsuranceGapPage plan={plan} />
      <GoalPlanPage plan={plan} />
      <TaxOptimizationPage plan={plan} />
      <AssetAllocationPage plan={plan} />
      <ActionPlanPage plan={plan} />
      <DisclaimersPage />
    </Document>
  )
}
