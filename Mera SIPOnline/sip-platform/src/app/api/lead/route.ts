import { NextResponse } from 'next/server';
import { addLead, updateLeadByPhone } from '@/lib/admin/leads-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      goal,
      riskProfile,
      riskScore,
      riskAnswers,
      preferredCallTime,
      step,
      source = 'lead-modal',
    } = body;

    // For full submissions (step 4) or legacy submissions, name & phone are required
    // For partial saves (step < 4), we allow whatever data is available
    const isPartialSave = step && step < 4;

    if (!isPartialSave && (!name || !phone)) {
      return NextResponse.json(
        { success: false, message: 'Name and phone are required' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone && !/^\d{10}$/.test(cleanPhone)) {
        return NextResponse.json(
          { success: false, message: 'Please enter a valid 10-digit phone number' },
          { status: 400 }
        );
      }
    }

    // Build the lead data object — include only fields that are present
    const leadData: Record<string, unknown> = { source };
    if (name) leadData.name = name;
    if (phone) leadData.phone = phone.replace(/\D/g, '');
    if (email) leadData.email = email;
    if (goal) leadData.goal = goal;
    if (riskProfile) leadData.riskProfile = riskProfile;
    if (typeof riskScore === 'number') leadData.riskScore = riskScore;
    if (riskAnswers && Object.keys(riskAnswers).length > 0) leadData.riskAnswers = riskAnswers;
    if (preferredCallTime) leadData.preferredCallTime = preferredCallTime;
    if (typeof step === 'number') leadData.step = step;

    // Send notification email via Resend — only for complete submissions (step 4 or legacy)
    if (!isPartialSave) {
      const RESEND_API_KEY = process.env.RESEND_API_KEY;
      if (RESEND_API_KEY) {
        try {
          const riskInfo = riskProfile
            ? `<tr><td style="padding: 8px 0; color: #64748b;">Risk Profile:</td><td style="padding: 8px 0; font-weight: bold;">${riskProfile} (Score: ${riskScore ?? 'N/A'})</td></tr>`
            : '';
          const timeInfo = preferredCallTime
            ? `<tr><td style="padding: 8px 0; color: #64748b;">Preferred Time:</td><td style="padding: 8px 0;">${preferredCallTime}</td></tr>`
            : '';
          const riskDetail = riskAnswers
            ? `<tr><td style="padding: 8px 0; color: #64748b; vertical-align: top;">Risk Answers:</td><td style="padding: 8px 0; font-size: 12px;">${Object.entries(riskAnswers as Record<string, string>)
                .map(([k, v]) => `${k}: ${v}`)
                .join('<br/>')}</td></tr>`
            : '';

          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Mera SIP Online <leads@merasip.com>',
              to: 'wecare@merasip.com',
              subject: `New Lead: ${name} - ${goal || 'General Inquiry'}${riskProfile ? ` [${riskProfile}]` : ''}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: #0F766E; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="margin: 0;">New Lead from MeraSIP.com</h2>
                  </div>
                  <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: 0; border-radius: 0 0 8px 8px;">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr><td style="padding: 8px 0; color: #64748b; width: 140px;">Name:</td><td style="padding: 8px 0; font-weight: bold;">${name}</td></tr>
                      <tr><td style="padding: 8px 0; color: #64748b;">Phone:</td><td style="padding: 8px 0; font-weight: bold;">${phone}</td></tr>
                      ${email ? `<tr><td style="padding: 8px 0; color: #64748b;">Email:</td><td style="padding: 8px 0;">${email}</td></tr>` : ''}
                      <tr><td style="padding: 8px 0; color: #64748b;">Goal:</td><td style="padding: 8px 0;">${goal || 'Not specified'}</td></tr>
                      ${riskInfo}
                      ${timeInfo}
                      ${riskDetail}
                      <tr><td style="padding: 8px 0; color: #64748b;">Source:</td><td style="padding: 8px 0;">${source}</td></tr>
                      <tr><td style="padding: 8px 0; color: #64748b;">Time:</td><td style="padding: 8px 0;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
                    </table>
                  </div>
                </div>
              `,
            }),
          });
        } catch (emailErr) {
          console.error('Email send failed:', emailErr);
        }
      }
    }

    // Store or update lead in local JSON file
    try {
      const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

      // For partial saves, try to update existing lead by phone number
      if (isPartialSave && cleanPhone) {
        const updated = await updateLeadByPhone(cleanPhone, leadData);
        if (!updated) {
          // No existing lead found — create new one
          await addLead(leadData as Parameters<typeof addLead>[0]);
        }
      } else {
        await addLead(leadData as Parameters<typeof addLead>[0]);
      }
    } catch (storeErr) {
      console.error('Lead store failed:', storeErr);
    }

    console.log('Lead captured:', {
      ...leadData,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: isPartialSave ? 'Progress saved' : 'We will contact you shortly!',
    });
  } catch (err) {
    console.error('Lead capture error:', err);
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    );
  }
}
