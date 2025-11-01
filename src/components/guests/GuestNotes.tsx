import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pin, PinOff, Plus } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface GuestNotesProps {
  guestId: string;
  venueId: string;
}

interface GuestNote {
  id: string;
  note_text: string;
  note_type: string | null;
  created_at: string;
  created_by: string | null;
  is_pinned: boolean;
  related_booking_id: number | null;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

const NOTE_TYPES = [
  { value: 'preference', label: 'Preference' },
  { value: 'dietary', label: 'Dietary' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'compliment', label: 'Compliment' },
  { value: 'special_request', label: 'Special Request' },
  { value: 'general', label: 'General' }
];

export const GuestNotes = ({ guestId, venueId }: GuestNotesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("general");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['guest-notes', guestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guest_notes')
        .select(`
          *,
          profiles (
            first_name,
            last_name
          )
        `)
        .eq('guest_id', guestId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as GuestNote[];
    }
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('guest_notes')
        .insert({
          guest_id: guestId,
          venue_id: venueId,
          note_text: newNote,
          note_type: noteType,
          created_by: user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-notes', guestId] });
      setNewNote("");
      setNoteType("general");
      setIsAdding(false);
      toast({ title: "Note added", description: "Note has been saved successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add note.", variant: "destructive" });
    }
  });

  const togglePinMutation = useMutation({
    mutationFn: async ({ noteId, isPinned }: { noteId: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from('guest_notes')
        .update({ is_pinned: !isPinned })
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest-notes', guestId] });
    }
  });

  const pinnedNotes = notes.filter(n => n.is_pinned);
  const regularNotes = notes.filter(n => !n.is_pinned);

  const getNoteTypeColor = (type: string | null) => {
    switch (type) {
      case 'dietary': return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'preference': return 'bg-blue-500/20 text-blue-700 border-blue-500/30';
      case 'complaint': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'compliment': return 'bg-green-500/20 text-green-700 border-green-500/30';
      case 'special_request': return 'bg-purple-500/20 text-purple-700 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/30';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
          <div className="text-base font-medium">
            Notes Timeline {notes.length > 0 && `(${notes.length})`}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-4">
        <div className="space-y-4">
          {/* Add New Note */}
          {!isAdding ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          ) : (
            <div className="border rounded-lg p-4 space-y-3">
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter note..."
                rows={3}
              />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addNoteMutation.mutate()}
                  disabled={!newNote.trim() || addNoteMutation.isPending}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setNewNote("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Pinned Notes */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Pinned</div>
              {pinnedNotes.map(note => (
                <div key={note.id} className="border-l-4 border-primary bg-primary/5 p-3 rounded-r-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {note.note_type && (
                        <Badge variant="outline" className={`${getNoteTypeColor(note.note_type)} mb-2`}>
                          {NOTE_TYPES.find(t => t.value === note.note_type)?.label || note.note_type}
                        </Badge>
                      )}
                      <p className="text-sm">{note.note_text}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                        {note.profiles && (
                          <span> • by {note.profiles.first_name} {note.profiles.last_name}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePinMutation.mutate({ noteId: note.id, isPinned: true })}
                    >
                      <PinOff className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regular Notes Timeline */}
          {regularNotes.length > 0 && (
            <div className="space-y-2">
              {pinnedNotes.length > 0 && (
                <div className="text-sm font-medium text-muted-foreground">History</div>
              )}
              {regularNotes.map(note => (
                <div key={note.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {note.note_type && (
                        <Badge variant="outline" className={`${getNoteTypeColor(note.note_type)} mb-2`}>
                          {NOTE_TYPES.find(t => t.value === note.note_type)?.label || note.note_type}
                        </Badge>
                      )}
                      <p className="text-sm">{note.note_text}</p>
                      <div className="text-xs text-muted-foreground mt-2">
                        {format(new Date(note.created_at), 'MMM dd, yyyy HH:mm')}
                        {note.profiles && (
                          <span> • by {note.profiles.first_name} {note.profiles.last_name}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePinMutation.mutate({ noteId: note.id, isPinned: false })}
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {notes.length === 0 && !isAdding && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No notes yet. Add your first note above.
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
