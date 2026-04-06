import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase admin client is not initialized' },
      { status: 500 }
    );
  }

  // Fetch all conversations
  const { data: conversations, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (convError) {
    console.error('Error fetching conversations:', convError);
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }

  // Fetch the latest message for each conversation
  const conversationsWithLastMessage = await Promise.all(
    (conversations || []).map(async (conv: any) => {
      const { data: lastMessages, error: msgError } = await supabaseAdmin
          .from('messages')
          .select('content, created_at, sender')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (msgError) {
          console.error(`Error fetching last message for ${conv.id}:`, msgError);
        }

        const lastMsg = lastMessages?.[0] || null;
        return {
          ...conv,
          lastMessage: lastMsg ? {
            content: lastMsg.content,
            created_at: lastMsg.created_at,
            role: lastMsg.sender === 'assistant' ? 'assistant' : 'user'
          } : null
        };
    })
  );

  return NextResponse.json(conversationsWithLastMessage);
}
