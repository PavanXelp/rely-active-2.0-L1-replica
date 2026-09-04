import { useCallback, useEffect, useState } from 'react'

import {
  User,
  Users,
  Phone,
  Mail,
  Home,
  ShieldCheck,
  Building,
  Heart,
  Calendar,
  BadgeCheck,
  RefreshCw,
  Utensils,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useAuthStore, type ResidentUser } from '@/lib/stores/auth-store'
import { toast } from 'sonner'

export interface FoodPackageDetails {
  id?: string
  name?: string
  code?: string
  dietaryType?: string
  includedMealSlots?: string[]
  status?: string
  startDate?: string
  endDate?: string | null
}

export interface PropertyDetails {
  id?: string | null
  flatNumber: string
  unitType?: string
  floorName: string
  blockName: string
  propertyName: string
}

export interface FamilyMember {
  id: string
  firstName: string
  lastName?: string | null
  relation: string
  isResiding?: boolean
  gender?: string | null
  dob?: string | null
  bloodGroup?: string | null
  phone?: string | null
  email?: string | null
  username?: string | null
  foodPackage?: FoodPackageDetails | null
}

export interface DetailedResidentProfile extends ResidentUser {
  gender?: string
  dob?: string
  username?: string
  email?: string
  phone?: string
  status?: string
  ownershipType?: string
  residentType?: string
  isResiding?: boolean
  unit?: {
    id?: string
    unitNumber?: string
    unit_number?: string
    floorNumber?: number
    unitType?: string
    occupancyStatus?: string
  }
  propertyDetails?: PropertyDetails
  foodPackage?: FoodPackageDetails | null
  primaryResident?: {
    id: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    foodPackage?: FoodPackageDetails | null
  }
  familyMembers?: FamilyMember[]
}

export default function ProfilePage() {
  const localResident = useAuthStore((state) => state.resident)
  const [profile, setProfile] = useState<DetailedResidentProfile | null>(localResident || null)
  const [loading, setLoading] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/mobile/l1/resident/auth/profile')
      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data)
      } else {
        toast.error('Failed to load profile details')
      }
    } catch (err: unknown) {
      console.error('Error fetching resident profile:', err)
      toast.error('Unable to fetch latest profile details')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    const loadData = async () => {
      if (!ignore) {
        await fetchProfile()
      }
    }
    void loadData()
    return () => {
      ignore = true
    }
  }, [fetchProfile])

  const familyMembersList: FamilyMember[] = profile?.familyMembers || []
  const propDetails = profile?.propertyDetails
  const resFoodPkg = profile?.foodPackage

  return (
    <div className="space-y-5 pb-8 select-none font-sans">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-[#005390] to-blue-700 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-white/20 text-white border-none px-2.5 py-0.5 text-[10px] font-bold">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-300" /> Resident Profile
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchProfile}
              disabled={loading}
              className="h-7 w-7 p-0 text-white hover:bg-white/20 rounded-full cursor-pointer"
              title="Refresh profile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white text-xl font-black shadow-inner shrink-0">
              {profile?.firstName ? profile.firstName.charAt(0).toUpperCase() : 'R'}
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-tight">
                {profile?.firstName || 'Resident'} {profile?.lastName || ''}
              </h2>
              <p className="text-xs text-blue-100 flex items-center gap-1.5 mt-0.5">
                <Home className="w-3.5 h-3.5 text-blue-200" />
                <span>
                  Flat{' '}
                  {propDetails?.flatNumber && propDetails.flatNumber !== 'N/A'
                    ? propDetails.flatNumber
                    : profile?.unit?.unitNumber || profile?.unit?.unit_number || profile?.unitNumber || 'N/A'}
                </span>
                <span>
                  •{' '}
                  {propDetails?.propertyName && propDetails.propertyName !== 'N/A'
                    ? propDetails.propertyName
                    : profile?.propertyName || 'N/A'}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[9px] font-extrabold bg-emerald-400/25 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30 uppercase">
                  {profile?.status || 'Active'}
                </span>
                <span className="text-[9px] font-extrabold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase">
                  {profile?.residentType || 'Resident'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Property & Unit Location Card */}
      <div className="space-y-2">
        <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-[#005390]" />
          Property & Flat Location
        </h3>

        <Card className="rounded-2xl border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Property Name</span>
                <span className="font-extrabold text-gray-900 dark:text-gray-100 block mt-0.5 truncate">
                  {propDetails?.propertyName && propDetails.propertyName !== 'N/A'
                    ? propDetails.propertyName
                    : profile?.propertyName || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Block / Tower</span>
                <span className="font-extrabold text-gray-900 dark:text-gray-100 block mt-0.5">
                  {propDetails?.blockName || 'N/A'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Floor</span>
                <span className="font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mt-0.5">
                  <Layers className="w-3 h-3 text-blue-500 shrink-0" />
                  {propDetails?.floorName || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Flat / Unit</span>
                <span className="font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mt-0.5">
                  <Home className="w-3 h-3 text-blue-500 shrink-0" />
                  {propDetails?.flatNumber && propDetails.flatNumber !== 'N/A'
                    ? propDetails.flatNumber
                    : profile?.unit?.unitNumber || profile?.unit?.unit_number || profile?.unitNumber || 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resident Food Package Subscription Card */}
      <div className="space-y-2">
        <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-[#005390]" />
          Food Package Subscription
        </h3>

        <Card
          className={`rounded-2xl border ${resFoodPkg ? 'border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-slate-900/60' : 'border-gray-200 dark:border-slate-800'} shadow-xs overflow-hidden`}
        >
          <CardContent className="p-4 space-y-2.5">
            {resFoodPkg ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span className="font-black text-xs text-gray-900 dark:text-white">
                      {resFoodPkg.name || 'Active Food Package'}
                    </span>
                  </div>
                  <Badge className="bg-emerald-500 text-white text-[9px] font-extrabold border-none uppercase">
                    {resFoodPkg.status || 'Active'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium pt-1">
                  <span>
                    Dietary:{' '}
                    <strong className="text-gray-800 dark:text-gray-200">{resFoodPkg.dietaryType || 'Standard'}</strong>
                  </span>
                </div>

                {resFoodPkg.includedMealSlots && resFoodPkg.includedMealSlots.length > 0 ? (
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-muted-foreground">Included:</span>
                    {resFoodPkg.includedMealSlots.map((slot) => (
                      <Badge
                        key={slot}
                        variant="secondary"
                        className="text-[9px] font-extrabold capitalize bg-white dark:bg-slate-800 border"
                      >
                        {slot}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground block">Included Slots: N/A</span>
                )}
              </>
            ) : (
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2 text-xs">
                  <Utensils className="w-4 h-4 text-gray-400" />
                  <span className="font-bold text-gray-700 dark:text-gray-300">Food Package:</span>
                </div>
                <Badge variant="outline" className="text-[10px] font-extrabold text-muted-foreground border-gray-300">
                  N/A
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resident Details Card */}
      <div className="space-y-2">
        <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#005390]" />
          Resident Information
        </h3>

        <Card className="rounded-2xl border-gray-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Phone</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                  {profile?.primaryPhone || profile?.phone || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Email</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mt-0.5 truncate">
                  <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                  <span className="truncate">{profile?.email || 'N/A'}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Username</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mt-0.5">
                  <BadgeCheck className="w-3 h-3 text-blue-500 shrink-0" />
                  {profile?.username || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Ownership</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5 mt-0.5">
                  <Building className="w-3 h-3 text-blue-500 shrink-0" />
                  {profile?.ownershipType || 'N/A'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Gender</span>
                <span className="font-bold text-gray-900 dark:text-gray-100 mt-0.5 block">
                  {profile?.gender || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase block">Residing Status</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {profile?.isResiding !== false ? 'Currently Residing' : 'Non-residing'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Family Members Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#005390]" />
            Family Members
          </h3>
          <Badge variant="outline" className="text-[10px] font-extrabold border-blue-200 text-[#005390]">
            {familyMembersList.length} {familyMembersList.length === 1 ? 'Member' : 'Members'}
          </Badge>
        </div>

        {familyMembersList.length === 0 ? (
          <Card className="rounded-2xl border-dashed border-gray-200 dark:border-slate-800 p-5 text-center">
            <CardContent className="p-0 space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 text-[#005390] mx-auto flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">No Family Members Registered</p>
              <p className="text-[11px] text-muted-foreground">
                There are currently no family member profiles linked to this resident account.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {familyMembersList.map((member) => {
              const fmPkg = member.foodPackage

              return (
                <Card
                  key={member.id}
                  className="rounded-2xl border-gray-200 dark:border-slate-800 shadow-xs hover:border-blue-300 transition-all overflow-hidden"
                >
                  <CardContent className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                          {member.firstName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-gray-900 dark:text-gray-100">
                            {member.firstName} {member.lastName || ''}
                          </h4>
                          <p className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
                            <span>Relation: {member.relation || 'N/A'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-blue-50 dark:bg-blue-950 text-[#005390] dark:text-blue-300 border-none text-[9px] font-extrabold uppercase">
                          {member.relation || 'Family'}
                        </Badge>
                        {member.isResiding !== false && (
                          <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                            • Residing
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-gray-100 dark:border-slate-800 text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{member.phone || 'N/A'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{member.email || 'N/A'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>Gender: {member.gender || 'N/A'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-blue-500 shrink-0" />
                        <span>DOB: {member.dob ? String(member.dob).split('T')[0] : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Family Member Food Package Status */}
                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <Utensils className="w-3 h-3 text-[#005390]" />
                        Food Package:
                      </span>
                      {fmPkg ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[#005390] text-[10px]">{fmPkg.name}</span>
                          <Badge className="bg-emerald-500 text-white text-[8px] font-extrabold py-0 px-1 border-none">
                            ACTIVE
                          </Badge>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[9px] font-extrabold text-muted-foreground border-gray-300"
                        >
                          N/A
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
