import { Injectable, Logger } from '@nestjs/common';

export interface OrchestratorState {
  intent: string;
  stage: string;
  lastFollowUp: string;
  leadStatus: 'interested' | 'not_interested' | 'cold' | 'qualified' | 'unknown';
  summary: string;
}

@Injectable()
export class ConversationOrchestratorService {
  private readonly logger = new Logger(ConversationOrchestratorService.name);

  // Intent classification mapping containing regex rules for speed and realtime reliability
  private readonly intentPatterns: { intent: string; patterns: RegExp[] }[] = [
    {
      intent: 'pricing',
      patterns: [
        /price/i, /cost/i, /pricing/i, /charge/i, /fees/i, /package/i,
        /daam/i, /paise/i, /kharcha/i, /rate/i, /kitne ka hai/i, /fees/i
      ]
    },
    {
      intent: 'demo request',
      patterns: [
        /demo/i, /free trial/i, /try it/i, /test/i, /dikhao/i, /chalake/i,
        /kaise kaam karta/i, /live call/i, /show me/i
      ]
    },
    {
      intent: 'callback request',
      patterns: [
        /call back/i, /call me/i, /contact me/i, /phone me/i, /callback/i,
        /baat karwa/i, /number le/i, /baat karna chahta/i, /human agent/i
      ]
    },
    {
      intent: 'sales inquiry',
      patterns: [
        /buy/i, /purchase/i, /integrate/i, /setup/i, /use your agent/i,
        /kharidna/i, /chahiye/i, /apna/i, /start service/i, /business/i
      ]
    },
    {
      intent: 'support',
      patterns: [
        /help/i, /support/i, /issue/i, /error/i, /complaint/i, /not working/i,
        /dikkat/i, /problem/i, /kharab/i, /kam nahi/i
      ]
    },
    {
      intent: 'technical question',
      patterns: [
        /api/i, /integration/i, /database/i, /security/i, /whatsapp/i,
        /realtime/i, /latency/i, /llm/i, /technology/i, /security/i
      ]
    }
  ];

  /**
   * Evaluates the current user transcript, classifies intent, manages conversational stage
   * transitions, and compiles tailored sales directives to guide the LLM's next response.
   *
   * @param userText Pristine cleaned transcript of user speech
   * @param currentState Current orchestrator state extracted from Redis
   * @returns Updated state and strategic prompt directives
   */
  orchestrate(userText: string, currentState?: Partial<OrchestratorState>): {
    newState: OrchestratorState;
    directives: string;
    suggestedFollowUp: string;
  } {
    const text = userText.toLowerCase();

    // 1. Initialize default state if empty
    const state: OrchestratorState = {
      intent: currentState?.intent || 'unknown',
      stage: currentState?.stage || 'intro',
      lastFollowUp: currentState?.lastFollowUp || '',
      leadStatus: currentState?.leadStatus || 'unknown',
      summary: currentState?.summary || 'New conversation initiated.',
    };

    // 2. Classify User Intent
    let detectedIntent = 'unknown';
    for (const item of this.intentPatterns) {
      if (item.patterns.some((pattern) => pattern.test(text))) {
        detectedIntent = item.intent;
        break;
      }
    }

    if (detectedIntent !== 'unknown') {
      state.intent = detectedIntent;
      if (['sales inquiry', 'demo request', 'pricing'].includes(detectedIntent)) {
        state.leadStatus = 'interested';
      }
    }

    // 3. Transition Conversation Stage
    const oldStage = state.stage;
    if (state.stage === 'intro') {
      state.stage = 'discovery';
    } else if (state.stage === 'discovery') {
      // If user shared details or intent was detected, transition to qualification
      if (detectedIntent !== 'unknown' || text.split(/\s+/).length > 4) {
        state.stage = 'qualification';
      }
    } else if (state.stage === 'qualification') {
      if (detectedIntent === 'pricing') {
        state.stage = 'pricing';
      } else if (detectedIntent === 'demo request') {
        state.stage = 'demo';
      } else if (detectedIntent === 'callback request') {
        state.stage = 'callback';
      } else if (detectedIntent === 'sales inquiry' || detectedIntent === 'technical question') {
        state.stage = 'explanation';
      }
    } else if (['explanation', 'pricing', 'demo'].includes(state.stage)) {
      if (detectedIntent === 'callback request') {
        state.stage = 'callback';
      } else if (text.includes('thanks') || text.includes('dhanyavaad') || text.includes('ok') || text.includes('thank you')) {
        state.stage = 'closing';
      }
    }

    if (oldStage !== state.stage) {
      this.logger.log(`Conversation state transitioned: ${oldStage} ➔ ${state.stage}`);
      state.summary += ` | Transitioned from ${oldStage} to ${state.stage} on user query: "${userText.substring(0, 30)}..."`;
    }

    // 4. Generate Discovery Stage Questions & Prompt Directives
    let directives = '';
    let suggestedFollowUp = '';

    switch (state.stage) {
      case 'discovery':
        directives = `
- STAGE: DISCOVERY.
- FOCUS: The customer is interested. Ask an open-ended question to understand their industry or primary concern.
- INSTRUCTION: Ask about what kind of business they run, or which service they are looking to automate (e.g. Customer support, lead follow-ups).
- CONSTRAINT: Keep it short (max 2 sentences). Ask only 1 simple question.`;
        suggestedFollowUp = 'Aap kis tarah ka business run karte hain, aur main aapki support calling automate karne mein kaise help kar sakti hoon?';
        break;

      case 'qualification':
        directives = `
- STAGE: QUALIFICATION.
- FOCUS: Understand use-case depth and call volume to assess technical compatibility.
- INSTRUCTION: Ask about their daily/monthly customer calling volume, or if they have a support team that currently manages calls.
- CONSTRAINT: Be extremely conversational, warm, and natural. Keep it short.`;
        suggestedFollowUp = 'Aapke pass daily lagbhag kitne support calls aate hain, aur kya aapki dedicated support team inhe manage karti hai?';
        break;

      case 'explanation':
        directives = `
- STAGE: EXPLANATION.
- FOCUS: Present the core value of our AI agents clearly.
- INSTRUCTION: Explain how our AI voice agents work in both Hindi and English with <1 sec latency.
- ACTION: Ask if they would like to set up a live demo to test the agent on their phone.
- CONSTRAINT: Max 3 brief sentences. Voice-friendly language only.`;
        suggestedFollowUp = 'Humara AI voice agent zero latency par Hindi aur English dono mein fluent support pradan karta hai. Kya aap apne mobile par iska ek live demo try karna chahenge?';
        break;

      case 'pricing':
        directives = `
- STAGE: PRICING.
- FOCUS: Outline custom value-based pricing.
- INSTRUCTION: State that we have customizable corporate calling packages tailored for high-volume enterprises.
- ACTION: Offer to schedule a callback with our senior sales manager to share a custom quotation.
- CONSTRAINT: Do not specify hard pricing numbers unless asked directly. Keep it conversational.`;
        suggestedFollowUp = 'Hum high-volume enterprises ke liye customized calling plans offer karte hain. Kya main aapke liye hamare experts se ek callback arrange karwa sakti hoon?';
        break;

      case 'demo':
        directives = `
- STAGE: DEMO.
- FOCUS: Set up a structured walkthrough.
- INSTRUCTION: Collect their name and phone number to schedule the demonstration call.
- ACTION: Ask what would be the best time to run the demo.
- CONSTRAINT: Stay professional and polite.`;
        suggestedFollowUp = 'Ji bilkul! Demo schedule karne ke liye, kya aap mujhe apna naam aur contact number share kar sakte hain?';
        break;

      case 'callback':
        directives = `
- STAGE: CALLBACK.
- FOCUS: Secure connection with live team.
- INSTRUCTION: Request their phone number and preferred timing to schedule a callback with a human expert.
- ACTION: Confirm details clearly.`;
        suggestedFollowUp = 'Hamare executive aapko complete detail share karne ke liye call karenge. Aap kis time call receive karna prefer karenge?';
        break;

      case 'closing':
        directives = `
- STAGE: CLOSING.
- FOCUS: Warm customer departure.
- INSTRUCTION: Express deep appreciation for their time, leave a professional signoff representing the company, and wish them a great day.`;
        suggestedFollowUp = 'Dhanyavaad! ABC Technology se baat karne ke liye shukriya. Have a great day!';
        break;

      default:
        directives = `
- STAGE: SUPPORT.
- FOCUS: Address general questions about services or product facts.
- ACTION: Answer clearly and naturally. Follow up by asking if they have any other questions.`;
        suggestedFollowUp = 'Kya aap iske baare mein koi aur details jaanana chahte hain?';
        break;
    }

    state.lastFollowUp = suggestedFollowUp;

    return {
      newState: state,
      directives: directives.trim(),
      suggestedFollowUp,
    };
  }
}
