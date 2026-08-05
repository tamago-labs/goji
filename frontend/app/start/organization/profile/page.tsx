'use client'

import { useState, useEffect } from 'react'
import { useStart } from '../../../components/start/StartProvider'
import { Loader2, Save, CheckCircle } from 'lucide-react'

const COUNTRIES = [
  { code: 'TH', name: 'Thailand' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
]

const ENTITY_TYPES = [
  'Corporation',
  'Limited Liability Company (LLC)',
  'Partnership',
  'Sole Proprietorship',
  'Limited Partnership',
  'Non-Profit',
  'Branch Office',
  'Representative Office',
]

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'THB', name: 'Thai Baht' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'EUR', name: 'Euro' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'MYR', name: 'Malaysian Ringgit' },
]

interface CompanyProfile {
  legalName: string
  tradingName: string
  country: string
  entityType: string
  registrationNumber: string
  taxId: string
  localCurrency: string
  fiscalYearStart: string
  contactEmail: string
  contactPhone: string
  address: string
  description: string
}

export default function CompanyProfilePage() {
  const { apiUrl } = useStart()
  const [profile, setProfile] = useState<CompanyProfile>({
    legalName: '',
    tradingName: '',
    country: '',
    entityType: '',
    registrationNumber: '',
    taxId: '',
    localCurrency: '',
    fiscalYearStart: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    description: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${apiUrl}/api/company-profile`)
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setProfile({
              legalName: data.legalName || '',
              tradingName: data.tradingName || '',
              country: data.country || '',
              entityType: data.entityType || '',
              registrationNumber: data.registrationNumber || '',
              taxId: data.taxId || '',
              localCurrency: data.localCurrency || '',
              fiscalYearStart: data.fiscalYearStart || '',
              contactEmail: data.contactEmail || '',
              contactPhone: data.contactPhone || '',
              address: data.address || '',
              description: data.description || ''
            })
          }
        }
      } catch (e) {
        console.error('Failed to load profile:', e)
      }
      setLoading(false)
    }
    load()
  }, [apiUrl])

  const handleSave = async () => {
    if (!profile.legalName) return
    setSaving(true)
    try {
      await fetch(`${apiUrl}/api/company-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error('Failed to save profile:', e)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-6 h-6 text-ink/40 animate-spin' />
      </div>
    )
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='font-display text-xl font-semibold'>Company Profile</h2>
        <button
          onClick={handleSave}
          disabled={saving || !profile.legalName}
          className='flex items-center gap-2 px-4 py-2 bg-ink text-lavender text-sm font-medium rounded-xl hover:opacity-90 disabled:opacity-30 transition-opacity'
        >
          {saving ? (
            <Loader2 className='w-4 h-4 animate-spin' />
          ) : saved ? (
            <CheckCircle className='w-4 h-4' />
          ) : (
            <Save className='w-4 h-4' />
          )}
          {saved ? 'Saved' : 'Save Profile'}
        </button>
      </div>

      {/* Business Details */}
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6 mb-6'>
        <h3 className='text-sm font-semibold text-ink mb-4'>Business Details</h3>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Legal Company Name *</label>
            <input
              type='text'
              value={profile.legalName}
              onChange={(e) => setProfile({ ...profile, legalName: e.target.value })}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              placeholder='Acme Corporation'
            />
          </div>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Trading Name</label>
            <input
              type='text'
              value={profile.tradingName}
              onChange={(e) => setProfile({ ...profile, tradingName: e.target.value })}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              placeholder='Acme'
            />
          </div>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Incorporation Country</label>
            <select
              value={profile.country}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Entity Type</label>
            <select
              value={profile.entityType}
              onChange={(e) => setProfile({ ...profile, entityType: e.target.value })}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
            >
              <option value="">Select entity type</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Registration Number</label>
            <input
              type='text'
              value={profile.registrationNumber}
              onChange={(e) => setProfile({ ...profile, registrationNumber: e.target.value })}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              placeholder='12345678'
            />
          </div>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Tax ID</label>
            <input
              type='text'
              value={profile.taxId}
              onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              placeholder='XX-1234567'
            />
          </div>
        </div>
      </div>

      {/* Operating Preferences */}
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6 mb-6'>
        <h3 className='text-sm font-semibold text-ink mb-4'>Operating Preferences</h3>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Local Currency</label>
            <select
              value={profile.localCurrency}
              onChange={(e) => setProfile({ ...profile, localCurrency: e.target.value })}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
            >
              <option value="">Select currency</option>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Fiscal Year Start (MM-DD)</label>
            <input
              type='text'
              value={profile.fiscalYearStart}
              onChange={(e) => setProfile({ ...profile, fiscalYearStart: e.target.value })}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              placeholder='01-01'
            />
          </div>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Contact Email</label>
            <input
              type='email'
              value={profile.contactEmail}
              onChange={(e) => setProfile({ ...profile, contactEmail: e.target.value })}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              placeholder='contact@acme.com'
            />
          </div>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Contact Phone</label>
            <input
              type='tel'
              value={profile.contactPhone}
              onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20'
              placeholder='+66 2 123 4567'
            />
          </div>
        </div>
      </div>

      {/* Registered Address */}
      <div className='bg-card rounded-2xl shadow-[0_4px_20px_rgba(43,36,64,0.06)] p-6'>
        <h3 className='text-sm font-semibold text-ink mb-4'>Registered Address</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Address</label>
            <textarea
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              rows={3}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20 resize-none'
              placeholder='123 Business Street, Suite 100&#10;Bangkok, 10110&#10;Thailand'
            />
          </div>
          <div>
            <label className='block text-xs text-ink/40 mb-1.5'>Business Description</label>
            <textarea
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              rows={3}
              className='w-full text-sm text-ink bg-ink/5 border border-ink/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-ink/20 resize-none'
              placeholder='Brief description of your business activities...'
            />
          </div>
        </div>
      </div>
    </div>
  )
}
