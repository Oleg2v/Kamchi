/** Browser download helpers with no heavy dependencies (pdf-lib stays in its own chunk). */
export function downloadBytes(bytes: Uint8Array, filename: string, type = "application/pdf") {
  const blob = new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function bytesToObjectUrl(bytes: Uint8Array, type = "application/pdf"): string {
  return URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
}
