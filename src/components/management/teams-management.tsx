'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { getTeams, createTeam, updateTeam, deleteTeam, type Team, type TeamData } from '@/lib/teams'

interface TeamsManagementProps {
  children: (content: ReactNode) => ReactNode
}

export default function TeamsManagement({ children }: TeamsManagementProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 알림 상태
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // 폼 데이터
  const [formData, setFormData] = useState<TeamData>({
    name: '',
    description: ''
  })

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    // 검색 필터링
    if (searchTerm) {
      const filtered = teams.filter(team =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredTeams(filtered)
    } else {
      setFilteredTeams(teams)
    }
  }, [teams, searchTerm])

  const fetchTeams = async () => {
    try {
      const result = await getTeams()
      if (result.success && result.data) {
        setTeams(result.data)
      } else {
        showAlert('error', result.error || '팀 목록을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('팀 목록 조회 실패:', error)
      showAlert('error', '팀 목록 조회 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    })
    setSelectedTeam(null)
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      showAlert('error', '팀 이름은 필수입니다.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createTeam(formData)
      if (result.success) {
        setIsCreateModalOpen(false)
        resetForm()
        await fetchTeams()
        showAlert('success', '팀이 성공적으로 생성되었습니다.')
      } else {
        showAlert('error', result.error || '팀 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('팀 생성 실패:', error)
      showAlert('error', '팀 생성 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedTeam) return

    if (!formData.name.trim()) {
      showAlert('error', '팀 이름은 필수입니다.')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await updateTeam(selectedTeam.id, formData)
      if (result.success) {
        setIsEditModalOpen(false)
        resetForm()
        await fetchTeams()
        showAlert('success', '팀 정보가 성공적으로 수정되었습니다.')
      } else {
        showAlert('error', result.error || '팀 정보 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('팀 수정 실패:', error)
      showAlert('error', '팀 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (team: Team) => {
    if (!confirm(`정말로 "${team.name}" 팀을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const result = await deleteTeam(team.id)
      if (result.success) {
        await fetchTeams()
        showAlert('success', '팀이 성공적으로 삭제되었습니다.')
      } else {
        showAlert('error', result.error || '팀 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('팀 삭제 실패:', error)
      showAlert('error', '팀 삭제 중 오류가 발생했습니다.')
    }
  }

  const openEditModal = (team: Team) => {
    setSelectedTeam(team)
    setFormData({
      name: team.name,
      description: team.description || ''
    })
    setIsEditModalOpen(true)
  }

  const openCreateModal = () => {
    resetForm()
    setIsCreateModalOpen(true)
  }

  const content = (
    <div className="space-y-6">
      {/* 알림 메시지 */}
      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          {alert.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* 상단 필터 및 액션 */}
      <Card>
        <CardHeader>
          <CardTitle>팀 관리</CardTitle>
          <CardDescription>
            전체 {teams.length}개의 팀이 등록되어 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="팀명 또는 설명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={openCreateModal} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              팀 추가
            </Button>
          </div>

          {/* 팀 테이블 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>팀명</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>수정일</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-gray-500">데이터를 불러오는 중...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredTeams.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="text-gray-500">
                        {searchTerm
                          ? '검색 조건에 맞는 팀이 없습니다.'
                          : '등록된 팀이 없습니다.'
                        }
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                          {team.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {team.description || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(team.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(team.updated_at).toLocaleDateString('ko-KR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(team)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(team)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 생성 모달 */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 팀 생성</DialogTitle>
            <DialogDescription>
              새로운 팀의 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">팀명 <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="팀명을 입력하세요"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="팀에 대한 설명을 입력하세요 (선택사항)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? '생성 중...' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>팀 정보 수정</DialogTitle>
            <DialogDescription>
              {selectedTeam?.name}의 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">팀명 <span className="text-red-500">*</span></Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="팀명을 입력하세요"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="팀에 대한 설명을 입력하세요 (선택사항)"
                rows={3}
              />
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