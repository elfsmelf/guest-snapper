"use client"

import { useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ChevronDown,
  Search,
  Calendar,
  Users,
  HardDrive,
  Eye,
  MoreHorizontal,
  Trash2,
  RotateCcw,
  ExternalLink,
  Filter,
  UserCog
} from 'lucide-react'
import { toast } from 'sonner'
import { formatBytes } from '@/lib/utils'
import { authClient } from '@/lib/auth-client'

interface AdminEvent {
  id: string
  name: string
  coupleNames: string
  eventDate: string
  slug: string
  isPublished: boolean
  publishedAt: string | null
  activationDate: string | null
  uploadWindowEnd: string
  downloadWindowEnd: string
  status: string
  trashedAt: string | null
  deleteAt: string | null
  plan: string
  createdAt: string
  updatedAt: string
  userId: string
  userEmail: string
  userName: string | null
  userImage: string | null
  uploadCount: number
  totalFileSize: number
}

interface AdminEventsData {
  events: AdminEvent[]
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  stats: {
    total: number
    active: number
    trashed: number
    published: number
    deleted?: number
  }
}

export default function AdminEventsPage() {
  const [data, setData] = useState<AdminEventsData>({
    events: [],
    pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
    stats: { total: 0, active: 0, trashed: 0, published: 0, deleted: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trashed' | 'published' | 'deleted'>('all')
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<AdminEvent | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'trashed': return 'destructive'
      case 'deleted': return 'destructive'
      default: return 'secondary'
    }
  }


  const handleRestoreEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/restore`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to restore event')
      }

      toast.success('Event restored successfully')
      fetchEvents()
    } catch (error) {
      toast.error('Failed to restore event')
      console.error('Restore error:', error)
    }
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return

    try {
      const response = await fetch(`/api/events/${eventToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete event')
      }

      toast.success('Event permanently deleted')
      setDeleteModalOpen(false)
      setEventToDelete(null)
      fetchEvents()
    } catch (error) {
      toast.error('Failed to delete event')
      console.error('Delete error:', error)
    }
  }

  const handleImpersonateUser = async (userId: string) => {
    try {
      // @ts-ignore - Better Auth admin plugin types may not be fully defined
      await authClient.admin.impersonateUser({
        userId,
      })

      toast.success('Now impersonating user. Redirecting to dashboard...')
      // Redirect to dashboard after impersonation
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (error) {
      toast.error('Failed to impersonate user')
      console.error('Impersonate error:', error)
    }
  }


  const columns: ColumnDef<AdminEvent>[] = [
    {
      accessorKey: 'name',
      header: 'Event',
      cell: ({ row }) => {
        const event = row.original
        return (
          <div className="flex flex-col space-y-1 max-w-xs">
            <div className="font-medium truncate">{event.name}</div>
            <div className="text-sm text-muted-foreground truncate">{event.coupleNames}</div>
            <div className="text-xs text-muted-foreground">/{event.slug}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'userEmail',
      header: 'Owner',
      cell: ({ row }) => {
        const event = row.original
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={event.userImage || undefined} alt={event.userName || event.userEmail} />
              <AvatarFallback className="text-xs">
                {(event.userName || event.userEmail)?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div className="text-sm font-medium truncate">{event.userName || 'No name'}</div>
              <div className="text-xs text-muted-foreground truncate">{event.userEmail}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const event = row.original
        return (
          <div className="flex flex-col space-y-1">
            <Badge variant={getStatusColor(event.status)}>
              {event.status}
            </Badge>
            {event.isPublished && (
              <Badge variant="outline" className="text-xs">
                Published
              </Badge>
            )}
          </div>
        )
      },
      filterFn: (row, id, value) => {
        return row.getValue(id) === value
      },
    },
    {
      accessorKey: 'isPublished',
      header: () => null,
      cell: () => null,
      filterFn: (row, id, value) => {
        return row.getValue(id) === value
      },
    },
    {
      accessorKey: 'uploadCount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Files
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const event = row.original
        return (
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{event.uploadCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatBytes(event.totalFileSize)}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => {
        const plan = row.getValue('plan') as string
        return (
          <Badge variant="outline" className="capitalize">
            {plan}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'eventDate',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Event Date
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const dateStr = row.getValue('eventDate') as string
        return (
          <div className="text-sm">
            {new Date(dateStr).toLocaleDateString('en-US', { 
              month: 'short', 
              day: '2-digit', 
              year: 'numeric' 
            })}
          </div>
        )
      },
    },
    {
      accessorKey: 'downloadWindowEnd',
      header: 'Download End',
      cell: ({ row }) => {
        const event = row.original
        const downloadEnd = new Date(event.downloadWindowEnd)
        const now = new Date()
        const isExpired = downloadEnd < now

        return (
          <div className="flex flex-col space-y-1">
            <div className={`text-sm ${isExpired ? 'text-red-600' : 'text-muted-foreground'}`}>
              {downloadEnd.toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
              })}
            </div>
            {event.status === 'trashed' && event.deleteAt && (
              <div className="text-xs text-red-600">
                Delete: {new Date(event.deleteAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit'
                })}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'trashDate',
      header: 'Trash Date',
      cell: ({ row }) => {
        const event = row.original
        // For free events, trash date is 1 year after creation if not upgraded
        const isFreeEvent = event.plan === 'free_trial' || event.plan === 'free' || !event.plan

        if (!isFreeEvent) {
          return <span className="text-sm text-muted-foreground">N/A</span>
        }

        const createdDate = new Date(event.createdAt)
        const trashDate = new Date(createdDate)
        trashDate.setFullYear(trashDate.getFullYear() + 1)

        const now = new Date()
        const isPastTrashDate = trashDate < now

        return (
          <div className={`text-sm ${isPastTrashDate ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
            {trashDate.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric'
            })}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium"
          >
            Created
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return (
          <div className="text-sm">
            {date.toLocaleDateString('en-US', { 
              month: 'short', 
              day: '2-digit', 
              year: 'numeric' 
            })}
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const event = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => window.open(`/gallery/${event.slug}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Event
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => handleImpersonateUser(event.userId)}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Impersonate User
              </DropdownMenuItem>

              {event.status === 'trashed' && (
                <DropdownMenuItem
                  onClick={() => handleRestoreEvent(event.id)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore from Trash
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => {
                  setEventToDelete(event)
                  setDeleteModalOpen(true)
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: (pageIndex + 1).toString(),
        limit: pageSize.toString(),
        ...(globalFilter && { search: globalFilter }),
      })

      const response = await fetch(`/api/admin/events?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }

      const eventsData = await response.json()
      setData(eventsData)
    } catch (error) {
      toast.error('Failed to load events')
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [pageIndex, pageSize, globalFilter])

  // Apply status filter when it changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setColumnFilters([])
    } else if (statusFilter === 'published') {
      setColumnFilters([{ id: 'isPublished', value: true }])
    } else {
      setColumnFilters([{ id: 'status', value: statusFilter }])
    }
  }, [statusFilter])

  const table = useReactTable({
    data: data.events,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    pageCount: data.pagination.totalPages,
    manualPagination: true,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize })
        setPageIndex(newState.pageIndex)
        setPageSize(newState.pageSize)
      }
    },
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <p className="text-sm text-gray-500">Manage all events including trashed ones</p>
      </div>


      {/* Stats Cards with Filter Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          className="h-auto p-6 justify-start"
          onClick={() => setStatusFilter('all')}
        >
          <div className="flex items-center w-full">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4 text-left">
              <p className="text-sm font-medium">Total Events</p>
              <p className="text-2xl font-bold">{data.stats.total}</p>
            </div>
          </div>
        </Button>

        <Button
          variant={statusFilter === 'active' ? 'default' : 'outline'}
          className="h-auto p-6 justify-start"
          onClick={() => setStatusFilter('active')}
        >
          <div className="flex items-center w-full">
            <Eye className="h-8 w-8 text-green-600" />
            <div className="ml-4 text-left">
              <p className="text-sm font-medium">Active Events</p>
              <p className="text-2xl font-bold">{data.stats.active}</p>
            </div>
          </div>
        </Button>

        <Button
          variant={statusFilter === 'published' ? 'default' : 'outline'}
          className="h-auto p-6 justify-start"
          onClick={() => setStatusFilter('published')}
        >
          <div className="flex items-center w-full">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4 text-left">
              <p className="text-sm font-medium">Published</p>
              <p className="text-2xl font-bold">{data.stats.published}</p>
            </div>
          </div>
        </Button>

        <Button
          variant={statusFilter === 'trashed' ? 'default' : 'outline'}
          className="h-auto p-6 justify-start"
          onClick={() => setStatusFilter('trashed')}
        >
          <div className="flex items-center w-full">
            <Trash2 className="h-8 w-8 text-red-600" />
            <div className="ml-4 text-left">
              <p className="text-sm font-medium">Trashed</p>
              <p className="text-2xl font-bold">{data.stats.trashed}</p>
            </div>
          </div>
        </Button>

        <Button
          variant={statusFilter === 'deleted' ? 'default' : 'outline'}
          className="h-auto p-6 justify-start"
          onClick={() => setStatusFilter('deleted')}
        >
          <div className="flex items-center w-full">
            <Trash2 className="h-8 w-8 text-gray-600" />
            <div className="ml-4 text-left">
              <p className="text-sm font-medium">Deleted</p>
              <p className="text-2xl font-bold">{data.stats.deleted || 0}</p>
            </div>
          </div>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={globalFilter}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="border-t">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={row.original.status === 'trashed' ? 'bg-red-50' : ''}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No events found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Showing {data.events.length} of {data.pagination.totalCount} events
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
              disabled={pageIndex === 0 || loading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex(pageIndex + 1)}
              disabled={!data.pagination.hasNextPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event Permanently?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the event
              <span className="font-semibold"> {eventToDelete?.name}</span> and remove all associated data including uploads, albums, and guest information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false)
                setEventToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}