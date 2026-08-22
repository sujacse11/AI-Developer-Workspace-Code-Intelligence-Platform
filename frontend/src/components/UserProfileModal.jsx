import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';
import {
  User, CheckCircle2, X, Edit3, Save, AlertCircle
} from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, fetchProfile } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [idDocType, setIdDocType] = useState('aadhaar');
  const [idDocNumber, setIdDocNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [languages, setLanguages] = useState('');

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setPhoneNumber(user.phone_number || '');
      setCountry(user.country || 'India');
      setIdDocType(user.id_document_type || 'aadhaar');
      setIdDocNumber(user.id_document_number || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setLanguages(
        Array.isArray(user.preferred_languages)
          ? user.preferred_languages.join(', ')
          : user.preferred_languages || 'python, javascript'
      );
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ type: 'error', text: 'First name and last name are required.' });
      setLoading(false);
      return;
    }

    if (phoneNumber && phoneNumber.replace(/\D/g, '').length < 8) {
      setMessage({ type: 'error', text: 'Phone number must contain at least 8 digits.' });
      setLoading(false);
      return;
    }

    const langArray = languages
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    try {
      await api.updateProfile({
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        country: country,
        id_document_type: idDocType,
        id_document_number: idDocNumber,
        bio: bio,
        avatar: avatar,
        preferred_languages: langArray,
      });

      await fetchProfile();
      setMessage({ type: 'success', text: 'User Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      const errDetail =
        err.response?.data?.phone_number?.[0] ||
        err.response?.data?.id_document_number?.[0] ||
        'Failed to update profile details.';
      setMessage({ type: 'error', text: errDetail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        
        {/* Header Bar */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center font-bold text-cyan-400">
                {user.username[0].toUpperCase()}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-slate-100">{user.username}</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-300 font-bold uppercase">
                  {user.plan} Tier
                </span>
                {user.is_staff && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono text-amber-400 font-bold">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={() => { setIsEditing(true); setMessage({ type: '', text: '' }); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 border border-slate-700 transition"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => { setIsEditing(false); setMessage({ type: '', text: '' }); }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-400 transition"
              >
                Cancel
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message.text && (
          <div
            className={`px-5 py-2.5 text-xs font-medium flex items-center space-x-2 border-b ${
              message.type === 'error'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Main Body */}
        <div className="p-6 overflow-y-auto space-y-6">

          {/* Profile Form (Read-only or Editable) */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-cyan-400" />
              <span>Personal Details & Preferences</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">First Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 disabled:opacity-75 disabled:cursor-not-allowed focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Last Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 disabled:opacity-75 disabled:cursor-not-allowed focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Phone Number (Mandatory Contact)</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 disabled:opacity-75 disabled:cursor-not-allowed focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Country</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 disabled:opacity-75 disabled:cursor-not-allowed focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">ID Document Type</label>
                <select
                  disabled={!isEditing}
                  value={idDocType}
                  onChange={(e) => setIdDocType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <option value="aadhaar">Aadhaar Card (National ID)</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                  <option value="national_id">National ID Card</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">ID Document Number</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={idDocNumber}
                  onChange={(e) => setIdDocNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono disabled:opacity-75 disabled:cursor-not-allowed focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Developer Bio</label>
              <textarea
                rows={2}
                disabled={!isEditing}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Software engineer specializing in AI development..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 disabled:opacity-75 disabled:cursor-not-allowed focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Preferred Programming Languages (Comma Separated)</label>
              <input
                type="text"
                disabled={!isEditing}
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
                placeholder="python, javascript, typescript"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 disabled:opacity-75 disabled:cursor-not-allowed focus:ring-1 focus:ring-cyan-500 font-mono"
              />
            </div>

            {isEditing && (
              <div className="flex justify-end pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 text-slate-950 font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}
