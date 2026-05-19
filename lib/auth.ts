const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export type AuthResponse = {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: string;
};

export async function registerUser(data: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Registration failed");
  }

  return response.json();
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Login failed");
  }

  return response.json();
}