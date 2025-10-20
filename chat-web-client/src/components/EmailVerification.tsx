import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '@/lib/api/endpoints/auth.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MessageSquare, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    // Verify email
    authApi
      .verifyEmail(token)
      .then((response) => {
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
      })
      .catch((error) => {
        setStatus('error');
        setMessage(
          error.response?.data?.message ||
            'Email verification failed. The link may have expired or is invalid.'
        );
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">ChatHub</h1>
          <p className="text-muted-foreground">Email Verification</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === 'verifying' && (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  Verifying Email
                </>
              )}
              {status === 'success' && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Email Verified!
                </>
              )}
              {status === 'error' && (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  Verification Failed
                </>
              )}
            </CardTitle>
            <CardDescription>
              {status === 'verifying' && 'Please wait while we verify your email address...'}
              {status === 'success' && 'Your email has been successfully verified.'}
              {status === 'error' && 'We could not verify your email address.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  status === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : status === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <p
                  className={`text-sm ${
                    status === 'success'
                      ? 'text-green-800'
                      : status === 'error'
                      ? 'text-red-800'
                      : 'text-blue-800'
                  }`}
                >
                  {message}
                </p>
              </div>

              {status === 'success' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You can now sign in to your account and start using ChatHub.
                  </p>
                  <Button className="w-full" onClick={() => navigate('/')}>
                    Go to Login
                  </Button>
                </div>
              )}

              {status === 'error' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    If you continue to experience issues, please contact support or try registering
                    again.
                  </p>
                  <Button className="w-full" variant="outline" onClick={() => navigate('/')}>
                    Back to Home
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          © 2025 ChatHub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
