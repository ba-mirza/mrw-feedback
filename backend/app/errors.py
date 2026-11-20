from fastapi import FastAPI, Request
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

ERROR_MESSAGES = {
    "auth_required": "Нужно войти",
    "token_invalid": "Сессия истекла, войдите снова",
    "invalid_credentials": "Неверная почта или пароль",
    "point_not_found": "Касса не найдена",
    "point_exists": "Касса с таким номером в этом магазине уже есть",
    "session_not_found": "Опрос не найден",
    "session_expired": "Время на опрос истекло",
    "already_completed": "Вы уже прошли опрос, спасибо!",
    "already_answered": "На этот вопрос уже есть ответ",
    "invalid_option": "Такого варианта ответа нет",
    "invalid_period": "Дата начала позже даты окончания",
    "not_found": "Не найдено",
}

VALIDATION_MESSAGE = "Некорректное значение"


def error_body(code: str) -> dict[str, str]:
    return {"code": code, "message": ERROR_MESSAGES.get(code, code)}


async def handle_http_error(request: Request, error: StarletteHTTPException) -> JSONResponse:
    code = error.detail if isinstance(error.detail, str) else "error"
    if error.status_code == 404 and code == "Not Found":
        code = "not_found"
    return JSONResponse(status_code=error.status_code, content=error_body(code), headers=error.headers)


async def handle_validation_error(request: Request, error: RequestValidationError) -> JSONResponse:
    issues = [
        {"field": ".".join(str(part) for part in issue["loc"][1:]) or str(issue["loc"][0]), "message": VALIDATION_MESSAGE}
        for issue in error.errors()
    ]
    return JSONResponse(status_code=422, content=issues)


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, handle_http_error)
    app.add_exception_handler(HTTPException, handle_http_error)
    app.add_exception_handler(RequestValidationError, handle_validation_error)
