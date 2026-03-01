/**
 * Génération PDF de contrat
 * Utilise expo-print pour générer le fichier et expo-sharing pour le partager.
 */

import { BookingContract, BookingFinanceSnapshot } from '@/types/bookingAdvanced';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const UMADE_BRAND_PRIMARY = '#7C3AED';
const UMADE_BRAND_SECONDARY = '#D946EF';
const PDF_LOGO_URL = process.env.EXPO_PUBLIC_PDF_LOGO_URL?.trim();

function getEmbeddedUmadeLogoDataUri(): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" fill="none">
    <defs>
      <linearGradient id="u_outer" x1="70" y1="70" x2="264" y2="282" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#7C3AED"/>
        <stop offset="0.55" stop-color="#A855F7"/>
        <stop offset="1" stop-color="#D946EF"/>
      </linearGradient>
      <linearGradient id="u_inner" x1="110" y1="110" x2="240" y2="242" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#6D28D9"/>
        <stop offset="1" stop-color="#8B5CF6"/>
      </linearGradient>
    </defs>
    <path d="M88 72V188C88 228.869 121.131 262 162 262C202.869 262 236 228.869 236 188V72"
      stroke="url(#u_outer)" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M108 96V184C108 214.928 133.072 240 164 240C194.928 240 220 214.928 220 184V96"
      stroke="url(#u_inner)" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function resolveContractLogoSrc(): string {
  if (PDF_LOGO_URL) {
    return PDF_LOGO_URL;
  }
  return getEmbeddedUmadeLogoDataUri();
}

type BookingPdfSource = {
  id?: string;
  status?: string | null;
  booking_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  profiles?: {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    postal_code?: string | null;
  } | null;
  services?: {
    name?: string | null;
  } | null;
  providers?: {
    business_name?: string | null;
    profiles?: {
      full_name?: string | null;
    } | null;
  } | null;
} | null;

type ContractHtmlOptions = {
  preview?: boolean;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPdfDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = parseDateLike(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatPdfDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = parseDateLike(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPdfPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function parseDateLike(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map((part) => Number(part));
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

function formatPdfTime(value: string | null | undefined): string {
  if (!value) return '—';

  const hhmm = value.match(/^(\d{2}):(\d{2})/);
  if (hhmm) {
    return `${hhmm[1]}:${hhmm[2]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatStatus(status: string | null | undefined): string {
  if (!status) return '—';
  const mapping: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    completed: 'Terminée',
    cancelled: 'Annulée',
    unpaid: 'Impayé',
    deposit_pending: 'Acompte en attente',
    deposit_paid: 'Acompte payé',
    paid: 'Payée',
    refunded: 'Remboursée',
  };
  return mapping[status] || status;
}

function toNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatQuoteLineDetail(dueDate: string | null | undefined, paidAt: string | null | undefined): string {
  const due = dueDate ? `Échéance: ${formatPdfDate(dueDate)}` : 'Échéance: —';
  const paid = paidAt ? `Payé le ${formatPdfDate(paidAt)}` : 'Non payé';
  return `${due} · ${paid}`;
}

function sanitizeForFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function buildPdfFileName(contract: BookingContract, booking: BookingPdfSource): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const titlePart = sanitizeForFilename(contract.title).slice(0, 40) || 'contrat';
  const bookingPart = sanitizeForFilename(booking?.id || contract.booking_id).slice(0, 12) || 'reservation';
  return `${titlePart}-${bookingPart}-${dateStamp}.pdf`;
}

async function persistPdfToDocuments(tempUri: string, fileName: string): Promise<string> {
  const baseDir = FileSystem.documentDirectory;
  if (!baseDir) return tempUri;

  const contractDir = `${baseDir}contracts/`;
  const destinationUri = `${contractDir}${fileName}`;

  try {
    const dirInfo = await FileSystem.getInfoAsync(contractDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(contractDir, { intermediates: true });
    }

    const existingFile = await FileSystem.getInfoAsync(destinationUri);
    if (existingFile.exists) {
      await FileSystem.deleteAsync(destinationUri, { idempotent: true });
    }

    await FileSystem.copyAsync({ from: tempUri, to: destinationUri });
    return destinationUri;
  } catch {
    return tempUri;
  }
}

export function generateContractHtml(
  contract: BookingContract,
  booking: BookingPdfSource,
  finance: BookingFinanceSnapshot | null,
  options?: ContractHtmlOptions
): string {
  const isPreview = options?.preview === true;
  const viewportContent = isPreview
    ? 'width=device-width, initial-scale=0.82, maximum-scale=3, viewport-fit=cover'
    : 'width=device-width, initial-scale=1.0';
  const bodyPadding = isPreview ? '30px 22px' : '48px 40px';
  const baseFontSize = isPreview ? '11.5px' : '13px';
  const baseLineHeight = isPreview ? '1.5' : '1.6';
  const headerTitleFontSize = isPreview ? '20px' : '22px';
  const sectionHeaderFontSize = isPreview ? '13px' : '14px';
  const summaryValueFontSize = isPreview ? '12px' : '13px';
  const signatureNameFontSize = isPreview ? '14px' : '16px';
  const previewResponsiveCss = isPreview
    ? `
    html, body {
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
    @media (max-width: 760px) {
      .parties,
      .summary-grid,
      .signatures {
        display: block;
      }
      .party-card,
      .summary-item,
      .signature {
        margin-bottom: 10px;
      }
      .header {
        margin-bottom: 24px;
        padding-bottom: 18px;
      }
    }
  `
    : '';

  const logoDataUri = resolveContractLogoSrc();
  const providerName =
    booking?.providers?.business_name ||
    booking?.providers?.profiles?.full_name ||
    'Prestataire';
  const clientName = booking?.profiles?.full_name || 'Client';
  const clientEmail = booking?.profiles?.email || '—';
  const clientPhone = booking?.profiles?.phone || '—';
  const clientCity = booking?.profiles?.city || '';
  const clientPostalCode = booking?.profiles?.postal_code || '';
  const clientLocation = [clientPostalCode, clientCity].filter(Boolean).join(' ').trim() || '—';
  const serviceName = booking?.services?.name || 'Prestation';
  const bookingDate = formatPdfDate(booking?.booking_date || finance?.booking_date || null);
  const startTime = formatPdfTime(booking?.start_time || finance?.start_time || null);
  const endTime = formatPdfTime(booking?.end_time || finance?.end_time || null);
  const bookingStatus = formatStatus(booking?.status || finance?.status || null);

  const quoteAmount = toNumber(finance?.quote_amount ?? finance?.total_price);
  const depositAmount = toNumber(finance?.deposit_amount);
  const balanceAmount = toNumber(finance?.balance_amount);
  const depositPaid = toNumber(finance?.deposit_paid_amount) || 0;
  const balancePaid = toNumber(finance?.balance_paid_amount) || 0;
  const totalPaid = depositPaid + balancePaid;
  const remaining = quoteAmount !== null ? Math.max(quoteAmount - totalPaid, 0) : null;

  const paymentStatus = formatStatus(finance?.payment_status || null);
  const partiesHtml = `<div class="section-label">Parties</div>
  <div class="parties">
    <div class="party-card">
      <div class="party-role">Prestataire</div>
      <div class="party-name">${escapeHtml(providerName)}</div>
    </div>
    <div class="party-card">
      <div class="party-role">Client</div>
      <div class="party-name">${escapeHtml(clientName)}</div>
      <div class="party-meta">${escapeHtml(clientEmail)}</div>
      <div class="party-meta">${escapeHtml(clientPhone)}</div>
      <div class="party-meta">${escapeHtml(clientLocation)}</div>
    </div>
  </div>`;
  const quoteSummaryHtml = finance
    ? `<div class="quote-card">
        <h2>Annexe devis</h2>
        <table class="quote-table">
          <thead>
            <tr>
              <th>Poste</th>
              <th>Montant</th>
              <th>Détails</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Devis total</td>
              <td>${formatPdfPrice(quoteAmount)}</td>
              <td>Montant convenu pour la prestation</td>
            </tr>
            <tr>
              <td>Acompte</td>
              <td>${formatPdfPrice(depositAmount)}</td>
              <td>${escapeHtml(
                formatQuoteLineDetail(finance.deposit_due_date, finance.deposit_paid_at)
              )}</td>
            </tr>
            <tr>
              <td>Solde</td>
              <td>${formatPdfPrice(balanceAmount)}</td>
              <td>${escapeHtml(
                formatQuoteLineDetail(finance.balance_due_date, finance.balance_paid_at)
              )}</td>
            </tr>
            <tr>
              <td>Déjà payé</td>
              <td>${formatPdfPrice(totalPaid)}</td>
              <td>Versements enregistrés</td>
            </tr>
            <tr>
              <td>Reste à payer</td>
              <td>${formatPdfPrice(remaining)}</td>
              <td>Statut: ${escapeHtml(paymentStatus)}</td>
            </tr>
          </tbody>
        </table>
      </div>`
    : '';

  const bodyHtml = escapeHtml(contract.body)
    .split('\n')
    .map((line) => {
      // Detect section headers (ALL CAPS lines)
      const isHeader =
        line === line.toUpperCase() && line.trim().length > 3 && !/^\d/.test(line);
      if (isHeader) {
        return `<h3 class="section-header">${line}</h3>`;
      }
      return line.trim() ? `<p>${line}</p>` : '<br/>';
    })
    .join('\n');

  const providerSignatureHtml = contract.provider_signature_name
    ? `<div class="signature signed">
        <div class="sig-label">Prestataire</div>
        <div class="sig-name">${escapeHtml(contract.provider_signature_name)}</div>
        <div class="sig-date">Signé électroniquement le ${formatPdfDateTime(contract.provider_signed_at)}</div>
        <div class="sig-meta">Lieu: ${escapeHtml(contract.provider_signature_place || 'Non renseigné')}</div>
      </div>`
    : `<div class="signature pending">
        <div class="sig-label">Prestataire</div>
        <div class="sig-pending">Signature électronique en attente</div>
      </div>`;

  const clientSignatureHtml = contract.client_signature_name
    ? `<div class="signature signed">
        <div class="sig-label">Client</div>
        <div class="sig-name">${escapeHtml(contract.client_signature_name)}</div>
        <div class="sig-date">Signé électroniquement le ${formatPdfDateTime(contract.client_signed_at)}</div>
        <div class="sig-meta">Lieu: ${escapeHtml(contract.client_signature_place || 'Non renseigné')}</div>
      </div>`
    : `<div class="signature pending">
        <div class="sig-label">Client</div>
        <div class="sig-pending">Signature électronique en attente</div>
      </div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="${viewportContent}" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1F2937;
      padding: ${bodyPadding};
      font-size: ${baseFontSize};
      line-height: ${baseLineHeight};
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
      border-bottom: 2px solid ${UMADE_BRAND_PRIMARY};
      padding-bottom: 24px;
    }
    .brand-top {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .brand-logo-wrap {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #F5F3FF 0%, #FDF4FF 100%);
      border: 1px solid ${UMADE_BRAND_SECONDARY};
      overflow: hidden;
    }
    .brand-logo {
      width: 36px;
      height: 36px;
      display: block;
    }
    .brand-name {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: 0.3px;
      color: ${UMADE_BRAND_PRIMARY};
    }
    .header h1 {
      font-size: ${headerTitleFontSize};
      font-weight: 800;
      color: ${UMADE_BRAND_PRIMARY};
      margin-bottom: 8px;
    }
    .header .meta {
      font-size: 12px;
      color: #6B7280;
    }
    .section-label {
      font-size: 12px;
      font-weight: 700;
      color: #374151;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .parties {
      display: flex;
      gap: 12px;
      margin-bottom: 18px;
    }
    .party-card {
      flex: 1;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      padding: 10px 12px;
      background: #FAFAFA;
    }
    .party-role {
      font-size: 10px;
      text-transform: uppercase;
      color: #6B7280;
      margin-bottom: 5px;
      letter-spacing: 0.4px;
      font-weight: 700;
    }
    .party-name {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 3px;
    }
    .party-meta {
      font-size: 11px;
      color: #6B7280;
      line-height: 1.45;
    }
    .summary-grid {
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .summary-item {
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 10px 12px;
      background: #FAFAFA;
    }
    .summary-label {
      font-size: 11px;
      text-transform: uppercase;
      color: #6B7280;
      margin-bottom: 3px;
      letter-spacing: 0.5px;
    }
    .summary-value {
      font-size: ${summaryValueFontSize};
      color: #111827;
      font-weight: 600;
    }
    .quote-card {
      margin: 10px 0 30px 0;
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      overflow: hidden;
    }
    .quote-card h2 {
      background: #F5F3FF;
      color: ${UMADE_BRAND_PRIMARY};
      padding: 12px 14px;
      font-size: 14px;
      font-weight: 800;
      border-bottom: 1px solid #E5E7EB;
    }
    .quote-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    .quote-table th,
    .quote-table td {
      text-align: left;
      border-bottom: 1px solid #E5E7EB;
      padding: 10px 12px;
      vertical-align: top;
    }
    .quote-table th {
      background: #F9FAFB;
      color: #4B5563;
      font-weight: 700;
    }
    .quote-table tr:last-child td {
      border-bottom: none;
      font-weight: 700;
    }
    .section-header {
      font-size: ${sectionHeaderFontSize};
      font-weight: 700;
      color: #374151;
      margin-top: 24px;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #E5E7EB;
      padding-bottom: 4px;
    }
    p {
      margin-bottom: 4px;
      color: #4B5563;
    }
    .signatures {
      display: flex;
      gap: 24px;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 2px solid #E5E7EB;
    }
    .signature {
      flex: 1;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #E5E7EB;
    }
    .signature.signed {
      background: #ECFDF5;
      border-color: #059669;
    }
    .signature.pending {
      background: #FFFBEB;
      border-color: #F59E0B;
    }
    .sig-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6B7280;
      margin-bottom: 8px;
    }
    .sig-name {
      font-size: ${signatureNameFontSize};
      font-weight: 700;
      color: #059669;
    }
    .sig-date {
      font-size: 11px;
      color: #6B7280;
      margin-top: 4px;
    }
    .sig-meta {
      font-size: 11px;
      color: #6B7280;
      margin-top: 2px;
    }
    .sig-pending {
      font-size: 13px;
      color: #F59E0B;
      font-style: italic;
    }
    .footer {
      margin-top: 48px;
      text-align: center;
      font-size: 11px;
      color: #9CA3AF;
      border-top: 1px solid #E5E7EB;
      padding-top: 16px;
    }
    ${previewResponsiveCss}
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-top">
      <div class="brand-logo-wrap">
        <img class="brand-logo" src="${logoDataUri}" alt="Umade logo" />
      </div>
      <div class="brand-name">Umade</div>
    </div>
    <h1>${escapeHtml(contract.title)}</h1>
    <div class="meta">Version ${contract.version} · Généré le ${formatPdfDate(new Date().toISOString())}</div>
    <div class="meta">Réservation: ${escapeHtml(booking?.id || contract.booking_id)}</div>
  </div>

  ${partiesHtml}

  <div class="summary-grid">
    <div class="summary-item">
      <div class="summary-label">Prestataire</div>
      <div class="summary-value">${escapeHtml(providerName)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Prestation</div>
      <div class="summary-value">${escapeHtml(serviceName)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Date</div>
      <div class="summary-value">${escapeHtml(bookingDate)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Horaire</div>
      <div class="summary-value">${escapeHtml(startTime)} - ${escapeHtml(endTime)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Statut réservation</div>
      <div class="summary-value">${escapeHtml(bookingStatus)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Statut paiement</div>
      <div class="summary-value">${escapeHtml(paymentStatus)}</div>
    </div>
  </div>

  ${quoteSummaryHtml}

  <div class="body">
    ${bodyHtml}
  </div>

  <div class="signatures">
    ${providerSignatureHtml}
    ${clientSignatureHtml}
  </div>

  <div class="footer">
    Généré via Umade · Document à valeur informative
  </div>
</body>
</html>`;
}

export async function shareContractPdf(
  contract: BookingContract,
  booking: BookingPdfSource,
  finance: BookingFinanceSnapshot | null
): Promise<void> {
  const html = generateContractHtml(contract, booking, finance);
  const fileName = buildPdfFileName(contract, booking);

  const { uri } = await Print.printToFileAsync({ html });
  const persistedUri = await persistPdfToDocuments(uri, fileName);

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Le partage n\'est pas disponible sur cet appareil.');
  }

  await Sharing.shareAsync(persistedUri, {
    mimeType: 'application/pdf',
    dialogTitle: `Contrat + devis - ${contract.title}`,
    UTI: 'com.adobe.pdf',
  });
}
