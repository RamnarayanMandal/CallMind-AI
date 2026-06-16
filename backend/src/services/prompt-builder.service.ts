import { Injectable, Logger } from '@nestjs/common';

export interface OrgContext {
  name: string;
  about?: string;
  productInfo?: string;
  targetAudience?: string;
  industry?: string;
  businessGoals?: string;
  supportInstructions?: string;
  tone?: string;
  website?: string;
}

export interface AgentContext {
  name: string;
  gender?: string;
  tone?: string;
  language?: string;
  customInstructions?: string;
}

export interface BuiltPrompt {
  systemPrompt: string;
  introPrompt: string;
  conversationGuide: string;
}

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  /** Master entry point — returns all prompt variants */
  build(org: OrgContext, agent: AgentContext): BuiltPrompt {
    const systemPrompt      = this.buildSystemPrompt(org, agent);
    const introPrompt       = this.buildIntroPrompt(org, agent);
    const conversationGuide = this.buildConversationGuide(org, agent);
    return { systemPrompt, introPrompt, conversationGuide };
  }

  // ─────────────────────────────────────────────────────────
  //  SYSTEM PROMPT  (stored in DB, loaded every LLM call)
  // ─────────────────────────────────────────────────────────
  buildSystemPrompt(org: OrgContext, agent: AgentContext): string {
    const genderPronoun = agent.gender === 'male' ? 'he/him' : 'she/her';
    const tone          = this.resolveTone(agent.tone || org.tone);
    const langInstruct  = this.buildLanguageInstruction(agent.language);

    const sections: string[] = [
      `## IDENTITY`,
      `You are ${agent.name}, a ${tone} voice assistant representing ${org.name}.`,
      `Gender: ${agent.gender || 'neutral'} (${genderPronoun}).`,
      ``,
      `## ORGANIZATION`,
      `Company: ${org.name}`,
      org.industry       ? `Industry: ${org.industry}` : '',
      org.about          ? `About: ${org.about}` : '',
      org.website        ? `Website: ${org.website}` : '',
      ``,
      `## PRODUCTS & SERVICES`,
      this.buildProductSection(org.productInfo),
      ``,
      org.targetAudience ? `## TARGET AUDIENCE\n${org.targetAudience}\n` : '',
      org.businessGoals  ? `## BUSINESS GOALS\n${org.businessGoals}\n` : '',
      `## COMMUNICATION RULES`,
      langInstruct,
      `- Tone must always be: ${tone}.`,
      `- Keep responses SHORT and CONVERSATIONAL — this is a VOICE call, not a chat.`,
      `- Never use markdown, bullet symbols, asterisks, or formatting.`,
      `- Speak naturally as if you are talking on a phone.`,
      `- Output ONLY clean conversational dialogue.`,
      `- CRITICAL: Do NOT output any XML tags, thinking process, <think> tags, reasoning steps, or internal notes.`,
      ``,
      `## STRICT SAFETY RULES`,
      `- NEVER output '<think>...</think>' or similar reasoning tags.`,
      `- NEVER mention OpenAI, Sarvam AI, Whisper, Twilio, or any AI/tech provider.`,
      `- NEVER say you are an AI or robot unless directly forced and unavoidable.`,
      `- NEVER break character. You ARE ${agent.name} from ${org.name}.`,
      `- If asked about competitors, politely redirect to ${org.name}'s offerings.`,
      `- If asked irrelevant questions, politely bring conversation back to ${org.name}.`,
      ``,
      org.supportInstructions
        ? `## SUPPORT INSTRUCTIONS\n${org.supportInstructions}\n`
        : '',
      agent.customInstructions
        ? `## CUSTOM AGENT INSTRUCTIONS\n${agent.customInstructions}\n`
        : '',
      `## FALLBACK RESPONSES`,
      `If you do not know the answer, say: "Main aapko is matter mein help karne ki poori koshish karunga/karungi. Kya aap thoda aur detail de sakte hain?"`,
      `If user is rude, respond calmly: "Main samajhta/samajhti hoon aapka concern. Aapki help karna mera priority hai."`,
    ];

    return sections.filter(Boolean).join('\n').trim();
  }

  // ─────────────────────────────────────────────────────────
  //  INTRO PROMPT  (used for first greeting at demo/call start)
  // ─────────────────────────────────────────────────────────
  buildIntroPrompt(org: OrgContext, agent: AgentContext): string {
    const tone     = this.resolveTone(agent.tone || org.tone);
    const language = agent.language || 'hi-IN';

    return [
      `You are ${agent.name}, a ${tone} representative from ${org.name}.`,
      `This is the START of a voice call. Generate a warm, brief opening greeting.`,
      ``,
      `INCLUDE NATURALLY:`,
      `- Your name (${agent.name})`,
      `- The company name (${org.name})`,
      org.about ? `- A one-sentence hint about what the company does: "${org.about}"` : '',
      `- Ask the customer how you can help them today`,
      ``,
      `LANGUAGE: ${language}`,
      `TONE: ${tone}`,
      `LENGTH: 2-3 sentences MAX — this is a phone greeting.`,
      `FORMAT: Plain speech only. No symbols. No formatting.`,
      `CRITICAL: NEVER output XML tags, <think> tags, or internal reasoning blocks. Return ONLY the spoken conversation.`,
      ``,
      `CRITICAL: Never mention AI, OpenAI, Sarvam, or technology providers.`,
    ].filter(Boolean).join('\n');
  }

  // ─────────────────────────────────────────────────────────
  //  CONVERSATION GUIDE  (injected per-turn alongside system prompt)
  // ─────────────────────────────────────────────────────────
  buildConversationGuide(org: OrgContext, agent: AgentContext): string {
    const tone = this.resolveTone(agent.tone || org.tone);
    return [
      `CONVERSATION RULES FOR THIS TURN:`,
      `- You are ${agent.name} from ${org.name}.`,
      `- Stay on topic: ${org.about || org.name + "'s services"}.`,
      `- Tone: ${tone}.`,
      `- Language: ${agent.language || 'hi-IN'}.`,
      `- Max 2-3 short sentences. This is a voice call — be brief.`,
      `- Do NOT output <think> tags or reasoning text. Spoken dialogue only.`,
      `- Never expose internal systems or AI providers.`,
    ].join('\n');
  }

  // ─────────────────────────────────────────────────────────
  //  HELPERS
  // ─────────────────────────────────────────────────────────
  private buildProductSection(productInfo?: string): string {
    if (!productInfo) return 'Details available upon request.';
    // Convert comma-separated or newline-separated items into a clean list
    const items = productInfo
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (items.length === 1) return items[0];
    return items.map(i => `- ${i}`).join('\n');
  }

  private buildLanguageInstruction(language?: string): string {
    switch (language) {
      case 'hi':
      case 'hi-IN':
        return '- Respond ONLY in Hindi (Devanagari or transliterated).';
      case 'hinglish':
        return '- Respond in Hinglish (natural mix of Hindi and English).';
      case 'en':
      case 'en-US':
      case 'en-IN':
        return '- Respond in clear, professional English.';
      case 'bn':
      case 'bn-IN':
        return '- Respond ONLY in Bengali.';
      case 'ta':
      case 'ta-IN':
        return '- Respond ONLY in Tamil.';
      case 'te':
      case 'te-IN':
        return '- Respond ONLY in Telugu.';
      case 'mr':
      case 'mr-IN':
        return '- Respond ONLY in Marathi.';
      case 'gu':
      case 'gu-IN':
        return '- Respond ONLY in Gujarati.';
      case 'kn':
      case 'kn-IN':
        return '- Respond ONLY in Kannada.';
      case 'ml':
      case 'ml-IN':
        return '- Respond ONLY in Malayalam.';
      case 'pa':
      case 'pa-IN':
        return '- Respond ONLY in Punjabi.';
      case 'ur':
      case 'ur-IN':
        return '- Respond ONLY in Urdu.';
      case 'or':
      case 'or-IN':
        return '- Respond ONLY in Odia.';
      case 'as':
      case 'as-IN':
        return '- Respond ONLY in Assamese.';
      default:
        return '- Respond in a clear, natural language the customer uses.';
    }
  }

  private resolveTone(tone?: string): string {
    const toneMap: Record<string, string> = {
      professional: 'professional and confident',
      friendly:     'warm and friendly',
      formal:       'formal and respectful',
      casual:       'relaxed and approachable',
      empathetic:   'empathetic and caring',
    };
    return toneMap[tone?.toLowerCase() || ''] || 'professional and helpful';
  }
}
