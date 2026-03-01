interface InspirationContextPayload {
  type?: string;
  title?: string;
  message?: string;
  image_url?: string;
  thumbnail_url?: string;
  caption?: string;
  emoji?: string;
  target_message_id?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  service_name?: string;
  booking_date?: string;
}

function isLikelyImageUrl(content: string): boolean {
  if (!/^https?:\/\//i.test(content)) return false;
  return /\.(jpg|jpeg|png|webp|gif|heic|heif)(\?.*)?$/i.test(content);
}

function parseStructuredContent(content: string): InspirationContextPayload | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object') {
      return parsed as InspirationContextPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function getChatMessagePreview(
  content?: string | null,
  options?: { deletedForAll?: boolean | null }
): string {
  if (options?.deletedForAll) return 'Message supprime';

  if (!content) return 'Nouvelle conversation';

  const trimmed = content.trim();
  if (!trimmed) return 'Nouvelle conversation';

  const parsed = parseStructuredContent(trimmed);
  if (parsed) {
    if (parsed.type === 'chat_image') {
      const caption = parsed.caption?.trim();
      return caption ? `📷 Photo: ${caption}` : '📷 Photo';
    }

    if (parsed.type === 'message_reaction') {
      const emoji = parsed.emoji?.trim();
      return emoji ? `A réagi ${emoji}` : 'A réagi';
    }

    if (parsed.type === 'inspiration_context') {
      const note = parsed.message?.trim();
      return note ? `Inspiration partagee: ${note}` : 'Inspiration partagee';
    }

    if (parsed.type === 'booking_status_update') {
      const explicitMessage = parsed.message?.trim();
      if (explicitMessage) return explicitMessage;

      const service = parsed.service_name?.trim();
      switch (parsed.status) {
        case 'confirmed':
          return service
            ? `Reservation confirmee: ${service}`
            : 'Reservation confirmee';
        case 'cancelled':
          return service
            ? `Reservation refusee: ${service}`
            : 'Reservation refusee';
        case 'completed':
          return service
            ? `Reservation terminee: ${service}`
            : 'Reservation terminee';
        default:
          return service
            ? `Mise a jour reservation: ${service}`
            : 'Mise a jour reservation';
      }
    }

    if (parsed.type === 'payment_notification') {
      const msg = parsed.message?.trim();
      return msg ? `💳 Paiement: ${msg}` : '💳 Notification de paiement';
    }

    if (parsed.image_url) {
      return 'Photo envoyee';
    }

    const genericMessage = parsed.message?.trim();
    if (genericMessage) return genericMessage;

    return 'Message systeme';
  }

  if (isLikelyImageUrl(trimmed)) {
    return 'Photo envoyee';
  }

  return trimmed;
}

export function getChatMessageSearchableText(content?: string | null): string {
  if (!content) return '';

  const trimmed = content.trim();
  if (!trimmed) return '';

  const parsed = parseStructuredContent(trimmed);
  if (parsed?.type === 'chat_image') {
    return [
      parsed.caption || '',
      'photo',
      'image',
      'chat',
    ]
      .join(' ')
      .trim();
  }

  if (parsed?.type === 'message_reaction') {
    return [
      parsed.emoji || '',
      parsed.target_message_id || '',
      'reaction',
      'emoji',
    ]
      .join(' ')
      .trim();
  }

  if (parsed?.type === 'inspiration_context') {
    return [
      parsed.title || '',
      parsed.message || '',
      'inspiration',
      'publication',
      'photo',
    ]
      .join(' ')
      .trim();
  }

  if (parsed?.type === 'booking_status_update') {
    return [
      parsed.message || '',
      parsed.service_name || '',
      parsed.status || '',
      parsed.booking_date || '',
      'reservation',
      'booking',
      'confirmation',
      'refus',
      'statut',
    ]
      .join(' ')
      .trim();
  }

  if (parsed?.type === 'payment_notification') {
    return [
      parsed.message || '',
      'paiement',
      'virement',
      'acompte',
      'solde',
    ]
      .join(' ')
      .trim();
  }

  if (parsed?.image_url || isLikelyImageUrl(trimmed)) {
    return 'photo image';
  }

  if (parsed?.message) {
    return parsed.message;
  }

  return trimmed;
}
