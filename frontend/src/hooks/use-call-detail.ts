import { useQuery } from '@tanstack/react-query';
import { callService } from '@/services/call.service';
import { conversationService } from '@/services/conversation.service';
import type { Call, ConversationExtended } from '@/types';

/** Hook: fetch a single call by ID */
export function useCallDetail(callId: string) {
  return useQuery<Call>({
    queryKey: ['call', callId],
    queryFn: () => callService.getCallById(callId),
    enabled: !!callId,
    retry: 1,
  });
}

/** Hook: fetch the conversation/transcript for a call */
export function useCallConversation(callId: string) {
  return useQuery<ConversationExtended>({
    queryKey: ['conversation', callId],
    queryFn: () => conversationService.getByCallId(callId) as Promise<ConversationExtended>,
    enabled: !!callId,
    retry: 1,
  });
}
