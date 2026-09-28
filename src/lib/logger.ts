/**
 * Universal Logger for The Property Agent
 * Sends structured log events to Google Sheets via Apps Script Webhook.
 */

export interface LogPayload {
  logType: 'CONTACT_FORM' | 'PROPERTY_ADD' | 'PROPERTY_UPDATE' | 'PROPERTY_DELETE' | 'ADMIN_LOGIN' | 'KEEP_ALIVE' | 'ERROR';
  details: Record<string, any>;
  message?: string;
}

export async function logToGoogleSheet(payload: LogPayload): Promise<void> {
  const webhookUrl = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL;

  if (!webhookUrl || webhookUrl.includes('YOUR_DEPLOYMENT_ID')) {
    // Only log if not a placeholder to avoid noisy network warnings
    return;
  }

  try {
    const data = {
      timestamp: new Date().toISOString(),
      logType: payload.logType,
      message: payload.message || '',
      ...payload.details,
    };

    const payloadString = JSON.stringify(data);

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payloadString], { type: 'text/plain;charset=UTF-8' });
      navigator.sendBeacon(webhookUrl, blob);
    } else {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: payloadString,
        mode: 'no-cors',
      }).catch(err => console.warn('[Logger] Failed to dump log to Google Sheet:', err));
    }
  } catch (err) {
    console.warn('[Logger] Error sending log to Google Sheet:', err);
  }
}
