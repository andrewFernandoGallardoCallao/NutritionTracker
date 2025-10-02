import React, { useState, useEffect } from 'react';

interface VerificationCodeProps {
  email: string;
  tempToken: string;
  onVerificationSuccess: (token: string, user: any) => void;
  onResendCode: () => void;
}

const VerificationCode: React.FC<VerificationCodeProps> = ({
  email,
  tempToken,
  onVerificationSuccess,
  onResendCode
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus siguiente input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      setError('Por favor ingresa el código completo de 6 dígitos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://nutritiontracker-1-c7sh.onrender.com/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
          tempToken
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        onVerificationSuccess(data.token, data.user);
      } else {
        setError(data.message);
        // Limpiar código en caso de error
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://nutritiontracker-1-c7sh.onrender.com/api/auth/resend-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          tempToken
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setCanResend(false);
        setCountdown(60);
        onResendCode();
        setError(''); // Limpiar error anterior
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError('Error al reenviar código. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-green-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-green-900">Verifica tu cuenta</h2>
          <p className="text-green-600 mt-2">
            Ingresa el código que enviamos a
          </p>
          <p className="text-green-800 font-semibold">{email}</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-4 text-center">
              Código de verificación (6 dígitos)
            </label>
            <div className="flex justify-center space-x-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-2xl font-bold border-2 border-green-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-colors"
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || code.join('').length !== 6}
            className="w-full bg-green-800 text-white py-3 px-4 rounded-lg hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 font-medium transition-colors shadow-md"
          >
            {loading ? 'Verificando...' : 'Verificar Código'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-green-600">
            ¿No recibiste el código?{' '}
            {canResend ? (
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="text-green-800 hover:underline font-semibold disabled:opacity-50"
              >
                Reenviar código
              </button>
            ) : (
              <span className="text-green-600">
                Reenviar en {countdown}s
              </span>
            )}
          </p>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 text-center">
            💡 Revisa tu bandeja de entrada y la carpeta de spam
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationCode;