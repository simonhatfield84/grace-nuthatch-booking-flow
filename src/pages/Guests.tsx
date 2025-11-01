import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, UserPlus, Trash2, ChevronLeft, ChevronRight, Users2 } from "lucide-react";
import { useGuests } from "@/hooks/useGuests";
import { Guest } from "@/types/guest";
import { useNavigate } from "react-router-dom";
import { GuestsTable } from "@/components/guests/GuestsTable";
import { GuestFilters, GuestFilters as GuestFiltersType } from "@/components/guests/GuestFilters";
import { GuestDialog } from "@/components/guests/GuestDialog";
import { CSVImportDialog } from "@/components/guests/CSVImportDialog";
import { DeleteConfirmDialog } from "@/components/guests/DeleteConfirmDialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Guests = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  
  const [filters, setFilters] = useState<GuestFiltersType>({
    search: "",
    tags: [],
    marketingOptIn: "all",
    visitCount: "all",
    lastVisitAfter: null,
    lastVisitBefore: null
  });

  // Calculate pagination offset
  const offset = (currentPage - 1) * pageSize;

  // Fetch guests with pagination and server-side filtering
  const { guests, totalCount, createGuest, createGuestSilent, updateGuest, bulkDeleteGuests, isLoading } = useGuests({
    limit: pageSize,
    offset: offset,
    search: filters.search,
    tags: filters.tags,
    marketingOptIn: filters.marketingOptIn,
    visitCount: filters.visitCount
  });

  // Calculate pagination info
  const totalPages = Math.ceil(totalCount / pageSize);
  const startItem = offset + 1;
  const endItem = Math.min(offset + pageSize, totalCount);

  // Client-side filtering for date ranges (keep existing logic for complex filters)
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      // Last visit date filters (keep client-side for now)
      if (filters.lastVisitAfter || filters.lastVisitBefore) {
        const lastVisitDate = guest.last_visit_date ? new Date(guest.last_visit_date) : null;
        
        if (filters.lastVisitAfter && (!lastVisitDate || lastVisitDate < filters.lastVisitAfter)) {
          return false;
        }
        
        if (filters.lastVisitBefore && (!lastVisitDate || lastVisitDate > filters.lastVisitBefore)) {
          return false;
        }
      }

      return true;
    });
  }, [guests, filters]);

  // Calculate statistics from current page only
  const returningGuests = filteredGuests.filter(g => (g.actual_visit_count || 0) > 1).length;
  const marketingOptIns = filteredGuests.filter(g => g.opt_in_marketing).length;
  const totalRevenue = filteredGuests.reduce((sum, g) => sum + (g.total_spend_cents || 0), 0);
  const avgGuestValue = filteredGuests.length > 0 ? totalRevenue / filteredGuests.length : 0;

  const handleSelectGuest = (guestId: string) => {
    setSelectedGuests(prev => 
      prev.includes(guestId) 
        ? prev.filter(id => id !== guestId)
        : [...prev, guestId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedGuests(checked ? filteredGuests.map(g => g.id) : []);
  };

  const handleEditGuest = (guest: Guest) => {
    setEditingGuest(guest);
    setIsGuestDialogOpen(true);
  };

  const handleAddGuest = () => {
    setEditingGuest(null);
    setIsGuestDialogOpen(true);
  };

  const handleSaveGuest = async (guestData: Partial<Guest>) => {
    try {
      if (editingGuest) {
        await updateGuest({ id: editingGuest.id, updates: guestData });
      } else {
        await createGuest(guestData as Omit<Guest, 'id' | 'created_at' | 'updated_at'>);
      }
    } catch (error) {
      console.error('Failed to save guest:', error);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await bulkDeleteGuests(selectedGuests);
      setSelectedGuests([]);
      setShowBulkDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete guests:', error);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleCSVExport = () => {
    const csvData = filteredGuests.map(guest => ({
      Name: guest.name,
      Email: guest.email || '',
      Phone: guest.phone || '',
      'Visit Count': guest.actual_visit_count || 0,
      'Total Spend': ((guest.total_spend_cents || 0) / 100).toFixed(2),
      'Avg Per Visit': ((guest.average_spend_per_visit_cents || 0) / 100).toFixed(2),
      'Avg Per Cover': ((guest.average_spend_per_cover_cents || 0) / 100).toFixed(2),
      'Last Visit': guest.last_actual_visit_date || '',
      'Marketing Opt-in': guest.opt_in_marketing ? 'Yes' : 'No',
      Tags: guest.tags?.map(tag => tag.name).join(', ') || '',
      Notes: guest.notes || ''
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${filteredGuests.length} guests to CSV.`
    });
  };

  const handleCSVImport = async (importedGuests: any[]) => {
    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const guestData of importedGuests) {
        try {
          await createGuestSilent(guestData);
          successCount++;
        } catch (error) {
          console.error('Failed to import guest:', guestData.name, error);
          errors.push(`Failed to import ${guestData.name}`);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Import complete",
          description: `Successfully imported ${successCount} guest${successCount > 1 ? 's' : ''}.`
        });
      }

      if (errors.length > 0) {
        toast({
          title: "Import partially complete",
          description: `${errors.length} guest${errors.length > 1 ? 's' : ''} could not be imported. Check console for details.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import failed",
        description: "Could not complete the import. Please check the data and try again.",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      tags: [],
      marketingOptIn: "all",
      visitCount: "all",
      lastVisitAfter: null,
      lastVisitBefore: null
    });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedGuests([]); // Clear selections when changing pages
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
    setSelectedGuests([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading guests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guests</h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <div className="flex gap-2">
          {selectedGuests.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedGuests.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleCSVExport} disabled={filteredGuests.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => navigate('/guests/duplicates')}>
            <Users2 className="h-4 w-4 mr-2" />
            Find Duplicates
          </Button>
          <Button onClick={handleAddGuest}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Showing {startItem}-{endItem}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Returning Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returningGuests}</div>
            <p className="text-xs text-muted-foreground">
              On current page
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Marketing Opt-ins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingOptIns}</div>
            <p className="text-xs text-muted-foreground">
              On current page
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From tracked orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Avg Guest Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{(avgGuestValue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per guest lifetime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <GuestFilters
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setCurrentPage(1); // Reset to first page when filtering
        }}
        onClearFilters={clearFilters}
      />

      {/* Results Summary and Page Size Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}-{endItem} of {totalCount} guests
          </p>
          {selectedGuests.length > 0 && (
            <Badge variant="secondary">
              {selectedGuests.length} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Guests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Guests Database</CardTitle>
          <CardDescription>
            Comprehensive view of all guests with filtering and management capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GuestsTable
            guests={filteredGuests}
            selectedGuests={selectedGuests}
            onSelectGuest={handleSelectGuest}
            onSelectAll={handleSelectAll}
            onEditGuest={handleEditGuest}
          />
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* Show page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink 
                      onClick={() => handlePageChange(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Dialogs */}
      <GuestDialog
        isOpen={isGuestDialogOpen}
        onOpenChange={setIsGuestDialogOpen}
        guest={editingGuest}
        onSave={handleSaveGuest}
      />

      <CSVImportDialog
        isOpen={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImport={handleCSVImport}
      />

      <DeleteConfirmDialog
        isOpen={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        title="Delete Selected Guests"
        description={`Are you sure you want to delete ${selectedGuests.length} guest${selectedGuests.length > 1 ? 's' : ''}? This action cannot be undone.`}
        isLoading={isBulkDeleting}
      />
    </div>
  );
};

export default Guests;
