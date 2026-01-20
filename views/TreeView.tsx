'use client'

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { PlusIcon, MinusIcon, ArrowsPointingOutIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { FamilyMember, Connection } from '../types' // 假设 types.ts 中定义了这些类型
import { calculateRelationshipToSelf } from '../services/relationshipService' // 保留原有的关系计算逻辑
import { getFamilyTreeData, deleteMember, deleteConnection } from '@/app/actions/member' // 引入 Server Actions
import EditMemberModal from '../components/EditMemberModal' // 假设您有这个组件
import EditConnectionModal from '../components/EditConnectionModal' // 假设您有这个组件

// 类型定义补充
interface TreeViewProps {
  familyId: string
  userRole: string // 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
}

// 简单的画布状态类型
interface ViewState {
  scale: number
  offsetX: number
  offsetY: number
}

export default function TreeView({ familyId, userRole }: TreeViewProps) {
  // --- 1. 状态管理 ---
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 视图交互状态
  const [viewState, setViewState] = useState<ViewState>({ scale: 1, offsetX: 0, offsetY: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // 选中状态
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  
  // 模态框状态
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)

  // 权限判断
  const canEdit = useMemo(() => ['OWNER', 'ADMIN'].includes(userRole), [userRole])

  // --- 2. 数据加载 ---
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getFamilyTreeData(familyId)
      
      // 适配 Prisma 返回的 Date 类型到前端可能需要的 string/Date
      const adaptedMembers = data.members.map((m: any) => ({
        ...m,
        birthDate: m.birthDate ? new Date(m.birthDate) : undefined,
        deathDate: m.deathDate ? new Date(m.deathDate) : undefined,
      }))

      setMembers(adaptedMembers)
      setConnections(data.connections)
      setError('')
    } catch (err) {
      console.error('Failed to load tree data:', err)
      setError('加载家族数据失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }, [familyId])

  useEffect(() => {
    if (familyId) {
      loadData()
    }
  }, [loadData, familyId])

  // --- 3. 交互逻辑 (Pan & Zoom) ---
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const scaleChange = -e.deltaY * 0.001
    const newScale = Math.min(Math.max(0.1, viewState.scale + scaleChange), 3)
    setViewState(prev => ({ ...prev, scale: newScale }))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // 只有点击背景时才开始拖拽
    if (e.target === containerRef.current) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - viewState.offsetX, y: e.clientY - viewState.offsetY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setViewState(prev => ({
        ...prev,
        offsetX: e.clientX - dragStart.x,
        offsetY: e.clientY - dragStart.y
      }))
    }
  }

  const handleMouseUp = () => setIsDragging(false)

  // --- 4. CRUD 操作处理 ---
  const handleEditMember = (member: FamilyMember) => {
    setEditingMember(member)
    setIsMemberModalOpen(true)
  }

  const handleAddMember = () => {
    setEditingMember(null) // 新增模式
    setIsMemberModalOpen(true)
  }

  const handleDeleteMember = async (id: string) => {
    if (!confirm('确定要删除这位成员吗？此操作不可恢复。')) return
    const res = await deleteMember(id, familyId)
    if (res.success) loadData()
    else alert('删除失败')
  }

  // --- 5. 渲染 ---
  if (loading) return <div className="flex h-full items-center justify-center text-gray-500">正在加载家族图谱...</div>
  if (error) return <div className="flex h-full items-center justify-center text-red-500">{error}</div>

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gray-50 select-none">
      
      {/* 顶部工具栏 */}
      <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 rounded-lg bg-white p-2 shadow-md sm:flex-row">
        {canEdit && (
          <>
            <button
              onClick={handleAddMember}
              className="flex items-center gap-1 rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4" /> 新增成员
            </button>
            <button
              onClick={() => setIsConnectionModalOpen(true)}
              className="flex items-center gap-1 rounded bg-white border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" /> 添加关系
            </button>
          </>
        )}
        <div className="h-px w-full bg-gray-200 sm:h-auto sm:w-px" />
        <div className="flex items-center gap-1">
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            onClick={() => setViewState(s => ({ ...s, scale: s.scale * 1.1 }))}
          >
            <PlusIcon className="h-5 w-5 text-gray-600" />
          </button>
          <span className="text-xs text-gray-500 w-12 text-center">{(viewState.scale * 100).toFixed(0)}%</span>
          <button 
            className="p-1 hover:bg-gray-100 rounded"
            onClick={() => setViewState(s => ({ ...s, scale: s.scale * 0.9 }))}
          >
            <MinusIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 画布区域 */}
      <div
        ref={containerRef}
        className="h-full w-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }}
          className="relative h-full w-full"
        >
          {/* 这里可以替换为您原来的 SVG/D3 绘图逻辑 */}
          <TreeGraph 
            members={members} 
            connections={connections} 
            onMemberClick={canEdit ? handleEditMember : undefined}
            onDeleteClick={canEdit ? handleDeleteMember : undefined}
            canEdit={canEdit}
          />
        </div>
      </div>

      {/* 模态框 */}
      {isMemberModalOpen && (
        <EditMemberModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          member={editingMember}
          familyId={familyId}
          onSuccess={loadData} // 保存成功后刷新数据
        />
      )}

      {isConnectionModalOpen && (
        <EditConnectionModal
          isOpen={isConnectionModalOpen}
          onClose={() => setIsConnectionModalOpen(false)}
          members={members}
          familyId={familyId}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}

// --- 内部子组件：简易图形渲染 (Placeholder) ---
// 如果您有复杂的 D3 逻辑，请把这个组件的内容替换掉
function TreeGraph({ members, connections, onMemberClick, onDeleteClick, canEdit }: any) {
  // 这里使用一个极简的自动布局算法（仅作为示例，实际项目中建议使用 dagre 或 d3-hierarchy）
  // 假设我们将成员按代际分层，或者简单网格排列
  const NODE_WIDTH = 180
  const NODE_HEIGHT = 80
  const GAP = 20

  // 简单网格布局计算
  const layoutMembers = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(members.length)) || 1
    return members.map((m: any, index: number) => ({
      ...m,
      x: (index % cols) * (NODE_WIDTH + GAP) + 100,
      y: Math.floor(index / cols) * (NODE_HEIGHT + GAP * 2) + 100
    }))
  }, [members])

  return (
    <>
      <svg className="absolute top-0 left-0 w-[5000px] h-[5000px] pointer-events-none">
        {connections.map((conn: any) => {
          const from = layoutMembers.find((m: any) => m.id === conn.fromId)
          const to = layoutMembers.find((m: any) => m.id === conn.toId)
          if (!from || !to) return null
          
          return (
            <line
              key={conn.id}
              x1={from.x + NODE_WIDTH / 2}
              y1={from.y + NODE_HEIGHT / 2}
              x2={to.x + NODE_WIDTH / 2}
              y2={to.y + NODE_HEIGHT / 2}
              stroke="#cbd5e1"
              strokeWidth="2"
            />
          )
        })}
      </svg>

      {layoutMembers.map((member: any) => (
        <div
          key={member.id}
          className="absolute rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all group"
          style={{
            left: member.x,
            top: member.y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${member.gender === 'female' ? 'bg-pink-400' : 'bg-blue-400'}`}>
                {member.firstName?.[0]}
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm">{member.firstName} {member.lastName}</div>
                <div className="text-xs text-gray-500">{member.nickname}</div>
              </div>
            </div>
            
            {/* 编辑按钮 - 鼠标悬停显示 */}
            {canEdit && (
              <div className="hidden group-hover:flex gap-1">
                <button 
                  onClick={() => onMemberClick(member)}
                  className="p-1 text-gray-400 hover:text-indigo-600"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => onDeleteClick(member.id)}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  )
}