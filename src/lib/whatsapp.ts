export async function sendWhatsAppMessage(to: string, body: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp configuration missing');
  }

  const res = await fetch(
    `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    console.error('WhatsApp API Error:', error);
    const message = error.error?.message || 'Failed to send WhatsApp message';
    if (message.includes('Session has expired') || error.error?.error_subcode === 463) {
      throw new Error('WhatsApp access token expired. Please generate a new token in Meta and update WHATSAPP_ACCESS_TOKEN in .env.local.');
    }
    throw new Error(message);
  }

  return res.json();
}
