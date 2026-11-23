import QRCode from "qrcode";

import type { QrFormat } from "@/shared/api/types";

const QR_ERROR_LEVEL = "M";
const QR_MARGIN = 2;
const QR_WIDTH: Record<QrFormat, number> = { svg: 400, png: 1000 };

export async function renderQr(url: string, format: QrFormat) {
  const options = { errorCorrectionLevel: QR_ERROR_LEVEL, margin: QR_MARGIN, width: QR_WIDTH[format] } as const;

  if (format === "png") return QRCode.toDataURL(url, options);
  const svg = await QRCode.toString(url, { ...options, type: "svg" });

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
