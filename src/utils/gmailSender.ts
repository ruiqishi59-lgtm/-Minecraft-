import { ADMIN_EMAIL } from '../firebase';

export interface FeedbackEmailPayload {
  senderName: string;
  senderEmail: string;
  categoryLabel: string;
  subject: string;
  message: string;
  deviceType: 'tablet' | 'mobile' | 'desktop';
  feedbackId?: string;
}

function stripHeaderControlChars(value: string, maxLen: number): string {
  return value.replace(/[\r\n\x00-\x1f\x7f]/g, ' ').trim().slice(0, maxLen);
}

function encodeUtf8ToBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeMimeHeader(value: string): string {
  const safe = stripHeaderControlChars(value, 180);
  const bytes = new TextEncoder().encode(safe);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

export async function sendFeedbackViaGmail(
  accessToken: string,
  payload: FeedbackEmailPayload
): Promise<{ id: string }> {
  const deviceLabel =
    payload.deviceType === 'tablet'
      ? '平板觸控設備 (Tablet)'
      : payload.deviceType === 'mobile'
      ? '手機觸控設備 (Mobile)'
      : '電腦鍵鼠 (Desktop)';

  const safeSenderName = stripHeaderControlChars(payload.senderName, 64);
  const safeSenderEmail = stripHeaderControlChars(payload.senderEmail, 160);
  const safeCategoryLabel = stripHeaderControlChars(payload.categoryLabel, 32);
  const safeSubject = stripHeaderControlChars(payload.subject, 120);
  const safeMessage = payload.message.replace(/\x00/g, '').trim().slice(0, 2000);
  const safeFeedbackId = payload.feedbackId
    ? stripHeaderControlChars(payload.feedbackId, 128)
    : undefined;

  const emailSubject = `[盜版Rickie -2015 意見箱] [${safeCategoryLabel}] ${safeSubject}`;
  const bodyLines = [
    '您好 Rickie 管理員 (ruiqishi59@gmail.com)：',
    '',
    '玩家透過遊戲內「意見箱」提交了新的回饋訊息：',
    '----------------------------------------',
    `• 玩家名稱：${safeSenderName}`,
    `• 玩家信箱：${safeSenderEmail}`,
    `• 意見分類：${safeCategoryLabel}`,
    `• 遊玩裝置：${deviceLabel}`,
    ...(safeFeedbackId ? [`• 意見編號：${safeFeedbackId}`] : []),
    `• 回饋主旨：${safeSubject}`,
    '----------------------------------------',
    '',
    safeMessage,
    '',
    '---',
    '此郵件由 盜版Rickie -2015 遊戲內意見箱經使用者確認授權後寄出。'
  ];

  const mimeMessage = [
    `To: ${ADMIN_EMAIL}`,
    `Subject: ${encodeMimeHeader(emailSubject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    btoa(
      Array.from(new TextEncoder().encode(bodyLines.join('\r\n')))
        .map((b) => String.fromCharCode(b))
        .join('')
    )
  ].join('\r\n');

  const raw = encodeUtf8ToBase64Url(mimeMessage);

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    }
  );

  if (!response.ok) {
    throw new Error(`Gmail 寄送失敗 (${response.status})，請重新驗證授權後再試。`);
  }

  return response.json();
}

export function buildFeedbackMailtoUrl(payload: FeedbackEmailPayload): string {
  const safeCategoryLabel = stripHeaderControlChars(payload.categoryLabel, 32);
  const safeSubject = stripHeaderControlChars(payload.subject, 120);
  const safeSenderName = stripHeaderControlChars(payload.senderName, 64);
  const safeMessage = payload.message.replace(/\x00/g, '').trim().slice(0, 2000);

  const subject = encodeURIComponent(
    `[盜版Rickie -2015 意見箱] [${safeCategoryLabel}] ${safeSubject}`
  );
  const body = encodeURIComponent(
    [
      `玩家名稱：${safeSenderName}`,
      `遊玩裝置：${payload.deviceType}`,
      '',
      safeMessage
    ].join('\n')
  );
  return `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
}
