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
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { formatBytes } from '@/lib/utils'

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
  }
}

export default function AdminEventsPage() {
  const [data, setData] = useState<AdminEventsData>({ 
    events: [], 
    pagination: { page: 1, limit: 50, totalCount: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
    stats: { total: 0, active: 0, trashed: 0, published: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(50)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'trashed': return 'destructive'
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
                onClick={() => window.open(`/${event.slug}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Event
              </DropdownMenuItem>
              
              {event.status === 'trashed' && (
                <DropdownMenuItem
                  onClick={() => handleRestoreEvent(event.id)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore from Trash
                </DropdownMenuItem>
              )}
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


      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Events</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.active}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.published}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <Trash2 className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Trashed</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.trashed}</p>
            </div>
          </div>
        </div>
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
    </div>
  )
}