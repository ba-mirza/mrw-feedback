export function downloadUrl(url: string, filename: string) {
  if (typeof document === "undefined") return;
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}
