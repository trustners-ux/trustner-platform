import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import type { FinancialPlanningData } from '@/types/financial-planning';
import {
  calculateFinancialHealthScore,
  calculateNetWorth,
  calculateRetirementGap,
  generateTeaserData,
  generateFullReport,
} from '@/lib/utils/financial-planning-calc';

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-in-production');

export async function POST(request: Request) {
  try {
    // Verify session token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      try {
        await jwtVerify(token, getSecret());
      } catch {
        // In development, allow without valid token
        if (process.env.NODE_ENV !== 'development') {
          return NextResponse.json({ error: 'Session expired. Please start over.' }, { status: 401 });
        }
      }
    }

    const body = await request.json();
    const data = body.data as FinancialPlanningData;

    if (!data || !data.personalProfile?.fullName) {
      return NextResponse.json({ error: 'Invalid questionnaire data' }, { status: 400 });
    }

    // Run all calculations
    const score = calculateFinancialHealthScore(data);
    const netWorth = calculateNetWorth(data);
    const retirementGap = calculateRetirementGap(data);

    // Generate full report (minus Claude narrative)
    const report = generateFullReport(data);

    // Generate teaser data for the client
    const teaser = generateTeaserData(data, { ...report, claudeNarrative: '' });

    // Store lead via existing leads system
    try {
      const leadPayload = {
        name: data.personalProfile.fullName,
        phone: data.personalProfile.phone,
        email: data.personalProfile.email,
        goal: 'Financial Planning',
        source: 'financial-planning',
        riskProfile: data.riskProfile.riskCategory,
        riskScore: data.riskProfile.riskScore,
        step: 'completed',
        status: 'new',
        metadata: {
          score: score.totalScore,
          grade: score.grade,
          netWorth: netWorth.netWorth,
          age: data.personalProfile.age,
          city: data.personalProfile.city === 'other'
            ? (data.personalProfile.otherCity || 'Other')
            : (data.personalProfile.city || '-'),
        },
      };

      // Call internal lead API
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

      await fetch(`${baseUrl}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload),
      }).catch(() => {
        // Don't block if lead capture fails
        console.error('Lead capture failed, continuing...');
      });
    } catch {
      // Non-critical: don't fail the submission if lead capture errors
      console.error('Lead capture error');
    }

    // Fire-and-forget: trigger full report generation (Claude AI + PDF + email)
    try {
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

      fetch(`${baseUrl}/api/financial-planning/generate-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          userName: data.personalProfile.fullName,
          userEmail: data.personalProfile.email,
        }),
      }).catch((err) => {
        console.error('[FP] Report generation trigger failed:', err);
      });
    } catch {
      console.error('[FP] Failed to trigger report generation');
    }

    return NextResponse.json({
      success: true,
      teaser,
      userName: data.personalProfile.fullName,
      userEmail: data.personalProfile.email,
    });
  } catch (error) {
    console.error('Financial planning submit error:', error);
    return NextResponse.json(
      { error: 'Failed to process your assessment. Please try again.' },
      { status: 500 }
    );
  }
}
