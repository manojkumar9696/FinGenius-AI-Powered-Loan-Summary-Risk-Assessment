/**
 * PDF Underwriting Report Layout Service
 * Programmatically designs and draws modern, high-end credit assessment sheets utilizing PDFKit.
 * Streams generated binary data directly to the Express response channel to minimize RAM consumption.
 */
const PDFDocument = require('pdfkit');

/**
 * Programmatically draws a beautifully styled PDF Underwriting report.
 * @param {Object} res - Express HTTP Response Stream
 * @param {Object} applicant - Raw borrower database profile
 * @param {Object} assessment - Programmatic & AI underwriting results
 * @param {Object} fraudCheck - Automated KYC & duplicate flags results
 */
exports.generateUnderwritingPDF = (res, applicant, assessment, fraudCheck) => {
  // 1. Initialize A4 PDF document with consistent 50px margins
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // 2. Pipe the document output stream directly to the HTTP response
  doc.pipe(res);

  // --- Visual Design Palette Definitions ---
  const colors = {
    navyDark: '#0F172A',
    slateMed: '#475569',
    grayFill: '#F8FAFC',
    borderLight: '#E2E8F0',
    greenAlert: '#10B981',
    redAlert: '#EF4444',
    white: '#FFFFFF'
  };

  // ==========================================
  // PAGE 1: HEADER & FOUNDATION PROFILE STATS
  // ==========================================

  // --- Header Banner Band ---
  doc
    .rect(50, 45, 495, 60)
    .fill(colors.navyDark);

  doc
    .fillColor(colors.white)
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('AI-POWERED LOAN UNDERWRITING SUMMARY', 70, 58);

  doc
    .fillColor(colors.white)
    .fontSize(9)
    .font('Helvetica')
    .text(`APPLICATION ID: #${applicant.id}  |  STATUS: ${applicant.status.toUpperCase()}  |  DATE: ${new Date(applicant.created_at).toLocaleDateString()}`, 70, 83);

  // --- Section 1: Core Borrower Profile Grid ---
  doc
    .fillColor(colors.navyDark)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('1. BORROWER PROFILE DETAILS', 50, 125);

  doc
    .moveTo(50, 140)
    .lineTo(545, 140)
    .strokeColor(colors.borderLight)
    .lineWidth(1)
    .stroke();

  // Draw background box for Borrower info
  doc
    .rect(50, 150, 495, 130)
    .fill(colors.grayFill);

  // Left Column Details
  doc.fillColor(colors.slateMed).font('Helvetica-Bold').fontSize(9).text('Borrower Name:', 70, 165);
  doc.fillColor(colors.navyDark).font('Helvetica').fontSize(9).text(`${applicant.first_name} ${applicant.last_name}`, 160, 165);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Email Address:', 70, 185);
  doc.fillColor(colors.navyDark).font('Helvetica').text(applicant.email, 160, 185);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Phone Contact:', 70, 205);
  doc.fillColor(colors.navyDark).font('Helvetica').text(applicant.phone || 'N/A', 160, 205);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('PAN / Aadhaar ID:', 70, 225);
  doc.fillColor(colors.navyDark).font('Helvetica').text(applicant.ssn, 160, 225);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Date of Birth:', 70, 245);
  doc.fillColor(colors.navyDark).font('Helvetica').text(new Date(applicant.date_of_birth).toLocaleDateString(), 160, 245);

  // Right Column Details
  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Monthly Income:', 310, 165);
  doc.fillColor(colors.navyDark).font('Helvetica').text(`INR ${parseFloat(applicant.monthly_income).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 420, 165);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Monthly Debt:', 310, 185);
  doc.fillColor(colors.navyDark).font('Helvetica').text(`INR ${parseFloat(applicant.monthly_debt).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 420, 185);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Requested Loan:', 310, 205);
  doc.fillColor(colors.navyDark).font('Helvetica').text(`INR ${parseFloat(applicant.loan_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 420, 205);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Loan Purpose:', 310, 225);
  doc.fillColor(colors.navyDark).font('Helvetica').text(applicant.loan_purpose, 420, 225);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Loan Term:', 310, 245);
  doc.fillColor(colors.navyDark).font('Helvetica').text(`${applicant.loan_term_months} Months`, 420, 245);

  // --- Section 2: Programmatic Underwriting Metrics ---
  doc
    .fillColor(colors.navyDark)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('2. DETERMINISTIC RULES DECISION', 50, 305);

  doc
    .moveTo(50, 320)
    .lineTo(545, 320)
    .strokeColor(colors.borderLight)
    .stroke();

  // Programmatic assessment ratio panel box
  doc
    .rect(50, 330, 495, 80)
    .fill(colors.grayFill);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').fontSize(9).text('Debt-to-Income (DTI) Ratio:', 70, 345);
  doc.fillColor(colors.navyDark).font('Helvetica').fontSize(9).text(`${assessment.debt_to_income_ratio}%`, 210, 345);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Loan-to-Income (LTI) Ratio:', 70, 365);
  doc.fillColor(colors.navyDark).font('Helvetica').text(`${assessment.loan_to_income_ratio}`, 210, 365);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Eligibility Criteria:', 70, 385);
  doc.fillColor(assessment.eligibility_status === 'eligible' ? colors.greenAlert : colors.redAlert).font('Helvetica-Bold').text(assessment.eligibility_status.toUpperCase(), 210, 385);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Computed Risk Score:', 310, 345);
  doc.fillColor(colors.navyDark).font('Helvetica').text(`${assessment.risk_score} / 100`, 440, 345);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Risk Tier Category:', 310, 365);
  doc.fillColor(assessment.risk_level === 'low' ? colors.greenAlert : assessment.risk_level === 'medium' ? '#F59E0B' : colors.redAlert).font('Helvetica-Bold').text(assessment.risk_level.toUpperCase(), 440, 365);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Rules Recommendation:', 310, 385);
  doc.fillColor(assessment.approval_recommendation === 'approve' ? colors.greenAlert : assessment.approval_recommendation === 'review' ? '#F59E0B' : colors.redAlert).font('Helvetica-Bold').text(assessment.approval_recommendation.toUpperCase(), 440, 385);

  // Underwriting Rules explanation
  doc
    .fillColor(colors.slateMed)
    .font('Helvetica-Oblique')
    .fontSize(8)
    .text(`Programmatic Logic Trigger Output: ${assessment.eligibility_explanation}`, 70, 422, { width: 450 });

  // --- Section 3: Automated Fraud Diagnostics Audit ---
  doc
    .fillColor(colors.navyDark)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('3. COMPLIANCE FRAUD AUDIT CHECKS', 50, 470);

  doc
    .moveTo(50, 485)
    .lineTo(545, 485)
    .strokeColor(colors.borderLight)
    .stroke();

  // Fraud panel box
  doc
    .rect(50, 495, 495, 75)
    .fill(colors.grayFill);

  // Flag Indicators
  doc.fillColor(colors.slateMed).font('Helvetica-Bold').fontSize(9).text('PAN Duplication (30d):', 70, 510);
  doc.fillColor(fraudCheck.is_duplicate ? colors.redAlert : colors.greenAlert).font('Helvetica-Bold').text(fraudCheck.is_duplicate ? 'ALERT (FLAGGED)' : 'PASS (CLEAN)', 200, 510);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('KYC Missing Contacts:', 70, 530);
  doc.fillColor(fraudCheck.is_missing_info ? colors.redAlert : colors.greenAlert).font('Helvetica-Bold').text(fraudCheck.is_missing_info ? 'ALERT (WARNING)' : 'PASS (VERIFIED)', 200, 530);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Suspicious Earnings Tier:', 70, 550);
  doc.fillColor(fraudCheck.is_suspicious_income ? colors.redAlert : colors.greenAlert).font('Helvetica-Bold').text(fraudCheck.is_suspicious_income ? 'ALERT (REVIEW)' : 'PASS (NORMAL)', 200, 550);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('Security Fraud Score:', 310, 510);
  doc.fillColor(colors.navyDark).font('Helvetica').text(`${fraudCheck.fraud_score} / 100`, 440, 510);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('KYC Fraud Status:', 310, 530);
  doc.fillColor(fraudCheck.status === 'pass' ? colors.greenAlert : fraudCheck.status === 'review' ? '#F59E0B' : colors.redAlert).font('Helvetica-Bold').text(fraudCheck.status.toUpperCase(), 440, 530);

  // Compliance statement text
  doc
    .fillColor(colors.slateMed)
    .fontSize(7)
    .font('Helvetica')
    .text('Disclaimer: Automated fraud checks inspect local system records only and should be supplemented by credit bureau inquiries.', 50, 750);

  // Footnote Page 1
  doc
    .fillColor(colors.slateMed)
    .fontSize(8)
    .text('Page 1 of 2', 500, 750);

  // ==========================================
  // PAGE 2: GENERATIVE AI UNDERWRITING REPORTS
  // ==========================================
  doc.addPage();

  // Header Page 2
  doc
    .rect(50, 45, 495, 40)
    .fill(colors.navyDark);

  doc
    .fillColor(colors.white)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('PORTFOLIO UNDERWRITING AUDIT REPORT', 70, 52);

  doc
    .fillColor(colors.white)
    .fontSize(7)
    .font('Helvetica')
    .text(`APPLICANT: ${applicant.first_name} ${applicant.last_name}  |  ID: #${applicant.id}`, 70, 70);

  doc
    .fillColor(colors.navyDark)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('4. GENERATIVE AI COGNITIVE ANALYSIS', 50, 110);

  doc
    .moveTo(50, 125)
    .lineTo(545, 125)
    .strokeColor(colors.borderLight)
    .stroke();

  // A. AI Summary Card Box
  doc.fillColor(colors.navyDark).font('Helvetica-Bold').fontSize(9).text('A. AI-Generated Borrower Summary:', 50, 140);
  doc.rect(50, 155, 495, 100).fill(colors.grayFill);
  doc
    .fillColor(colors.navyDark)
    .font('Helvetica')
    .fontSize(8.5)
    .text(assessment.ai_summary || 'No AI Summary calculated. Please assess the applicant profile first.', 70, 170, { width: 455, align: 'justify', lineGap: 3 });

  // B. AI Eligibility Explanations Card Box
  doc.fillColor(colors.navyDark).font('Helvetica-Bold').fontSize(9).text('B. AI Eligibility & Buffer Assessment:', 50, 275);
  doc.rect(50, 290, 495, 100).fill(colors.grayFill);
  doc
    .fillColor(colors.navyDark)
    .font('Helvetica')
    .text(assessment.ai_eligibility_explanation || 'No AI Eligibility details recorded.', 70, 305, { width: 455, align: 'justify', lineGap: 3 });

  // C. AI Risk Vector Analysis Card Box
  doc.fillColor(colors.navyDark).font('Helvetica-Bold').fontSize(9).text('C. AI Risk Factors & Compensating Buffer Vectors:', 50, 410);
  doc.rect(50, 425, 495, 100).fill(colors.grayFill);
  doc
    .fillColor(colors.navyDark)
    .font('Helvetica')
    .text(assessment.ai_risk_analysis || 'No AI Risk Vector calculations completed.', 70, 440, { width: 455, align: 'justify', lineGap: 3 });

  // D. Underwriting Audit Recommendation Card Box
  doc.fillColor(colors.navyDark).font('Helvetica-Bold').fontSize(9).text('D. Underwriter Audit Instructions & Recommendations:', 50, 545);
  doc.rect(50, 560, 495, 95).fill(colors.grayFill);
  doc
    .fillColor(colors.navyDark)
    .font('Helvetica')
    .text(assessment.ai_recommendation || 'No AI Underwriter recommendations generated.', 70, 575, { width: 455, align: 'justify', lineGap: 3 });

  // Signatures Panel
  doc.fillColor(colors.slateMed).font('Helvetica-Bold').fontSize(8).text('Lead Audit Underwriter Signature:', 50, 690);
  doc.moveTo(50, 715).lineTo(220, 715).strokeColor(colors.slateMed).lineWidth(0.5).stroke();
  doc.fillColor(colors.slateMed).font('Helvetica').text('Credit Committee Auditor', 50, 722);

  doc.fillColor(colors.slateMed).font('Helvetica-Bold').text('System Verification Stamp:', 330, 690);
  doc.moveTo(330, 715).lineTo(500, 715).stroke();
  doc.fillColor(colors.slateMed).font('Helvetica').text('AI Decisioning Engine Verified', 330, 722);

  // Footnote Page 2
  doc
    .fillColor(colors.slateMed)
    .fontSize(8)
    .text('Page 2 of 2', 500, 750);

  // 3. Finalize and write the PDF binary streams
  doc.end();
};
