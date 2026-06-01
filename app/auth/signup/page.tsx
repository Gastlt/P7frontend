'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/lib/auth';
import { saveSession } from '@/lib/session';

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChecklist, setShowPasswordChecklist] = useState(false);

  const passwordChecks = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const validateForm = () => {
    const errors: string[] = [];

    if (!name.trim()) errors.push('El nombre es obligatorio');
    if (!email.trim()) errors.push('El email es obligatorio');
    if (!phone.trim()) errors.push('El teléfono es obligatorio');
    if (!password) errors.push('La contraseña es obligatoria');
    if (!passwordChecks.hasMinLength)
      errors.push('La contraseña debe tener al menos 8 caracteres');
    if (!passwordChecks.hasUppercase)
      errors.push('La contraseña debe incluir al menos una letra mayúscula');
    if (!passwordChecks.hasLowercase)
      errors.push('La contraseña debe incluir al menos una letra minúscula');
    if (!passwordChecks.hasNumber)
      errors.push('La contraseña debe incluir al menos un número');
    if (!passwordChecks.hasSpecialChar)
      errors.push('La contraseña debe incluir al menos un carácter especial');
    if (password !== repeatPassword) errors.push('Las contraseñas no coinciden');
    if (password && !isPasswordValid) {
      errors.push('Revisa los requisitos de la contraseña');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setLoading(true);

    try {
      const response = await registerUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });

      saveSession(response.token, {
        userId: response.userId,
        name: response.name,
        email: response.email,
        role: response.role,
      });

      router.push('/');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al crear la cuenta';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Crear Cuenta
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono celular
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Tu número celular"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordChecklist(true)}
                onBlur={() => setShowPasswordChecklist(false)}
                placeholder="Contraseña"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
                disabled={loading}
              />

              {showPasswordChecklist && (
                <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                  <p className="mb-2 text-xs font-semibold text-gray-700">
                    Requisitos de contraseña
                  </p>
                  <ul className="space-y-1 text-xs">
                    <li
                      className={
                        passwordChecks.hasMinLength
                          ? 'text-green-700'
                          : 'text-gray-600'
                      }
                    >
                      [{passwordChecks.hasMinLength ? 'x' : ' '}] Al menos 8
                      caracteres
                    </li>
                    <li
                      className={
                        passwordChecks.hasUppercase
                          ? 'text-green-700'
                          : 'text-gray-600'
                      }
                    >
                      [{passwordChecks.hasUppercase ? 'x' : ' '}] Una letra
                      mayúscula
                    </li>
                    <li
                      className={
                        passwordChecks.hasLowercase
                          ? 'text-green-700'
                          : 'text-gray-600'
                      }
                    >
                      [{passwordChecks.hasLowercase ? 'x' : ' '}] Una letra
                      minúscula
                    </li>
                    <li
                      className={
                        passwordChecks.hasNumber
                          ? 'text-green-700'
                          : 'text-gray-600'
                      }
                    >
                      [{passwordChecks.hasNumber ? 'x' : ' '}] Un número
                    </li>
                    <li
                      className={
                        passwordChecks.hasSpecialChar
                          ? 'text-green-700'
                          : 'text-gray-600'
                      }
                    >
                      [{passwordChecks.hasSpecialChar ? 'x' : ' '}] Un carácter
                      especial
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Repetir Contraseña
            </label>
            <input
              type="password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              placeholder="Repetir contraseña"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/auth/login"
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}