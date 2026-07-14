import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, LogOut, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { usePresence } from '../hooks/usePresence';
import api from '../api/axios';
import Avatar from '../components/ui/Avatar';
import type { UserStatus } from '../types';

const statusOptions: { value: UserStatus; label: string; color: string }[] = [
  { value: 'ONLINE', label: 'Online', color: '#10b981' },
  { value: 'AWAY', label: 'Away', color: '#f59e0b' },
  { value: 'DND', label: 'Do Not Disturb', color: '#ef4444' },
  { value: 'OFFLINE', label: 'Invisible', color: '#64748b' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuthStore();
  const { setStatus, setCustomStatus } = usePresence();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [custom, setCustom] = useState(user?.customStatus || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('bio', bio);
      form.append('customStatus', custom);
      if (avatarFile) form.append('avatar', avatarFile);

      const { data } = await api.put('/auth/profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      if (custom !== user.customStatus) setCustomStatus(custom);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-text-primary">Profile & Settings</h1>

        <div className="glass rounded-2xl p-6">
          {/* Avatar */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt={user.name}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <Avatar user={user} size="xl" showStatus />
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:bg-indigo-600"
              >
                <Camera size={15} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickAvatar}
                className="hidden"
              />
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">{user.name}</p>
              <p className="text-sm text-text-secondary">{user.email}</p>
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-text-secondary">Display name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
            </div>

            <div>
              <label className="mb-1 block text-sm text-text-secondary">
                Bio <span className="text-xs">({bio.length}/160)</span>
              </label>
              <textarea
                value={bio}
                maxLength={160}
                rows={3}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your team a bit about yourself..."
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-text-secondary">Custom status</label>
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="e.g. In a meeting 📅"
                className="input-field"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-text-secondary">Presence</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(opt.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                      user.status === opt.value
                        ? 'border-indigo-500/60 bg-indigo-500/15 text-white'
                        : 'border-white/10 text-text-secondary hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: opt.color }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex items-center gap-1 text-sm text-red-400 hover:underline"
            >
              <LogOut size={16} /> Log out
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              <Save size={16} /> {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-text-secondary">
          NexusChat · Crafted by Virendra Singh (IEC2024015) · IIIT Allahabad ·{' '}
          <a
            href="https://github.com/Viru876"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            github.com/Viru876
          </a>
        </p>
      </div>
    </div>
  );
}
