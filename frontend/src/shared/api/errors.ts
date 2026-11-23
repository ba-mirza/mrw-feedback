const FALLBACK_MESSAGE = "Что-то пошло не так. Попробуйте ещё раз";

const MESSAGES_BY_CODE: Record<string, string> = {
  "23505": "Такая касса в этом магазине уже есть",
  "23514": "Проверьте заполнение полей",
  "42501": "Нет прав на это действие",
  invalid_credentials: "Неверный e-mail или пароль",
  PGRST116: "Запись не найдена",
};

function readCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return typeof error.code === "string" ? error.code : null;
}

export function errorMessage(error: unknown) {
  const code = readCode(error);

  return (code && MESSAGES_BY_CODE[code]) ?? FALLBACK_MESSAGE;
}
