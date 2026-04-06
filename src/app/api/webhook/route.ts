import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { getAIResponse } from '@/lib/ai';

// Webhook Verification (GET /api/webhook)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse(null, { status: 403 });
    }
  }
  return new NextResponse(null, { status: 400 });
}

// Receiving Messages (POST /api/webhook)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a WhatsApp message event
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      // Not a message event (could be a status update)
      return NextResponse.json({ status: 'ok' });
    }

    const phone = message.from;
    const name = value.contacts?.[0]?.profile?.name || 'User';
    const messageText = message.text?.body;
    const whatsappMsgId = message.id;

    if (!messageText) {
      return NextResponse.json({ status: 'ok' });
    }

    // 1. Find or create conversation
    let { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('user_phone', phone)
      .single();

    if (!conversation) {
      const { data: newConv, error: createError } = await supabaseAdmin
        .from('conversations')
        .insert([{ user_phone: phone, name, mode: 'agent' }])
        .select()
        .single();
      
      if (createError) throw createError;
      conversation = newConv;
    } else {
      // Update name if it changed or was missing
      if (name && conversation.name !== name) {
        await supabaseAdmin
          .from('conversations')
          .update({ name, updated_at: new Date().toISOString() })
          .eq('id', conversation.id);
      } else {
        // Update timestamp anyway
        await supabaseAdmin
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversation.id);
      }
    }

    // 2. Store user message
    const { error: msgError } = await supabaseAdmin
      .from('messages')
      .insert([
        {
          conversation_id: conversation.id,
          sender: 'user',
          content: messageText,
        },
      ]);

    if (msgError) {
      throw msgError;
    }

    // 3. Process AI response if mode is 'agent'
    if (conversation.mode === 'agent') {
      // Fetch recent history for context
      const { data: history } = await supabaseAdmin
        .from('messages')
        .select('sender, content')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedHistory = (history || [])
        .reverse()
        .map((m: any) => ({
          role: (m.sender === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.content,
        }));

      // Add system prompt
      const aiMessages = [
        { role: 'system' as const, content: 'You are a helpful AI assistant on WhatsApp. Keep your responses concise and friendly.' },
        ...formattedHistory,
      ];

      const aiResponse = await getAIResponse(aiMessages);

      // 4. Send response via WhatsApp
      await sendWhatsAppMessage(phone, aiResponse);

      // 5. Store AI response in DB
      await supabaseAdmin
        .from('messages')
        .insert([
          {
            conversation_id: conversation.id,
            sender: 'assistant',
            content: aiResponse,
          },
        ]);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
