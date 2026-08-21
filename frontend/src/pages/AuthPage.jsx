import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import {
  Code2, Sparkles, Lock, User, Mail, ArrowRight, ShieldCheck,
  Phone, Globe, FileText, CheckCircle, AlertCircle, KeyRound, RefreshCw
} from 'lucide-react';

export default function AuthPage() {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset_confirm'
  
  // Login & Basic State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration & Compulsory KYC Contact State
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('India');
  const [idDocType, setIdDocType] = useState('aadhaar');
  const [idDocNumber, setIdDocNumber] = useState('');

  // Password Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [resetGeneratedToken, setResetGeneratedToken] = useState('');

  const { login, register, authLoading, authError } = useStore();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState('');

  // Password Strength Check Helper
  const getPasswordStrength = (passStr) => {
    let score = 0;
    if (passStr.length >= 8) score += 1;
    if (/[A-Z]/.test(passStr)) score += 1;
    if (/[a-z]/.test(passStr)) score += 1;
    if (/[0-9]/.test(passStr)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(passStr)) score += 1;
    return score;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Strict Client Validation
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      setLocalError('Username must be at least 3 characters and contain only letters, numbers, and underscores.');
      return;
    }
    if (!email || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setLocalError('First and last name are required for KYC verification.');
      return;
    }
    if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, '').length < 8) {
      setLocalError('Compulsory Contact Requirement: Please provide a valid phone number (at least 8 digits).');
      return;
    }
    if (!idDocNumber.trim()) {
      setLocalError('KYC Verification Requirement: ID document number is compulsory for identity check.');
      return;
    }
    if (getPasswordStrength(password) < 4) {
      setLocalError('Password must be at least 8 characters long, containing upper, lower, number, and special character.');
      return;
    }

    try {
      await register({
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        country,
        id_document_type: idDocType,
        id_document_number: idDocNumber
      });
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Registration failed');
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLocalError('');
    setResetSuccessMsg('');
    try {
      const res = await api.requestPasswordReset(resetEmail);
      setResetGeneratedToken(res.data.reset_token);
      setResetToken(res.data.reset_token);
      setResetSuccessMsg('Reset token generated! Enter your new password below.');
      setAuthMode('reset_confirm');
    } catch (err) {
      setLocalError(err.response?.data?.email?.[0] || 'Failed to request password reset');
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    setLocalError('');
    setResetSuccessMsg('');
    if (getPasswordStrength(newPassword) < 4) {
      setLocalError('New password must meet strength criteria (8+ chars, uppercase, lowercase, digit, special character).');
      return;
    }

    try {
      const res = await api.confirmPasswordReset(resetToken, newPassword);
      setResetSuccessMsg('Password successfully updated! You can now log in.');
      setTimeout(() => {
        setAuthMode('login');
        setPassword(newPassword);
      }, 1500);
    } catch (err) {
      setLocalError(err.response?.data?.error || err.response?.data?.new_password?.[0] || 'Password reset failed');
    }
  };

  const fillQuickDemo = (userType) => {
    if (userType === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('developer');
      setPassword('dev12345');
    }
    setAuthMode('login');
  };

  const passStrength = getPasswordStrength(password);
  const newPassStrength = getPasswordStrength(newPassword);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-lg glass-panel p-8 rounded-3xl shadow-2xl relative z-10 border border-slate-800 my-6">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 mx-auto mb-3 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Code2 className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-indigo-200 to-purple-400 bg-clip-text text-transparent">
            AI Developer Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">Identity Verified Code Intelligence Platform</p>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex p-1 bg-slate-900 rounded-xl mb-6 border border-slate-800 text-xs">
          <button
            onClick={() => { setAuthMode('login'); setLocalError(''); }}
            className={`flex-1 py-2 font-semibold rounded-lg transition ${
              authMode === 'login' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setAuthMode('register'); setLocalError(''); }}
            className={`flex-1 py-2 font-semibold rounded-lg transition ${
              authMode === 'register' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error / Success Notifications */}
        {(localError || authError) && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{localError || authError}</span>
          </div>
        )}

        {resetSuccessMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{resetSuccessMsg}</span>
          </div>
        )}

        {/* MODE 1: LOGIN FORM */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="developer"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              {/* Forgot Password link directly below password input */}
              <div className="flex justify-end mt-1.5">
                <button
                  type="button"
                  onClick={() => { setAuthMode('forgot'); setLocalError(''); setResetSuccessMsg(''); }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline font-medium flex items-center space-x-1"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Forgot Password? Reset Here</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 mt-6"
            >
              <span>{authLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* MODE 2: REGISTER FORM WITH COMPULSORY CONTACT & KYC CHECK */}
        {authMode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="johndoe_dev"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Compulsory Contact Information */}
            <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center space-x-1">
                <Phone className="w-3 h-3 text-cyan-400" />
                <span>Compulsory Contact Details</span>
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 7504422639"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    placeholder="India"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Mandatory Identity Verification Section */}
            <div className="p-3 bg-indigo-950/20 rounded-2xl border border-indigo-500/30 space-y-2.5">
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                <span>Mandatory Identity Verification</span>
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">ID Document Type *</label>
                  <select
                    value={idDocType}
                    onChange={(e) => setIdDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="aadhaar">Aadhaar Card (National ID)</option>
                    <option value="national_id">National ID Card</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">ID Document Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="1234 5678 9012 (Aadhaar)"
                    value={idDocNumber}
                    onChange={(e) => setIdDocNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * ID Document Type is the type of government-issued ID card used to verify your account identity (e.g. Aadhaar Card, Passport, or Driver's License).
              </p>
            </div>

            {/* Password Strength Field */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="Upper, lower, digit, special char (e.g. Pass@1234)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
              />

              {/* Password Strength Indicator Meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${
                      passStrength <= 2 ? 'w-1/4 bg-rose-500' :
                      passStrength === 3 ? 'w-2/4 bg-amber-500' :
                      passStrength === 4 ? 'w-3/4 bg-cyan-400' : 'w-full bg-emerald-400'
                    }`} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-500">Strength: {passStrength}/5</span>
                    <span className={passStrength >= 4 ? 'text-emerald-400' : 'text-rose-400'}>
                      {passStrength >= 5 ? 'Strong & Secure' : passStrength >= 4 ? 'Good' : 'Weak'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 mt-4"
            >
              <span>{authLoading ? 'Verifying & Registering...' : 'Complete KYC & Register'}</span>
              <ShieldCheck className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD REQUEST FORM */}
        {authMode === 'forgot' && (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Registered Account Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="dev@platform.ai"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow transition"
            >
              <KeyRound className="w-4 h-4" />
              <span>Generate Password Reset Token</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="w-full text-center text-xs text-slate-400 hover:text-slate-200 pt-2 block"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {/* MODE 4: RESET PASSWORD CONFIRM FORM */}
        {authMode === 'reset_confirm' && (
          <form onSubmit={handleConfirmReset} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Password Reset Token</label>
              <input
                type="text"
                required
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Enter New Password</label>
              <input
                type="password"
                required
                placeholder="Upper, lower, digit, special char"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:ring-1 focus:ring-cyan-500"
              />

              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${
                      newPassStrength <= 2 ? 'w-1/4 bg-rose-500' :
                      newPassStrength === 3 ? 'w-2/4 bg-amber-500' :
                      newPassStrength === 4 ? 'w-3/4 bg-cyan-400' : 'w-full bg-emerald-400'
                    }`} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-slate-500">Strength: {newPassStrength}/5</span>
                    <span className={newPassStrength >= 4 ? 'text-emerald-400' : 'text-rose-400'}>
                      {newPassStrength >= 5 ? 'Strong & Secure' : newPassStrength >= 4 ? 'Good' : 'Weak'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 shadow transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Confirm New Password & Log In</span>
            </button>
          </form>
        )}

        {/* Quick Demo Access Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-2">Quick One-Click Demo Access</span>
          <div className="flex space-x-2">
            <button
              onClick={() => fillQuickDemo('developer')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-cyan-400 flex items-center justify-center space-x-1 transition"
            >
              <User className="w-3 h-3" />
              <span>Developer Demo</span>
            </button>
            <button
              onClick={() => fillQuickDemo('admin')}
              className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-amber-400 flex items-center justify-center space-x-1 transition"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
