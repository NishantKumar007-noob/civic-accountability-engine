import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
  genAI = new GoogleGenerativeAI(apiKey);
}

export interface EscalationContent {
  tweet: string;
  csrProposal: {
    amount: string;
    description: string;
    benefits: string;
  };
}

export async function generateEscalationContent(
  issueTitle: string,
  issueLocation: string,
  issueType: string,
  assignedTo: string
): Promise<EscalationContent> {
  if (!genAI) {
    return {
      tweet: `@CityAuthority URGENT: ${issueTitle} at ${issueLocation} has breached SLA. Citizens deserve better! #CivicDuty #RoadSafety`,
      csrProposal: {
        amount: '₹15,000',
        description: 'Sponsor this repair to demonstrate your commitment to the community.',
        benefits: 'Brand visibility on repair site, Social media mentions, Certificate of appreciation'
      }
    };
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a civic accountability assistant. Generate content for escalating a civic issue that has breached its SLA (Service Level Agreement).

ISSUE DETAILS:
- Title: ${issueTitle}
- Location: ${issueLocation}
- Type: ${issueType}
- Assigned to: ${assignedTo}

Generate the following in JSON format (no markdown, just pure JSON):
1. A compelling Tweet (max 280 chars) that tags the responsible authority, expresses urgency, and uses relevant hashtags. Make it impactful and citizen-focused.
2. A CSR (Corporate Social Responsibility) sponsorship proposal with:
   - A realistic estimated repair amount in Indian Rupees (₹)
   - A brief description of what the sponsorship covers
   - Benefits for the sponsoring business

Return ONLY a JSON object with this structure (no code blocks, no markdown):
{"tweet": "...", "csrProposal": {"amount": "...", "description": "...", "benefits": "..."}}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Try to extract JSON from the response
    let jsonStr = text.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);

    return {
      tweet: parsed.tweet || '',
      csrProposal: {
        amount: parsed.csrProposal?.amount || '₹15,000',
        description: parsed.csrProposal?.description || 'Sponsor this repair for community recognition.',
        benefits: parsed.csrProposal?.benefits || 'Brand visibility and community goodwill'
      }
    };
  } catch (error) {
    console.error('Error generating content:', error);
    // Return fallback content
    return {
      tweet: `@${assignedTo.replace(/\s+/g, '')} URGENT: ${issueTitle} at ${issueLocation} has breached SLA. We demand accountability! #CivicAction`,
      csrProposal: {
        amount: '₹25,000',
        description: 'Fund this repair and showcase your business as a community champion.',
        benefits: 'Logo placement, press coverage, tax benefits'
      }
    };
  }
}

export function isGeminiConfigured(): boolean {
  return genAI !== null;
}
