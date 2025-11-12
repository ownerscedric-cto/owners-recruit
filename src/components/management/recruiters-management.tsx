'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users,
  TrendingUp,
  AlertCircle,
  UserX,
  UserCheck
} from 'lucide-react'
import { getRecruiters, createRecruiter, updateRecruiter, deleteRecruiter, getRecruiterStats, toggleRecruiterStatus, type Recruiter, type RecruiterData } from '@/lib/recruiters'
import { getTeams, type Team } from '@/lib/teams'

interface RecruitersManagementProps {
  children: (content: ReactNode) => ReactNode // Layout wrapper
}

export default function RecruitersManagement({ children }: RecruitersManagementProps) {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [filteredRecruiters, setFilteredRecruiters] = useState<Recruiter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [teamFilter, setTeamFilter] = useState<string>('all')

  // 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRecruiter, setSelectedRecruiter] = useState<Recruiter | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 폼 데이터
  const [formData, setFormData] = useState<RecruiterData>({
    name: '',
    email: '',
    phone: '',
    team: ''
  })

  // 통계 데이터
  const [recruiterStats, setRecruiterStats] = useState<Record<string, any>>({})

  // 팀 목록
  const [teams, setTeams] = useState<Team[]>([])

  // 고유 팀 목록 (기존 모집인들의 팀명 + 등록된 팀들)
  const allTeams = Array.from(new Set([
    ...recruiters.map(r => r.team).filter(Boolean),
    ...teams.map(t => t.name)
  ])).sort()

  // 전화번호 포맷팅 함수 (표시용)
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
    } else if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  // 전화번호 포맷팅 함수 (입력용)
  const cleanPhoneNumber = (phone: string) => {
    return phone.replace(/\D/g, '')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      team: ''
    })
    setSelectedRecruiter(null)
  }

  useEffect(() => {
    fetchRecruiters()
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const result = await getTeams()
      if (result.success && result.data) {
        setTeams(result.data)
      }
    } catch (error) {
      console.error('팀 목록 조회 실패:', error)
    }
  }

  useEffect(() => {
    // 검색 및 필터링 로직
    let filtered = recruiters

    if (searchTerm) {
      filtered = filtered.filter(recruiter =>
        recruiter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recruiter.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recruiter.phone.includes(searchTerm) ||
        (recruiter.team && recruiter.team.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (teamFilter !== 'all') {
      filtered = filtered.filter(recruiter => recruiter.team === teamFilter)
    }

    setFilteredRecruiters(filtered)
  }, [recruiters, searchTerm, teamFilter])

  const fetchRecruiters = async () => {
    try {
      const result = await getRecruiters()
      if (result.success && result.data) {
        setRecruiters(result.data)

        // 각 모집인에 대한 통계 데이터 로드
        const stats: Record<string, any> = {}
        for (const recruiter of result.data) {
          const statResult = await getRecruiterStats(recruiter.id)
          if (statResult.success) {
            stats[recruiter.id] = statResult.data
          }
        }
        setRecruiterStats(stats)
      }
    } catch (error) {
      console.error('모집인 목록 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    try {
      const cleanedData = {
        ...formData,
        phone: cleanPhoneNumber(formData.phone)
      }
      const result = await createRecruiter(cleanedData)
      if (result.success) {
        setIsCreateModalOpen(false)
        resetForm()
        await fetchRecruiters()
      } else {
        alert('모집인 등록에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('모집인 등록 실패:', error)
      alert('모집인 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedRecruiter) return

    setIsSubmitting(true)
    try {
      const cleanedData = {
        ...formData,
        phone: cleanPhoneNumber(formData.phone)
      }
      const result = await updateRecruiter(selectedRecruiter.id, cleanedData)
      if (result.success) {
        setIsEditModalOpen(false)
        resetForm()
        await fetchRecruiters()
      } else {
        alert('모집인 정보 수정에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('모집인 수정 실패:', error)
      alert('모집인 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (recruiter: Recruiter) => {
    if (!confirm(`정말로 ${recruiter.name} 모집인을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteRecruiter(recruiter.id)
      if (result.success) {
        await fetchRecruiters()
      } else {
        alert('모집인 삭제에 실패했습니다: ' + result.error)
      }
    } catch (error) {
      console.error('모집인 삭제 실패:', error)
      alert('모집인 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleStatus = async (recruiter: Recruiter) => {
    const action = recruiter.active ? '비활성화' : '활성화'

    if (!confirm(`정말로 ${recruiter.name} 모집인을 ${action}하시겠습니까?`)) {
      return
    }

    try {
      const result = await toggleRecruiterStatus(recruiter.id, !recruiter.active)
      if (result.success) {
        await fetchRecruiters()
      } else {
        alert(`모집인 ${action}에 실패했습니다: ` + result.error)
      }
    } catch (error) {
      console.error(`모집인 ${action} 실패:`, error)
      alert(`모집인 ${action} 중 오류가 발생했습니다.`)
    }
  }

  const openEditModal = (recruiter: Recruiter) => {
    setSelectedRecruiter(recruiter)
    setFormData({
      name: recruiter.name,
      email: recruiter.email,
      phone: recruiter.phone,
      team: recruiter.team || ''
    })
    setIsEditModalOpen(true)
  }

  const handleCreateModalChange = (open: boolean) => {
    setIsCreateModalOpen(open)
    if (open) {
      resetForm()
    }
  }

  const handleEditModalChange = (open: boolean) => {
    setIsEditModalOpen(open)
    if (!open) {
      resetForm()
    }
  }

  const exportToExcel = () => {
    const headers = ['이름', '이메일', '전화번호', '팀', '총 지원자', '승인율']
    const csvContent = [
      headers.join(','),
      ...filteredRecruiters.map(recruiter => {
        const stats = recruiterStats[recruiter.id] || { total: 0, approved: 0 }
        const approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : '0'

        return [
          recruiter.name,
          recruiter.email,
          recruiter.phone,
          recruiter.team || '',
          stats.total,
          `${approvalRate}%`
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `모집인목록_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const content = (
    <div className="space-y-6">
      {/* 상단 필터 및 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>모집인 목록</CardTitle>
          <CardDescription>
            전체 {recruiters.length}명의 모집인이 등록되어 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="이름, 이메일, 전화번호, 팀으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="팀" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {allTeams.map(team => (
                    <SelectItem key={team} value={team}>{team}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={exportToExcel} variant="outline" size="sm">
                Excel 다운로드
              </Button>

              <Dialog open={isCreateModalOpen} onOpenChange={handleCreateModalChange}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    모집인 추가
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 모집인 등록</DialogTitle>
                    <DialogDescription>
                      새로운 모집인의 정보를 입력해주세요.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">이름 <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="email" className="text-right">이메일 <span className="text-red-500">*</span></Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="phone" className="text-right">전화번호 <span className="text-red-500">*</span></Label>
                      <Input
                        id="phone"
                        inputMode="numeric"
                        value={formatPhoneNumber(formData.phone)}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '')
                          if (cleaned.length <= 11) {
                            setFormData({...formData, phone: cleaned})
                          }
                        }}
                        placeholder="010-0000-0000"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="team" className="text-right">팀 <span className="text-red-500">*</span></Label>
                      <div className="col-span-3">
                        <Select
                          value={formData.team}
                          onValueChange={(value) => setFormData({...formData, team: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="팀을 선택하세요" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.name}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? '등록 중...' : '등록'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* 모집인 테이블 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>모집인 정보</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>팀</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>지원자 현황</TableHead>
                  <TableHead>가입일</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">데이터를 불러오는 중...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredRecruiters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        {searchTerm || teamFilter !== 'all'
                          ? '검색 조건에 맞는 모집인이 없습니다.'
                          : '등록된 모집인이 없습니다.'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecruiters.map((recruiter) => {
                    const stats = recruiterStats[recruiter.id] || { total: 0, approved: 0 }
                    const approvalRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : '0'

                    return (
                      <TableRow key={recruiter.id} className={!recruiter.active ? "opacity-60" : ""}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{recruiter.name}</div>
                            <div className="text-sm text-gray-500">{recruiter.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatPhoneNumber(recruiter.phone)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{recruiter.team}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={recruiter.active ? "default" : "secondary"}>
                            {recruiter.active ? (
                              <>
                                <UserCheck className="h-3 w-3 mr-1" />
                                활성
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                비활성
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              <span>{stats.total}명</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <TrendingUp className="h-4 w-4" />
                              <span>승인율 {approvalRate}%</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(recruiter.created_at).toLocaleDateString('ko-KR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(recruiter)}
                              title="수정"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(recruiter)}
                              className={recruiter.active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                              title={recruiter.active ? "비활성화" : "활성화"}
                            >
                              {recruiter.active ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(recruiter)}
                              className="text-red-600 hover:text-red-700"
                              title="삭제"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '전체 모집인', count: recruiters.length, color: 'bg-blue-100' },
          { label: '팀 수', count: allTeams.length, color: 'bg-green-100' },
          { label: '이번 달', count: recruiters.filter(r => {
            const createdDate = new Date(r.created_at)
            const now = new Date()
            return createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear()
          }).length, color: 'bg-gray-100' },
          { label: '총 지원자', count: Object.values(recruiterStats).reduce((sum: number, stat: any) => sum + (stat.total || 0), 0), color: 'bg-purple-100' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className={`p-4 ${stat.color}`}>
              <div className="text-center">
                <div className="text-2xl font-bold">{stat.count}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 수정 모달 */}
      <Dialog open={isEditModalOpen} onOpenChange={handleEditModalChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>모집인 정보 수정</DialogTitle>
            <DialogDescription>
              {selectedRecruiter?.name}의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">이름 <span className="text-red-500">*</span></Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">이메일 <span className="text-red-500">*</span></Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">전화번호 <span className="text-red-500">*</span></Label>
              <Input
                id="edit-phone"
                inputMode="numeric"
                value={formatPhoneNumber(formData.phone)}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '')
                  if (cleaned.length <= 11) {
                    setFormData({...formData, phone: cleaned})
                  }
                }}
                placeholder="010-0000-0000"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-team" className="text-right">팀 <span className="text-red-500">*</span></Label>
              <div className="col-span-3">
                <Select
                  value={formData.team}
                  onValueChange={(value) => setFormData({...formData, team: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="팀을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.name}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? '수정 중...' : '수정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  return children(content)
}