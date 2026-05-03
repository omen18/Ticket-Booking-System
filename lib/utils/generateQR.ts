export function generateQR(payload: string) {
  if (typeof window !== "undefined") {
    return window.btoa(payload);
  }

  return Buffer.from(payload).toString("base64");
}
