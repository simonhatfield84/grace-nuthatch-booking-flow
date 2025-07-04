
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, UserPlus, Trash2 } from "lucide-react";
import { useGuests, Guest } from "@/hooks/useGuests";
import { GuestsTable } from "@/components/guests/GuestsTable";
import { GuestFilters, GuestFilters as GuestFiltersType } from "@/components/guests/GuestFilters";
import { GuestDialog } from "@/components/guests/GuestDialog";
import { CSVImportDialog } from "@/components/guests/CSVImportDialog";
import { DeleteConfirmDialog } from "@/components/guests/DeleteConfirmDialog";

const Guests = () => {
  const { toast } = useToast();
  const { guests, createGuest, updateGuest, bulkDeleteGuests, isLoading } = useGuests();
  
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

  // Apply filters to guests
  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          guest.name.toLowerCase().includes(searchLower) ||
          guest.email?.toLowerCase().includes(searchLower) ||
          guest.phone?.includes(filters.search);
        if (!matchesSearch) return false;
      }

      // Marketing opt-in filter
      if (filters.marketingOptIn !== "all") {
        const wantsOptedIn = filters.marketingOptIn === "opted_in";
        if (guest.opt_in_marketing !== wantsOptedIn) return false;
      }

      // Visit count filter
      if (filters.visitCount !== "all") {
        const visitCount = guest.visit_count || 0;
        switch (filters.visitCount) {
          case "first_time":
            if (visitCount !== 1) return false;
            break;
          case "repeat":
            if (visitCount < 2 || visitCount > 4) return false;
            break;
          case "frequent":
            if (visitCount < 5) return false;
            break;
        }
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const guestTagIds = guest.tags?.map(tag => tag.id) || [];
        const hasAnySelectedTag = filters.tags.some(tagId => guestTagIds.includes(tagId));
        if (!hasAnySelectedTag) return false;
      }

      // Last visit date filters
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

  // Calculate statistics (no revenue)
  const totalGuests = guests.length;
  const returningGuests = guests.filter(g => (g.visit_count || 0) > 1).length;
  const marketingOptIns = guests.filter(g => g.opt_in_marketing).length;

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
      'Marketing Opt-in': guest.opt_in_marketing ? 'Yes' : 'No',
      'Visit Count': guest.visit_count || 0,
      'Last Visit': guest.last_visit_date || '',
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
      for (const guestData of importedGuests) {
        await createGuest(guestData);
      }
      toast({
        title: "Import complete",
        description: `Successfully imported ${importedGuests.length} guests.`
      });
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import failed",
        description: "Some guests could not be imported. Please check the data and try again.",
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
          <Button onClick={handleAddGuest}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Statistics Cards (no revenue) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGuests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Returning Guests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returningGuests}</div>
            <p className="text-xs text-muted-foreground">
              {totalGuests > 0 ? Math.round((returningGuests / totalGuests) * 100) : 0}% return rate
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
              {totalGuests > 0 ? Math.round((marketingOptIns / totalGuests) * 100) : 0}% opted in
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <GuestFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredGuests.length} of {totalGuests} guests
          </p>
          {selectedGuests.length > 0 && (
            <Badge variant="secondary">
              {selectedGuests.length} selected
            </Badge>
          )}
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
