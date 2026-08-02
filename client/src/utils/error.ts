export function extractErrorMessage(err: any, fallback = "Ma'lumotni saqlashda xatolik yuz berdi"): string {
  if (err?.errorFields) return '';

  const serverMsg = err?.response?.data?.message ?? err?.response?.data?.error;
  if (serverMsg && typeof serverMsg === 'string' && serverMsg.trim()) {
    return serverMsg;
  }

  if (err?.response?.status === 409 || (err?.message && String(err.message).includes('409'))) {
    return "Ushbu telefon raqam yoki email manzili tizimda allaqachon ro'yxatdan o'tgan (dublikat)!";
  }

  if (err?.message && typeof err.message === 'string' && !err.message.includes('status code') && !err.message.includes('Request failed')) {
    return err.message;
  }

  return fallback;
}
