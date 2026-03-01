import { formatDate, formatPrice } from '@/lib/utils';

export function generateDefaultContractBody(booking: any, finance: any): string {
  const providerName =
    (booking as any)?.providers?.business_name ||
    (booking as any)?.providers?.profiles?.full_name ||
    'Le prestataire';
  const clientName =
    (booking as any)?.profiles?.full_name ||
    (booking as any)?.clients?.profiles?.full_name ||
    'Le client';
  const serviceName = (booking as any)?.services?.name || 'Prestation';
  const bookingDate = booking?.booking_date ? formatDate(booking.booking_date) : '—';
  const startTime = booking?.start_time || '';
  const endTime = booking?.end_time || '';
  const quoteAmount = finance?.quote_amount ? formatPrice(finance.quote_amount) : '—';
  const depositAmount = finance?.deposit_amount ? formatPrice(finance.deposit_amount) : '—';
  const depositDueDate = finance?.deposit_due_date ? formatDate(finance.deposit_due_date) : '—';
  const balanceDueDate = finance?.balance_due_date ? formatDate(finance.balance_due_date) : '—';
  const cancellationPolicy =
    finance?.cancellation_policy || 'Selon les conditions générales du prestataire.';

  return `OBJET DU CONTRAT
Le présent contrat porte sur la réalisation de la prestation « ${serviceName} » par ${providerName}.

PARTIES
Prestataire : ${providerName}
Client : ${clientName}

DATE ET LIEU
Date de la prestation : ${bookingDate}${startTime ? `\nHeure de début : ${startTime}` : ''}${endTime ? `\nHeure de fin : ${endTime}` : ''}

PRIX ET PAIEMENT
Montant total : ${quoteAmount}
Acompte demandé : ${depositAmount}
Échéance acompte : ${depositDueDate}
Échéance solde : ${balanceDueDate}

Le paiement se fait par virement bancaire ou tout autre moyen convenu entre les parties.

CONDITIONS D'ANNULATION
${cancellationPolicy}

RESPONSABILITÉS
Le prestataire s'engage à réaliser la prestation avec professionnalisme et dans les délais convenus.
Le client s'engage à fournir les informations nécessaires à la bonne réalisation de la prestation et à respecter les délais de paiement.

En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.`;
}
