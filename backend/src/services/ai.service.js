/**
 * Generative AI Underwriting Analytics Service
 * Integrates the official @google/genai SDK to generate structured underwriting analyses.
 * Features an intelligent, programmatic fallback mock engine to guarantee system viability.
 */
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize the Google Gen AI SDK context if key is available
let aiClient = null;
if (process.env.GEMINI_API_KEY) {
  console.log('[AI] Google Gen AI SDK initialized with GEMINI_API_KEY.');
  aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
} else {
  console.warn('[AI] WARNING: GEMINI_API_KEY is not defined in .env. Running in Fallback Mock Mode.');
}

/**
 * Programmatic Underwriting Narrative Fallback Mock Engine
 * Generates highly contextual mock narratives based on deterministic metrics when the LLM is unconfigured or offline.
 */
const generateMockReport = (applicant, risk) => {
  const name = `${applicant.first_name} ${applicant.last_name}`;
  const fico = applicant.credit_score;
  const income = applicant.monthly_income;
  const debt = applicant.monthly_debt;
  const amount = applicant.loan_amount;
  const term = applicant.loan_term_months;
  const purpose = applicant.loan_purpose;
  const employment = applicant.employment_status;
  const dti = risk.debt_to_income_ratio;
  const lti = risk.loan_to_income_ratio;
  const score = risk.risk_score;
  const level = risk.risk_level;
  const recommendation = risk.approval_recommendation;

  let summary = '';
  let eligibilityExplanation = '';
  let riskAnalysis = '';
  let aiRecommendation = '';

  if (recommendation === 'approve') {
    summary = `[MOCK AI] ${name} is an excellent prime-grade credit applicant. With a strong gross income of ₹${income}/month, active stable employment, and a high CIBIL score of ${fico}, they represent a highly stable borrowing profile.`;
    eligibilityExplanation = `[MOCK AI] Highly eligible. The DTI ratio of ${dti}% is well within standard banking margins (<= 36%). Their strong CIBIL credit history (${fico}) demonstrates a consistent track record of meeting financial commitments on time.`;
    riskAnalysis = `[MOCK AI] Overall financial risk is minimal. An annualized LTI ratio of ${lti} indicates a highly moderate leverage level relative to gross income. Regular employment provides stable income predictability, and cash buffers are high.`;
    aiRecommendation = `[MOCK AI] Strong Recommendation: Proceed with immediate automatic approval. No compensating factors or structural collaterals are required for this profile.`;
  } else if (recommendation === 'decline') {
    summary = `[MOCK AI] ${name} represents a subprime borrowing profile. They are currently ${employment}, exhibit a subprime credit history (CIBIL ${fico}), and are highly leveraged with existing debt commitments of ₹${debt}/month.`;
    eligibilityExplanation = `[MOCK AI] Ineligible under standard guidelines. The Debt-to-Income (DTI) ratio is ${dti}%, which exceeds the absolute regulatory ceiling of 50%. A significant portion of their gross income is consumed by debt service, creating a severe default risk.`;
    riskAnalysis = `[MOCK AI] High risk profile. The CIBIL score of ${fico} indicates significant past delinquencies. ${employment === 'unemployed' ? 'The lack of primary employment is a critical risk vector.' : `Self-employment adds cashflow volatility.`} The DTI leaves zero emergency financial cushion.`;
    aiRecommendation = `[MOCK AI] Recommendation: Decline application. The borrower fails core debt-to-income and CIBIL credit tier boundaries. Repayment capacity is critically impaired.`;
  } else {
    // Review status (Medium / Marginal risk)
    summary = `[MOCK AI] ${name} presents a marginal underwriting profile. They have a CIBIL credit score of ${fico} and request a ₹${amount} loan for ${purpose} over a term of ${term} months. Gross monthly income is ₹${income}.`;
    eligibilityExplanation = `[MOCK AI] Marginally eligible. While their CIBIL score is acceptable (${fico}) and their DTI ratio of ${dti}% resides within manual underwriting thresholds, compensating factors must be evaluated.`;
    riskAnalysis = `[MOCK AI] Medium risk level (Risk Score: ${score}). Key risk vectors include: ${employment === 'self_employed' ? 'Income volatility associated with self-employment' : 'Moderate debt leverage footprints'}. LTI is calculated at ${lti}, which warrants secondary reserves verification.`;
    aiRecommendation = `[MOCK AI] Recommendation: Refer to manual underwriting review. Assess secondary income sources, bank reserves, or request additional tax transcripts to verify self-employed cashflow viability.`;
  }

  return {
    summary,
    eligibilityExplanation,
    riskAnalysis,
    recommendation: aiRecommendation
  };
};

/**
 * Generates Structured AI Underwriting Report using Gemini
 * Falls back gracefully to the mock engine if API keys are unconfigured or calls fail.
 * @param {Object} applicant - The raw applicant record
 * @param {Object} deterministicRisk - Programmatic risk calculations
 * @returns {Object} Structured narrative analysis
 */
exports.generateUnderwritingReport = async (applicant, deterministicRisk) => {
  // If the API client is not initialized, run the mock fallback immediately
  if (!aiClient) {
    return generateMockReport(applicant, deterministicRisk);
  }

  try {
    const promptText = `
      You are an expert enterprise-level bank credit underwriter. Analyze the following loan application and its programmed deterministic risk assessment, and synthesize a professional, structured JSON risk report.

      BORROWER PROFILE DETAILS:
      - Name: ${applicant.first_name} ${applicant.last_name}
      - Email: ${applicant.email}
      - Employment Status: ${applicant.employment_status}
      - Gross Monthly Income: ₹${applicant.monthly_income}
      - Monthly Debt Obligations: ₹${applicant.monthly_debt}
      - CIBIL Credit Score: ${applicant.credit_score}
      - Loan Amount Requested: ₹${applicant.loan_amount}
      - Loan Purpose: ${applicant.loan_purpose}
      - Loan Term: ${applicant.loan_term_months} months

      DETERMINISTIC RULES ENGINE CALCULATIONS:
      - Debt-to-Income (DTI) Ratio: ${deterministicRisk.debt_to_income_ratio}%
      - Loan-to-Income (LTI) Ratio: ${deterministicRisk.loan_to_income_ratio}
      - Base Programmatic Risk Score: ${deterministicRisk.risk_score}/100
      - Risk Category: ${deterministicRisk.risk_level}
      - Programmatic Eligibility: ${deterministicRisk.eligibility_status}
      - Programmatic Explanation: ${deterministicRisk.eligibility_explanation}
      - Underwriting Recommendation: ${deterministicRisk.approval_recommendation}

      INSTRUCTIONS:
      Generate four concise, professional, banking-grade textual paragraphs analyzing this application. You must speak as a senior, analytical credit underwriter. Avoid generic filler words. Write highly specific evaluations.
    `;

    console.log(`[AI] Generating real-time Gemini report for ${applicant.first_name} ${applicant.last_name}...`);

    // Call the official modern SDK method with structured JSON output enforcement
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        systemInstruction: 'You are a senior banking underwriter. You always output highly analytical, professional reports. You must return your analysis in a valid JSON format complying strictly with the requested JSON schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            summary: { 
              type: 'STRING', 
              description: 'A concise 2-3 sentence narrative summarizing the borrower profile, financial capacity, self-employment/salaried background, and credit tier.' 
            },
            eligibilityExplanation: { 
              type: 'STRING', 
              description: 'A detailed credit-risk narrative explaining the borrower’s cashflow margins. Focus on how the CIBIL score correlates with the calculated DTI ratio, referencing exact numbers.' 
            },
            riskAnalysis: { 
              type: 'STRING', 
              description: 'An analysis of structural risk vectors. Reference DTI, LTI leverage, employment stability, and cashflow cushions under macroeconomic stress.' 
            },
            recommendation: { 
              type: 'STRING', 
              description: 'Clear, actionable instructions for manual bank underwriters, detailing whether to approve, require compensating collateral, request tax tax transcripts, or decline.' 
            }
          },
          required: ['summary', 'eligibilityExplanation', 'riskAnalysis', 'recommendation']
        }
      }
    });

    // Parse the structured JSON output securely
    const jsonText = response.text;
    const aiReport = JSON.parse(jsonText);

    return {
      summary: aiReport.summary,
      eligibilityExplanation: aiReport.eligibilityExplanation,
      riskAnalysis: aiReport.riskAnalysis,
      recommendation: aiReport.recommendation
    };

  } catch (error) {
    console.error('[AI] Gemini API Call Failed! Reverting seamlessly to local Underwriting Fallback Engine.');
    console.error(`[AI] Exception Details: ${error.message}`);
    
    // Graceful fallback execution
    return generateMockReport(applicant, deterministicRisk);
  }
};
