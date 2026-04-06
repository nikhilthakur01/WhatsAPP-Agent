import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { content } = await req.json();

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  // 1. Get conversation to get the phone number
  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .select('user_phone')
    .eq('id', id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  try {
    // 2. Send message via WhatsApp API
    await sendWhatsAppMessage(conversation.user_phone, content);

    // 3. Store message in DB
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert([
        {
          conversation_id: id,
          sender: 'assistant',
          content: content,
        },
      ])
      .select()
      .single();

    if (msgError) throw msgError;

    // 4. Update conversation timestamp
    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);

    // 5. Map to common format
    const formattedMessage = {
      id: message.id,
      role: 'assistant',
      content: message.content,
      created_at: message.created_at
    };

    return NextResponse.json(formattedMessage);
  } catch (error: any) {
    console.error('Send Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
