'use client'

import { useState, useEffect, useCallback } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  Connection,
  ReactFlowProvider,
  Position,
  Handle,
  NodeProps,
  EdgeProps,
  EdgeLabelRenderer,
  BaseEdge,
  EdgeMarker,
  MarkerType
} from 'reactflow'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TransitionEditor } from './TransitionEditor'

// Custom Node Components
function QuestionNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-blue-100 border-2 rounded-lg p-3 min-w-48 shadow-md transition-all ${selected ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' : 'border-blue-300'}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-blue-600 rounded" />
        <span className="font-medium text-blue-800">Question</span>
      </div>
      <div className="text-sm text-blue-700 mb-2">
        {data.step.title || 'Untitled Question'}
      </div>
      <div className="text-xs text-blue-600">
        Type: {data.step.config?.questionType || 'Unknown'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function InformationNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-green-100 border-2 rounded-lg p-3 min-w-48 shadow-md transition-all ${selected ? 'border-green-500 shadow-lg ring-2 ring-green-200' : 'border-green-300'}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-green-600 rounded" />
        <span className="font-medium text-green-800">Information</span>
      </div>
      <div className="text-sm text-green-700">
        {data.step.title || 'Untitled Information'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function ConsentNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-purple-100 border-2 rounded-lg p-3 min-w-48 shadow-md transition-all ${selected ? 'border-purple-500 shadow-lg ring-2 ring-purple-200' : 'border-purple-300'}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-purple-600 rounded" />
        <span className="font-medium text-purple-800">Consent</span>
      </div>
      <div className="text-sm text-purple-700">
        {data.step.title || 'Untitled Consent'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function CheckoutNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-orange-100 border-2 rounded-lg p-3 min-w-48 shadow-md ${selected ? 'border-orange-500' : 'border-orange-300'}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-orange-600 rounded" />
        <span className="font-medium text-orange-800">Checkout</span>
      </div>
      <div className="text-sm text-orange-700">
        {data.step.title || 'Untitled Checkout'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function ProviderReviewNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-red-100 border-2 rounded-lg p-3 min-w-48 shadow-md ${selected ? 'border-red-500' : 'border-red-300'}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-red-600 rounded" />
        <span className="font-medium text-red-800">Provider Review</span>
      </div>
      <div className="text-sm text-red-700">
        {data.step.title || 'Untitled Review'}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function DefaultNode({ data, selected }: NodeProps) {
  return (
    <div className={`bg-gray-100 border-2 rounded-lg p-3 min-w-48 shadow-md ${selected ? 'border-gray-500' : 'border-gray-300'}`}>
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-4 h-4 bg-gray-600 rounded" />
        <span className="font-medium text-gray-800">{data.step.type}</span>
      </div>
      <div className="text-sm text-gray-700">
        {data.step.title || `Untitled ${data.step.type}`}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

// Custom Edge Component
function ConditionalEdge({ id, sourceX, sourceY, targetX, targetY, data, markerEnd }: EdgeProps) {
  const edgePath = `M${sourceX},${sourceY} L${targetX},${targetY}`
  
  return (
    <>
      <path
        id={id}
        d={edgePath}
        style={{ 
          strokeDasharray: data?.condition ? '8,4' : 'none',
          strokeWidth: 2,
          stroke: data?.condition ? '#f59e0b' : '#6b7280',
          fill: 'none'
        }}
        markerEnd="url(#react-flow__arrowclosed)"
      />
      {data?.condition && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${sourceX + (targetX - sourceX) / 2}px,${sourceY + (targetY - sourceY) / 2}px)`,
              pointerEvents: 'all',
            }}
          >
            <Badge 
              className="bg-yellow-100 text-yellow-800 text-xs border border-yellow-300 cursor-pointer hover:bg-yellow-200"
              onClick={() => {
                // We'll need to pass this callback from the parent
                if (data.onEditTransition) {
                  data.onEditTransition(data.transition)
                }
              }}
            >
              Conditional
            </Badge>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

// Move nodeTypes and edgeTypes outside component to prevent React Flow warnings
const nodeTypes = {
  question: QuestionNode,
  information: InformationNode,
  consent: ConsentNode,
  checkout: CheckoutNode,
  provider_review: ProviderReviewNode,
  default: DefaultNode,
}

const edgeTypes = {
  conditional: ConditionalEdge,
}

interface VisualFlowEditorProps {
  flowId: number
  onStepEdit: (step: any) => void
  onFlowChange?: () => void
  onStepCreate?: (step: any) => void
}

interface FlowStep {
  id: number
  type: string
  title?: string
  config?: any
}

function VisualFlowEditorCore({ flowId, onStepEdit, onFlowChange, onStepCreate }: VisualFlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTransition, setEditingTransition] = useState<any>(null)
  const [steps, setSteps] = useState<FlowStep[]>([])
  const [showTransitionEditor, setShowTransitionEditor] = useState(false)

  useEffect(() => {
    fetchFlowData()
  }, [flowId])

  const fetchFlowData = async () => {
    try {
      setLoading(true)
      const [stepsResponse, transitionsResponse] = await Promise.all([
        fetch(`/api/admin/flows/${flowId}/steps`),
        fetch(`/api/admin/flows/${flowId}/transitions`)
      ])

      if (!stepsResponse.ok || !transitionsResponse.ok) {
        throw new Error('Failed to fetch flow data')
      }

      const stepsData = await stepsResponse.json()
      const transitionsData = await transitionsResponse.json()

      setSteps(stepsData)

      // Convert steps to React Flow nodes
      const flowNodes: Node[] = stepsData.map((step: any, index: number) => ({
        id: step.id.toString(),
        type: step.type.toLowerCase(),
        position: step.position || { 
          x: (index % 3) * 300 + 100, 
          y: Math.floor(index / 3) * 200 + 100 
        },
        data: { 
          step,
          label: step.title || `${step.type} Step`
        },
      }))

      // Convert transitions to React Flow edges
      const flowEdges: Edge[] = transitionsData.map((transition: any) => ({
        id: transition.id.toString(),
        source: transition.fromStepId.toString(),
        target: transition.toStepId.toString(),
        type: transition.condition ? 'conditional' : 'default',
        data: { 
          condition: transition.condition,
          transition,
          onEditTransition: (transition: any) => {
            setEditingTransition(transition)
            setShowTransitionEditor(true)
          }
        },
        animated: !!transition.condition,
        style: {
          strokeWidth: 2,
          stroke: transition.condition ? '#f59e0b' : '#6b7280',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: transition.condition ? '#f59e0b' : '#6b7280',
        },
      }))

      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return

      // Open transition editor for new connections
      setEditingTransition({
        fromStepId: parseInt(params.source),
        toStepId: parseInt(params.target),
        order: 0
      })
      setShowTransitionEditor(true)
    },
    []
  )

  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onStepEdit(node.data.step)
    },
    [onStepEdit]
  )

  const onEdgeDoubleClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      // Double-click edge to edit
      if (edge.data?.transition) {
        setEditingTransition(edge.data.transition)
        setShowTransitionEditor(true)
      }
    },
    []
  )

  const onNodesDelete = useCallback(
    async (nodesToDelete: Node[]) => {
      try {
        // Delete from server
        const deletePromises = nodesToDelete.map(async node => {
          const response = await fetch(`/api/admin/flows/${flowId}/steps/${node.data.step.id}`, {
            method: 'DELETE'
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to delete step ${node.data.step.id}: ${errorText}`)
          }
        })
        
        await Promise.all(deletePromises)
        
        // Remove from local state without full refresh
        const deletedNodeIds = new Set(nodesToDelete.map(n => n.id))
        setNodes(current => current.filter(node => !deletedNodeIds.has(node.id)))
        setEdges(current => current.filter(edge => 
          !deletedNodeIds.has(edge.source) && !deletedNodeIds.has(edge.target)
        ))
        
        onFlowChange?.()
      } catch (err) {
        console.error('Delete nodes error:', err)
        setError('Failed to delete step(s): ' + (err instanceof Error ? err.message : 'Unknown error'))
      }
    },
    [flowId, onFlowChange, setNodes, setEdges]
  )

  const onEdgesDelete = useCallback(
    async (edgesToDelete: Edge[]) => {
      try {
        // Delete from server
        const deletePromises = edgesToDelete.map(async edge => {
          if (!edge.data?.transition?.id) {
            console.warn('Edge has no transition ID:', edge)
            return
          }
          
          const response = await fetch(`/api/admin/flows/${flowId}/transitions/${edge.data.transition.id}`, {
            method: 'DELETE'
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to delete transition ${edge.data.transition.id}: ${errorText}`)
          }
        })
        
        await Promise.all(deletePromises)
        
        // Remove from local state without full refresh
        const deletedEdgeIds = new Set(edgesToDelete.map(e => e.id))
        setEdges(current => current.filter(edge => !deletedEdgeIds.has(edge.id)))
        
        onFlowChange?.()
      } catch (err) {
        console.error('Delete edges error:', err)
        setError('Failed to delete transition(s): ' + (err instanceof Error ? err.message : 'Unknown error'))
      }
    },
    [flowId, onFlowChange, setEdges]
  )

  const updateNodePositions = useCallback(
    async (nodes: Node[]) => {
      // Update positions in database when nodes are moved
      const updates = nodes.map(node => ({
        stepId: parseInt(node.id),
        position: node.position
      }))

      try {
        // Don't await - let this happen in background to avoid blocking UI
        Promise.all(
          updates.map(async update => {
            try {
              const response = await fetch(`/api/admin/flows/${flowId}/steps/${update.stepId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ position: update.position })
              })
              if (!response.ok) {
                console.warn(`Failed to update position for step ${update.stepId}`)
              }
            } catch (err) {
              console.warn(`Error updating position for step ${update.stepId}:`, err)
            }
          })
        ).catch(err => {
          console.error('Failed to update some node positions:', err)
        })
      } catch (err) {
        console.error('Failed to update node positions:', err)
      }
    },
    [flowId]
  )

  const onNodesChangeWithSave = useCallback(
    (changes: any) => {
      onNodesChange(changes)
      
      // Save positions after drag operations
      const dragChanges = changes.filter((change: any) => change.type === 'position' && change.dragging === false)
      if (dragChanges.length > 0) {
        setTimeout(() => {
          setNodes(currentNodes => {
            updateNodePositions(currentNodes)
            return currentNodes
          })
        }, 100)
      }
    },
    [onNodesChange, updateNodePositions, setNodes]
  )

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading visual editor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={fetchFlowData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[600px] border rounded-lg bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeWithSave}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeDoubleClick={onEdgeDoubleClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: '#6b7280' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280' }
        }}
        className="bg-gray-50"
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.type) {
              case 'question': return '#dbeafe'
              case 'information': return '#dcfce7'
              case 'consent': return '#f3e8ff'
              case 'checkout': return '#fed7aa'
              case 'provider_review': return '#fecaca'
              default: return '#f3f4f6'
            }
          }}
        />
      </ReactFlow>
      
      <div className="p-4 bg-white border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> Double-click to edit • Drag to connect • Select & press Delete/Backspace to remove • Click "Conditional" badges to edit logic
          </div>
          <Button onClick={fetchFlowData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Transition Editor */}
      {showTransitionEditor && (
        <TransitionEditor
          flowId={flowId}
          transition={editingTransition}
          availableSteps={steps}
          onSave={(savedTransition) => {
            setShowTransitionEditor(false)
            setEditingTransition(null)
            
            // Add or update edge in local state instead of full refresh
            const newEdge: Edge = {
              id: savedTransition.id.toString(),
              source: savedTransition.fromStepId.toString(),
              target: savedTransition.toStepId.toString(),
              type: savedTransition.condition ? 'conditional' : 'default',
              data: { 
                condition: savedTransition.condition,
                transition: savedTransition,
                onEditTransition: (transition: any) => {
                  setEditingTransition(transition)
                  setShowTransitionEditor(true)
                }
              },
              animated: !!savedTransition.condition,
              style: {
                strokeWidth: 2,
                stroke: savedTransition.condition ? '#f59e0b' : '#6b7280',
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: savedTransition.condition ? '#f59e0b' : '#6b7280',
              },
            }
            
            setEdges(current => {
              // Check if it's an update or new edge
              const existingIndex = current.findIndex(e => e.id === newEdge.id)
              if (existingIndex >= 0) {
                // Update existing
                const updated = [...current]
                updated[existingIndex] = newEdge
                return updated
              } else {
                // Add new
                return [...current, newEdge]
              }
            })
            
            onFlowChange?.()
          }}
          onCancel={() => {
            setShowTransitionEditor(false)
            setEditingTransition(null)
          }}
        />
      )}
    </div>
  )
}

export function VisualFlowEditor(props: VisualFlowEditorProps) {
  return (
    <ReactFlowProvider>
      <VisualFlowEditorCore {...props} />
    </ReactFlowProvider>
  )
}
