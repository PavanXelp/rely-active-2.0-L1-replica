import { useState, useEffect } from 'react'
import { Plus, QrCode, Edit2, Trash2 } from 'lucide-react'
import { gateApi, type CreatePreapprovedPayload } from '@/lib/services/gateApi'
import { useAuthStore } from '@/lib/stores/auth-store'

import { CheckCircle2, XCircle, X } from 'lucide-react'

export default function GatePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [preapproved, setPreapproved] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [walkins, setWalkins] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'PENDING' | 'INVITES' | 'ENTRY_LOGS' | 'GUESTS'>('INVITES')
  const [viewPhoto, setViewPhoto] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [guestMasters, setGuestMasters] = useState<any[]>([])
  const [newGuest, setNewGuest] = useState({ name: '', phone: '', notes: '' })

  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [visitorTypeFilter, setVisitorTypeFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')

  const { resident } = useAuthStore()
  const initialFormData: Partial<CreatePreapprovedPayload> = {
    visitorType: 'Guest',
    visitorName: '',
    visitorPhone: '',
    startDate: '',
    startTime: '',
    flatNumber: '',
    vehicleNumber: '',
    company: '',
    personToMeet: '',
    notes: '',
    visitorPhotos: [],
    scheduleType: 'ONCE',
    endDate: '',
    endTime: '',
    additionalVisitors: [],
  }

  const [formData, setFormData] = useState<Partial<CreatePreapprovedPayload>>(initialFormData)
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>, index?: number) => {
    const files = e.target.files
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          if (index === undefined) {
            setFormData((prev) => ({
              ...prev,
              visitorPhotos: [...(prev.visitorPhotos || []), reader.result as string],
            }))
          } else {
            setFormData((prev) => {
              const newVisitors = [...(prev.additionalVisitors || [])]
              const currentPhotos = newVisitors[index].visitorPhotos || []
              newVisitors[index] = {
                ...newVisitors[index],
                visitorPhotos: [...currentPhotos, reader.result as string],
              }
              return { ...prev, additionalVisitors: newVisitors }
            })
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const fetchGuestMasters = async () => {
    try {
      const res = await gateApi.getGuestMasterList()
      if (res.success) setGuestMasters(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCreateGuest = async () => {
    if (!newGuest.name) return alert('Name is required')
    try {
      setLoading(true)
      await gateApi.createGuestMaster(newGuest)
      setNewGuest({ name: '', phone: '', notes: '' })
      fetchGuestMasters()
    } catch (err) {
      console.error(err)
      alert('Error creating guest')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGuest = async (id: string) => {
    if (!confirm('Delete this guest?')) return
    try {
      setLoading(true)
      await gateApi.deleteGuestMaster(id)
      fetchGuestMasters()
    } catch (err) {
      console.error(err)
      alert('Error deleting guest')
    } finally {
      setLoading(false)
    }
  }

  const fetchWalkins = async () => {
    try {
      const res = await gateApi.getWalkins(dateFilter)
      if (res.success) setWalkins(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchPreapproved = async () => {
    try {
      const res = await gateApi.getPreapproved({
        page,
        limit: 10,
        status: statusFilter,
        visitorType: visitorTypeFilter,
        date: dateFilter,
      })
      if (res.success) {
        setPreapproved(res.data.rows || [])
        setTotalPages(res.data.totalPages || 1)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPreapproved()
    fetchWalkins()
    fetchGuestMasters()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, visitorTypeFilter, dateFilter])

  const handleUpdateWalkin = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      setLoading(true)
      await gateApi.updateWalkinStatus(id, status)
      fetchWalkins()
    } catch (err) {
      console.error(err)
      alert('Failed to update walk-in status')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.visitorName) return alert('Name is required')
    setLoading(true)
    try {
      const payload: CreatePreapprovedPayload = {
        visitorName: formData.visitorName,
        visitorPhone: formData.visitorPhone,
        visitorType: formData.visitorType as CreatePreapprovedPayload['visitorType'],
        startDate: formData.startDate,
        startTime: formData.startTime,
        flatNumber: formData.visitorType === 'Office' ? undefined : formData.flatNumber,
        vehicleNumber: formData.vehicleNumber,
        company: formData.company,
        personToMeet: formData.personToMeet,
        notes: formData.notes,
        visitorPhotos: formData.visitorPhotos,
        additionalVisitors: formData.additionalVisitors,
        scheduleType: formData.scheduleType,
        endDate: formData.endDate,
        endTime: formData.endTime,
        locId: resident?.locId || resident?.locationId || '',
        unitId: resident?.unitId || resident?.unitNumber,
      }

      if (editingId) {
        await gateApi.updatePreapproved(editingId, payload)
      } else {
        await gateApi.createPreapproved(payload)
      }

      setIsCreating(false)
      setEditingId(null)
      setFormData(initialFormData)
      fetchPreapproved()
    } catch (err) {
      console.error(err)
      alert(editingId ? 'Error updating preapproved' : 'Error creating preapproved')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditPreapproved = (item: any) => {
    setFormData({
      visitorType: item.visitorType || 'Guest',
      visitorName: item.visitorName || '',
      visitorPhone: item.visitorPhone || '',
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      startTime: item.startTime || '',
      flatNumber: item.flatNumber || '',
      vehicleNumber: item.vehicleNumber || '',
      company: item.company || '',
      personToMeet: item.personToMeet || '',
      notes: item.notes || '',
      visitorPhotos: item.visitorPhotos || [],
      scheduleType: item.scheduleType || 'ONCE',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      endTime: item.endTime || '',
      additionalVisitors: item.additionalVisitors || [],
    })
    setEditingId(item.id)
    setIsCreating(true)
  }

  const handleDeletePreapproved = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pre-approved invite?')) return
    try {
      setLoading(true)
      await gateApi.deletePreapproved(id)
      fetchPreapproved()
    } catch (err) {
      console.error(err)
      alert('Error deleting preapproved invite')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 pb-24 max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Gate</h1>
          <p className="text-sm text-gray-500">Manage your visitors</p>
        </div>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="p-3 bg-[#005390] text-white rounded-full shadow-lg">
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {isCreating ? (
        <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold">{editingId ? 'Edit Preapproved' : 'Create Preapproved'}</h2>

          <div className="space-y-3">
            {/* Schedule Section Moved to Top */}
            <div>
              <label htmlFor="scheduleType" className="text-xs font-semibold text-gray-500">
                Schedule Type
              </label>
              <select
                id="scheduleType"
                value={formData.scheduleType}
                onChange={(e) =>
                  setFormData({ ...formData, scheduleType: e.target.value as CreatePreapprovedPayload['scheduleType'] })
                }
                className="w-full mt-1 p-3 border rounded-xl bg-gray-50 text-sm"
              >
                <option value="ONCE">Once (Single Entry)</option>
                <option value="FREQUENT">Frequently (Multiple Entries)</option>
              </select>
            </div>

            <div className={`grid ${formData.scheduleType === 'FREQUENT' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}>
              <div>
                <label htmlFor="startDate" className="text-xs font-semibold text-gray-500">
                  {formData.scheduleType === 'FREQUENT' ? 'Start Date' : 'Date'}
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl bg-gray-50 text-sm"
                />
              </div>
              {formData.scheduleType === 'FREQUENT' && (
                <div>
                  <label htmlFor="endDate" className="text-xs font-semibold text-gray-500">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full mt-1 p-3 border rounded-xl bg-gray-50 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label htmlFor="startTime" className="text-xs font-semibold text-gray-500">
                  Start Time
                </label>
                <input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl bg-gray-50 text-sm"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="text-xs font-semibold text-gray-500">
                  End Time
                </label>
                <input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full mt-1 p-3 border rounded-xl bg-gray-50 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="visitorType" className="text-xs font-semibold text-gray-500">
                Visitor Type
              </label>
              <select
                id="visitorType"
                value={formData.visitorType}
                onChange={(e) =>
                  setFormData({ ...formData, visitorType: e.target.value as CreatePreapprovedPayload['visitorType'] })
                }
                className="w-full mt-1 p-3 border rounded-xl bg-gray-50 text-sm"
              >
                {['Guest', 'Delivery', 'Cab', 'Other'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {formData.visitorType === 'Guest' && guestMasters.length > 0 && (
              <div>
                <label htmlFor="savedGuest" className="text-xs font-semibold text-gray-500">
                  Select Saved Guest (Optional)
                </label>
                <select
                  id="savedGuest"
                  onChange={(e) => {
                    const guest = guestMasters.find((g) => g.id === e.target.value)
                    if (guest) {
                      setFormData({
                        ...formData,
                        visitorName: guest.name as string,
                        visitorPhone: (guest.phone as string) || '',
                      })
                    } else {
                      setFormData({ ...formData, visitorName: '', visitorPhone: '' })
                    }
                  }}
                  className="w-full mt-1 p-3 border rounded-xl bg-gray-50 text-sm"
                >
                  <option value="">-- Choose a guest --</option>
                  {guestMasters.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} - {g.phone}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="visitorName" className="text-xs font-semibold text-gray-500">
                Name
              </label>
              <input
                id="visitorName"
                type="text"
                value={formData.visitorName}
                onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                placeholder="Visitor Name"
                className="w-full mt-1 p-3 border rounded-xl bg-gray-50 text-sm"
              />
            </div>

            <div>
              <label htmlFor="visitorPhone" className="text-xs font-semibold text-gray-500">
                Phone
              </label>
              <input
                id="visitorPhone"
                type="tel"
                value={formData.visitorPhone}
                onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                placeholder="Phone Number"
                className="w-full mt-1 p-3 border rounded-xl bg-gray-50 text-sm"
              />
            </div>

            <div>
              <label htmlFor="capturePhotos" className="text-xs font-semibold text-gray-500">
                Capture Photos (Optional)
              </label>
              <input
                id="capturePhotos"
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => handlePhotoCapture(e)}
                className="w-full mt-1 p-2 border rounded-xl bg-gray-50 text-sm"
              />
              {formData.visitorPhotos && formData.visitorPhotos.length > 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {formData.visitorPhotos.map((photo, idx) => (
                    <img key={idx} src={photo} alt="Visitor" className="h-20 w-20 object-cover rounded-xl shrink-0" />
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Visitors */}

            {(formData.additionalVisitors || []).length > 0 && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                <h3 className="text-xs font-bold text-gray-700">Additional Visitors</h3>
                {formData.additionalVisitors?.map((visitor, index) => (
                  <div key={index} className="space-y-2 pb-2 border-b border-gray-200 last:border-0 last:pb-0 relative">
                    <button
                      onClick={() => {
                        const newVisitors = (formData.additionalVisitors || []).filter((_, i) => i !== index)
                        setFormData({ ...formData, additionalVisitors: newVisitors })
                      }}
                      className="absolute -top-1 -right-1 text-red-500 bg-red-50 p-1 rounded-full hover:bg-red-100"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {formData.visitorType === 'Guest' && guestMasters.length > 0 && (
                      <select
                        onChange={(e) => {
                          const guest = guestMasters.find((g) => g.id === e.target.value)
                          const newVisitors = [...(formData.additionalVisitors || [])]
                          if (guest) {
                            newVisitors[index] = { ...newVisitors[index], name: guest.name, phone: guest.phone || '' }
                          } else {
                            newVisitors[index] = { ...newVisitors[index], name: '', phone: '' }
                          }
                          setFormData({ ...formData, additionalVisitors: newVisitors })
                        }}
                        className="w-full p-2 border rounded-lg bg-white text-xs"
                      >
                        <option value="">-- Select Saved Guest --</option>
                        {guestMasters.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name} - {g.phone}
                          </option>
                        ))}
                      </select>
                    )}

                    <input
                      type="text"
                      placeholder={`Visitor ${index + 2} Name`}
                      value={visitor.name}
                      onChange={(e) => {
                        const newVisitors = [...(formData.additionalVisitors || [])]
                        newVisitors[index] = { ...newVisitors[index], name: e.target.value }
                        setFormData({ ...formData, additionalVisitors: newVisitors })
                      }}
                      className="w-full p-2 border rounded-lg bg-white text-xs"
                    />
                    <input
                      type="tel"
                      placeholder={`Visitor ${index + 2} Phone`}
                      value={visitor.phone}
                      onChange={(e) => {
                        const newVisitors = [...(formData.additionalVisitors || [])]
                        newVisitors[index] = { ...newVisitors[index], phone: e.target.value }
                        setFormData({ ...formData, additionalVisitors: newVisitors })
                      }}
                      className="w-full p-2 border rounded-lg bg-white text-xs"
                    />
                    <div className="pt-1">
                      <label htmlFor={`photo-${index}`} className="text-[10px] font-semibold text-gray-500 block mb-1">
                        Photos (Optional)
                      </label>
                      <input
                        id={`photo-${index}`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={(e) => handlePhotoCapture(e, index)}
                        className="w-full p-1.5 border rounded-lg bg-white text-[10px]"
                      />
                      {visitor.visitorPhotos && visitor.visitorPhotos.length > 0 && (
                        <div className="flex gap-2 mt-2 overflow-x-auto">
                          {visitor.visitorPhotos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`Visitor ${index + 2}`}
                              className="h-16 w-16 object-cover rounded-lg shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                const newVisitors = [...(formData.additionalVisitors || []), { name: '', phone: '' }]
                setFormData({ ...formData, additionalVisitors: newVisitors })
              }}
              className="w-full py-2 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-100 flex justify-center items-center gap-1 hover:bg-blue-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Person
            </button>

            <div>
              <label htmlFor="vehicleNumber" className="text-xs font-semibold text-gray-500">
                Vehicle Number
              </label>
              <input
                id="vehicleNumber"
                type="text"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                placeholder="Optional"
                className="w-full mt-1 p-3 border rounded-xl bg-gray-50 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              onClick={() => {
                setIsCreating(false)
                setEditingId(null)
                setFormData(initialFormData)
              }}
              className="flex-1 p-3 border border-gray-200 rounded-xl font-semibold text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 p-3 bg-[#005390] text-white rounded-xl font-bold disabled:opacity-50"
            >
              {editingId ? 'Update' : 'Generate QR'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('INVITES')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'INVITES' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Pre-Approved
            </button>
            <button
              onClick={() => setActiveTab('ENTRY_LOGS')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'ENTRY_LOGS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Entry Logs
              {walkins.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {walkins.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('GUESTS')}
              className={`flex-1 py-2 text-sm font-bold rounded-lg ${activeTab === 'GUESTS' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Guests
            </button>
          </div>

          {activeTab === 'GUESTS' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold mb-3 text-sm">Add New Guest</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Guest Name"
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm bg-gray-50"
                  />
                  <input
                    type="tel"
                    placeholder="Guest Phone"
                    value={newGuest.phone}
                    onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm bg-gray-50"
                  />
                  <input
                    type="text"
                    placeholder="Notes (Optional)"
                    value={newGuest.notes}
                    onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                    className="w-full p-2 border rounded-lg text-sm bg-gray-50"
                  />
                  <button
                    onClick={handleCreateGuest}
                    disabled={loading || !newGuest.name}
                    className="w-full bg-[#005390] text-white p-2 rounded-lg font-semibold text-sm disabled:opacity-50"
                  >
                    Save Guest
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {guestMasters.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-10 font-medium">No saved guests found</div>
                ) : (
                  guestMasters.map((guest) => (
                    <div
                      key={guest.id}
                      className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm"
                    >
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{guest.name}</h4>
                        {guest.phone && <p className="text-xs text-gray-500">{guest.phone}</p>}
                        {guest.notes && <p className="text-xs text-gray-400 mt-1">{guest.notes}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="text-red-500 bg-red-50 p-2 rounded-full hover:bg-red-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {(activeTab === 'INVITES' || activeTab === 'ENTRY_LOGS') && (
            <div className="space-y-4">
              {activeTab === 'ENTRY_LOGS' && walkins.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 border-b pb-2">Pending Approvals</h2>
                  {walkins.map((walkin) => (
                    <div key={walkin.id} className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-[10px] font-bold rounded-md">
                            {walkin.visitorType} Walk-in
                          </span>
                          <h3 className="font-bold text-gray-900 text-sm mt-1">{walkin.visitorName}</h3>
                          <p className="text-xs text-gray-600 font-medium">Phone: {walkin.visitorPhone || 'N/A'}</p>
                        </div>
                        {walkin.visitorPhotos && walkin.visitorPhotos.length > 0 && (
                          <div
                            className="flex -space-x-2 relative cursor-pointer group"
                            onClick={() => setViewPhoto(walkin.visitorPhotos[0])}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') setViewPhoto(walkin.visitorPhotos[0])
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            {walkin.visitorPhotos.slice(0, 3).map((photo: string, idx: number) => (
                              <img
                                key={idx}
                                src={photo}
                                alt="Visitor"
                                className="h-16 w-16 object-cover rounded-full border-2 border-white shrink-0 group-hover:opacity-80 transition-opacity"
                              />
                            ))}
                            {walkin.visitorPhotos.length > 3 && (
                              <div className="h-16 w-16 rounded-full bg-white/80 flex items-center justify-center border-2 border-white text-gray-500 font-bold shrink-0 text-xs">
                                +{walkin.visitorPhotos.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mt-2 mb-3 bg-white/50 p-2 rounded-xl">
                        {walkin.flatNumber && (
                          <div>
                            <b>Flat:</b> {walkin.flatNumber}
                          </div>
                        )}
                        {walkin.company && (
                          <div>
                            <b>Company:</b> {walkin.company}
                          </div>
                        )}
                        {walkin.vehicleNumber && (
                          <div>
                            <b>Vehicle:</b> {walkin.vehicleNumber}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateWalkin(walkin.id, 'Rejected')}
                          disabled={loading}
                          className="flex-1 p-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold flex justify-center items-center gap-1 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => handleUpdateWalkin(walkin.id, 'Approved')}
                          disabled={loading}
                          className="flex-1 p-2 bg-emerald-500 text-white rounded-xl font-bold flex justify-center items-center gap-1 hover:bg-emerald-600 shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-3 px-1 mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {activeTab === 'INVITES' ? 'My Pre-Approved' : 'Entry Logs'}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="p-1.5 border rounded-md text-xs text-gray-700 bg-gray-50 font-medium"
                  >
                    <option value="">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Inside">Inside</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                  </select>
                  <select
                    value={visitorTypeFilter}
                    onChange={(e) => {
                      setVisitorTypeFilter(e.target.value)
                      setPage(1)
                    }}
                    className="p-1.5 border rounded-md text-xs text-gray-700 bg-gray-50 font-medium"
                  >
                    <option value="">All Types</option>
                    <option value="Guest">Guest</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Cab">Cab</option>
                    <option value="Other">Other</option>
                  </select>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value)
                      setPage(1)
                    }}
                    className="p-1.5 border rounded-md text-xs text-gray-700 bg-gray-50 font-medium w-32"
                  />
                </div>
              </div>
              {preapproved
                .filter((preapproved) => (activeTab === 'INVITES' ? !preapproved.isLogOnly : true))
                .map((preapproved) => (
                  <div
                    key={preapproved.id}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 flex gap-3 items-start">
                        {preapproved.visitorPhotos && preapproved.visitorPhotos.length > 0 ? (
                          <div
                            className="flex -space-x-2 relative cursor-pointer group mt-1"
                            onClick={() => setViewPhoto(preapproved.visitorPhotos[0])}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') setViewPhoto(preapproved.visitorPhotos[0])
                            }}
                            role="button"
                            tabIndex={0}
                          >
                            {preapproved.visitorPhotos.slice(0, 3).map((photo: string, idx: number) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={preapproved.visitorName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shrink-0 group-hover:opacity-80 transition-opacity"
                              />
                            ))}
                            {preapproved.visitorPhotos.length > 3 && (
                              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white text-gray-500 font-bold shrink-0 text-xs">
                                +{preapproved.visitorPhotos.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-gray-500 font-bold shrink-0 mt-1">
                            {preapproved.visitorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md flex items-center gap-1">
                              {preapproved.visitorType} {preapproved.isWalkin ? 'Walk-in' : ''}
                              {preapproved.scheduleType === 'FREQUENT' && (
                                <span className="bg-purple-100 text-purple-700 px-1 rounded-sm">Freq</span>
                              )}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                (preapproved.entryStatus || preapproved.status) === 'Pending'
                                  ? 'text-amber-500'
                                  : (preapproved.entryStatus || preapproved.status) === 'Inside'
                                    ? 'text-blue-500'
                                    : (preapproved.entryStatus || preapproved.status) === 'Rejected'
                                      ? 'text-red-500'
                                      : 'text-emerald-500'
                              }`}
                            >
                              {preapproved.entryStatus || preapproved.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm">{preapproved.visitorName}</h3>
                          <div className="flex items-center flex-wrap gap-3 text-xs text-gray-500 mt-1">
                            {preapproved.clockedInAt && (
                              <span className="flex items-center gap-1 font-medium text-emerald-600">
                                In: {new Date(preapproved.clockedInAt).toLocaleTimeString()}
                              </span>
                            )}
                            {preapproved.clockedOutAt && (
                              <span className="flex items-center gap-1 font-medium text-gray-600">
                                Out: {new Date(preapproved.clockedOutAt).toLocaleTimeString()}
                              </span>
                            )}
                            <div className="text-xs text-gray-500 space-y-1">
                              {!preapproved.clockedInAt && preapproved.startDate && (
                                <p>
                                  <span className="font-semibold text-gray-600">
                                    {preapproved.scheduleType === 'FREQUENT' ? 'Start Date:' : 'Date:'}
                                  </span>{' '}
                                  {new Date(preapproved.startDate).toLocaleDateString()}
                                </p>
                              )}
                              {!preapproved.clockedInAt &&
                                preapproved.endDate &&
                                preapproved.scheduleType === 'FREQUENT' && (
                                  <p>
                                    <span className="font-semibold text-gray-600">End Date:</span>{' '}
                                    {new Date(preapproved.endDate).toLocaleDateString()}
                                  </p>
                                )}
                              {!preapproved.clockedInAt && preapproved.startTime && (
                                <p>
                                  <span className="font-semibold text-gray-600">Start Time:</span>{' '}
                                  {preapproved.startTime}
                                </p>
                              )}
                              {!preapproved.clockedInAt && preapproved.endTime && (
                                <p>
                                  <span className="font-semibold text-gray-600">End Time:</span> {preapproved.endTime}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {!preapproved.isWalkin &&
                        !['Completed', 'Rejected', 'Expired', 'Cancelled'].includes(
                          preapproved.entryStatus || preapproved.status,
                        ) && (
                          <div className="flex flex-col items-center justify-center shrink-0 w-28">
                            {preapproved.qrCodeImage ? (
                              <button
                                onClick={() => setViewPhoto(preapproved.qrCodeImage as string)}
                                className="hover:opacity-80 transition-opacity"
                              >
                                <img
                                  src={preapproved.qrCodeImage}
                                  alt="QR Code"
                                  className="w-24 h-24 rounded-lg object-contain bg-white border border-gray-200 p-1 shadow-sm cursor-pointer"
                                />
                              </button>
                            ) : (
                              <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center mb-1">
                                <QrCode className="w-8 h-8 text-gray-700" />
                              </div>
                            )}
                            <span
                              className="text-[9px] font-mono font-medium text-gray-400 mt-2 break-all w-full text-center select-all"
                              title={preapproved.qrCode}
                            >
                              {preapproved.qrCode}
                            </span>
                          </div>
                        )}
                    </div>

                    {/* Actions for Pre-approved Items */}
                    {!preapproved.isWalkin &&
                      activeTab === 'INVITES' &&
                      (preapproved.entryStatus || preapproved.status) === 'Pending' && (
                        <div className="flex justify-end gap-2 border-t pt-3 mt-1">
                          <button
                            onClick={() => handleEditPreapproved(preapproved)}
                            className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-[#005390] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePreapproved(preapproved.id)}
                            className="px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      )}
                  </div>
                ))}

              {preapproved.filter((preapproved) => (activeTab === 'INVITES' ? !preapproved.isLogOnly : true)).length ===
                0 && <div className="text-center py-8 text-sm text-gray-500 font-medium">No entries found</div>}

              {totalPages > 1 && (
                <div className="flex justify-between items-center px-1 mt-4">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1 bg-gray-100 rounded-md text-sm font-semibold disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm font-bold text-gray-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1 bg-gray-100 rounded-md text-sm font-semibold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm max-h-[90vh] bg-white rounded-2xl shadow-2xl p-2 flex flex-col">
            <button
              onClick={() => setViewPhoto(null)}
              className="absolute -top-4 -right-4 p-2 bg-white rounded-full text-gray-500 hover:text-gray-900 shadow-md border border-gray-200 z-[110]"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={viewPhoto}
              alt="Enlarged visitor view"
              className="w-full h-full object-contain rounded-xl max-h-[85vh]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
