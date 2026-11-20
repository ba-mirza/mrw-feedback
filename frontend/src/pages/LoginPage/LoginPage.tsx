import { Alert, Button, Center, Paper, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMutation } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import logo from "@/assets/logo.svg";
import { login } from "@/shared/api/auth";
import { ApiError } from "@/shared/api/http";
import { ADMIN_ROUTES } from "@/shared/config/routes";
import { setAccessToken, useAccessToken } from "@/shared/lib/session";

const FORM_WIDTH = 380;

interface LoginValues {
  email: string;
  password: string;
}

function redirectTarget(state: unknown) {
  if (typeof state === "object" && state !== null && "from" in state && typeof state.from === "string") {
    return state.from;
  }
  return ADMIN_ROUTES.points;
}

export default function LoginPage() {
  const token = useAccessToken();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm<LoginValues>({
    initialValues: { email: "", password: "" },
    validate: {
      email: (value) => (value.includes("@") ? null : "Введите e-mail"),
      password: (value) => (value ? null : "Введите пароль"),
    },
  });
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginValues) => login(email, password),
    onSuccess: (tokens) => {
      setAccessToken(tokens.access_token);
      navigate(redirectTarget(location.state), { replace: true });
    },
  });

  const errorMessage = loginMutation.error instanceof ApiError ? loginMutation.error.message : null;

  if (token) return <Navigate to={ADMIN_ROUTES.points} replace />;

  return (
    <Center h="100vh" bg="gray.0">
      <Paper withBorder shadow="sm" p="xl" w={FORM_WIDTH} maw="calc(100vw - 32px)">
        <form onSubmit={form.onSubmit((values) => loginMutation.mutate(values))}>
          <Stack>
            <img src={logo} alt="MARWIN" width={120} height={38} />
            <Title order={3}>Опросы покупателей</Title>
            {errorMessage && <Alert color="red">{errorMessage}</Alert>}
            <TextInput label="E-mail" autoComplete="username" {...form.getInputProps("email")} />
            <PasswordInput label="Пароль" autoComplete="current-password" {...form.getInputProps("password")} />
            <Button type="submit" loading={loginMutation.isPending}>
              Войти
            </Button>
          </Stack>
        </form>
      </Paper>
    </Center>
  );
}
