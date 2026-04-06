import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Fetch messages using conversation id
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3. Map to common format
  const formattedMessages = (data || []).map((m: any) => ({
    id: m.id,
    role: m.sender === 'assistant' ? 'assistant' : 'user',
    content: m.content,
    created_at: m.created_at
  }));

  return NextResponse.json(formattedMessages);
}
