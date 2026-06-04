/**
 * Chat Controller
 * Manages conversational queries for the underwriter assistant.
 * Integrates the @google/genai SDK with a detailed fallback mock assistant engine.
 */
const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize the Gemini client if the API key is configured
let aiClient = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

/**
 * Intelligent deterministic fallback mock response generator
 */
const getMockResponse = (message) => {
  const msg = message.toLowerCase();
  
  if (msg.includes('dti') || msg.includes('debt-to-income') || msg.includes('debt to income')) {
    return `**Debt-to-Income (DTI)** ratio is a core metric in credit underwriting. 
    
* **Formula**: \`(Total Monthly Debt Obligations / Gross Monthly Income) * 100\`
* **Standard Thresholds**:
  * **≤ 36%**: Low risk. Highly favorable for automated approvals.
  * **37% - 50%**: Moderate risk. Requires manual underwriting and compensating factors (e.g., high credit score, cash reserves).
  * **> 50%**: High risk. Exceeds standard banking margins; typically results in immediate decline due to impaired repayment capacity.`;
  }
  
  if (msg.includes('emi') || msg.includes('installment') || msg.includes('monthly payment')) {
    return `**Equated Monthly Installment (EMI)** represents the fixed payment made by a borrower to a lender at a specified date each calendar month.

* **Formula**: \`EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]\`
  * **P** = Principal loan amount
  * **R** = Monthly interest rate (Annual rate / 12 / 100)
  * **N** = Number of monthly installments (Loan term)
* **Underwriter Rule**: The projected EMI of the requested loan should ideally not increase the borrower's total DTI beyond 36-40%.`;
  }
  
  if (msg.includes('cibil') || msg.includes('fico') || msg.includes('credit score') || msg.includes('score')) {
    return `**Credit Scores (CIBIL / FICO)** represent a borrower's credit history and probability of default.

* **Tiers & Risk Evaluation**:
  * **750 - 900 (Excellent)**: Prime tier. Minimal historical default risk; qualifies for automated approval.
  * **650 - 749 (Fair/Good)**: Marginal tier. Requires secondary review of credit history, payment logs, and debt stability.
  * **300 - 649 (Subprime)**: Critical default risk. Represents past delinquencies, high write-offs, or defaults. Typically declined unless backed by heavy collaterals.`;
  }
  
  if (msg.includes('glba') || msg.includes('soc2') || msg.includes('security') || msg.includes('compliance')) {
    return `**FinGenius Security & Compliance Framework**:

* **GLBA (Gramm-Leach-Bliley Act)**: Mandates financial institutions to protect consumer non-public personal information (NPI). We enforce this by masking sensitive IDs (PAN/Aadhaar) and encrypting fields.
* **SOC 2 Type II**: Enforces operational security principles. FinGenius fulfills this by:
  * Restricting delete operations and audit trail viewing to the \`admin\` role.
  * Logging all actions (logins, assessments, downloads, exports) to an immutable audit trail database.
  * Enforcing robust JWT bearer authorization and rate limits on all endpoints.`;
  }
  
  if (msg.includes('status') || msg.includes('lifecycle') || msg.includes('pending') || msg.includes('approved') || msg.includes('rejected')) {
    return `**Borrower Application Lifecycle**:

1. **Pending (Default)**: Created borrower record. Risks and fraud profiles have not yet been evaluated.
2. **Approved**: The risk engine was run, resulting in a low risk score, passing fraud verification, and a programmatic approval recommendation.
3. **Rejected**: Triggered by a high risk score, manual reject recommendations, or any flagged KYC/Fraud indicators (e.g. duplicate identity/income anomalies).
4. **Sign-off**: To finalize any decision, the loan officer must sign-off on the compliance registry inside the applicant's underwriting cockpit.`;
  }

  return `Hello! I am **FinGenius AI**, your credit underwriting chatbot assistant.

Currently, the server is running in **Offline Fallback Mock Mode** because no \`GEMINI_API_KEY\` is configured in the backend \`.env\` file. 

However, you can still ask me about:
* **DTI Limits** (Debt-to-Income calculation and rules)
* **EMI Calculations** (Payment formula and underwriter guidelines)
* **CIBIL Credit Score Tiers** (Risk levels and classifications)
* **GLBA / SOC2 Compliance** (Our data encryption and audit log mechanisms)
* **Application Status Lifecycle** (How applicants move from Pending to Approved or Rejected)`;
};

/**
 * POST /api/chat
 * Resolves conversational underwriter query.
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        status: 'fail',
        message: 'A message string is required.'
      });
    }

    // If live API key is not configured, reply with the deterministic fallback mock response
    if (!aiClient) {
      const mockReply = getMockResponse(message);
      return res.status(200).json({
        status: 'success',
        data: {
          reply: mockReply,
          mode: 'mock'
        }
      });
    }

    console.log(`[AI-Chat] Processing prompt with gemini-2.5-flash...`);

    // Format chat history for Gemini API content schema
    const contents = [
      ...history.map(item => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: 'You are FinGenius AI, a helpful, senior banking underwriter and credit analyst chatbot assistant in the FinGenius dashboard. Answer the user\'s queries about credit policies, limits, DTI ratios, FICO/CIBIL scores, security compliance (GLBA/SOC2), or application flows. Keep responses concise, professional, and well-structured. Feel free to use markdown.'
      }
    });

    return res.status(200).json({
      status: 'success',
      data: {
        reply: response.text,
        mode: 'live'
      }
    });

  } catch (error) {
    console.error(`[AI-Chat] Gemini chat generation failed: ${error.message}`);
    // Seamlesly fallback on errors
    const mockReply = getMockResponse(req.body.message);
    return res.status(200).json({
      status: 'success',
      data: {
        reply: `${mockReply}\n\n*(Note: Gemini live generation encountered an error: ${error.message}. Reverted to offline mock response)*`,
        mode: 'mock-error'
      }
    });
  }
};
