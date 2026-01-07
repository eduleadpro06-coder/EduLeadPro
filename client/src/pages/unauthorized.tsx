/**
 * Unauthorized Access Page
 * Displayed when user tries to access a page they don't have permission for
 */

import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function UnauthorizedPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="mb-6">
                    <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                        <XCircle className="w-12 h-12 text-red-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Access Denied
                </h1>

                <p className="text-gray-600 mb-2">
                    You don't have permission to access this page.
                </p>

                {user && (
                    <p className="text-sm text-gray-500 mb-8">
                        Your role: <span className="font-semibold text-purple-600">{user.role}</span>
                    </p>
                )}

                <div className="space-y-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full btn-primary"
                    >
                        Go to Dashboard
                    </button>
                </div>

                <p className="mt-6 text-xs text-gray-500">
                    If you believe this is an error, please contact your administrator.
                </p>
            </div>
        </div>
    );
}
