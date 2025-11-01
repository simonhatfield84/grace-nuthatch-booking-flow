import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Users, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Guest } from "@/types/guest";
import { useGuestDuplicates } from "@/hooks/useGuestDuplicates";
import { useToast } from "@/hooks/use-toast";

interface PotentialDuplicate {
  guest1: Guest;
  guest2: Guest;
  matchType: 'exact_email' | 'exact_phone' | 'similar_name' | 'typo_email';
  confidence: number;
}

export default function GuestDuplicates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mergeGuests } = useGuestDuplicates();
  const [mergingPair, setMergingPair] = useState<string | null>(null);

  const { data: guests = [], isLoading } = useQuery({
    queryKey: ['all-guests-for-duplicates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Guest[];
    }
  });

  // Find potential duplicates
  const findDuplicates = (): PotentialDuplicate[] => {
    const duplicates: PotentialDuplicate[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < guests.length; i++) {
      for (let j = i + 1; j < guests.length; j++) {
        const g1 = guests[i];
        const g2 = guests[j];
        const pairKey = [g1.id, g2.id].sort().join('-');

        if (seen.has(pairKey)) continue;

        // Exact email match
        if (g1.email && g2.email && g1.email.toLowerCase() === g2.email.toLowerCase()) {
          duplicates.push({
            guest1: g1,
            guest2: g2,
            matchType: 'exact_email',
            confidence: 100
          });
          seen.add(pairKey);
          continue;
        }

        // Exact phone match
        if (g1.phone && g2.phone && g1.phone === g2.phone) {
          duplicates.push({
            guest1: g1,
            guest2: g2,
            matchType: 'exact_phone',
            confidence: 100
          });
          seen.add(pairKey);
          continue;
        }

        // Similar names (Levenshtein distance)
        const name1 = g1.name.toLowerCase();
        const name2 = g2.name.toLowerCase();
        const distance = levenshteinDistance(name1, name2);
        
        if (distance <= 2 && distance > 0) {
          duplicates.push({
            guest1: g1,
            guest2: g2,
            matchType: 'similar_name',
            confidence: Math.round((1 - distance / Math.max(name1.length, name2.length)) * 100)
          });
          seen.add(pairKey);
          continue;
        }

        // Email typo detection (gmail.com vs gmial.com)
        if (g1.email && g2.email) {
          const email1Parts = g1.email.toLowerCase().split('@');
          const email2Parts = g2.email.toLowerCase().split('@');
          
          if (email1Parts[0] === email2Parts[0] && 
              email1Parts[1] && email2Parts[1] &&
              levenshteinDistance(email1Parts[1], email2Parts[1]) <= 2) {
            duplicates.push({
              guest1: g1,
              guest2: g2,
              matchType: 'typo_email',
              confidence: 90
            });
            seen.add(pairKey);
          }
        }
      }
    }

    return duplicates.sort((a, b) => b.confidence - a.confidence);
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  const duplicates = findDuplicates();

  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'exact_email': return 'Same Email';
      case 'exact_phone': return 'Same Phone';
      case 'similar_name': return 'Similar Name';
      case 'typo_email': return 'Email Typo';
      default: return type;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence === 100) return 'bg-red-500/20 text-red-700 border-red-500/30';
    if (confidence >= 90) return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
    return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30';
  };

  const handleMerge = async (primary: Guest, duplicate: Guest) => {
    const pairKey = `${primary.id}-${duplicate.id}`;
    setMergingPair(pairKey);
    
    try {
      await mergeGuests({ primaryId: primary.id, duplicateId: duplicate.id });
      toast({
        title: "Guests merged",
        description: `${duplicate.name} has been merged into ${primary.name}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to merge guests",
        variant: "destructive"
      });
    } finally {
      setMergingPair(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/guests')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Guests
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Duplicate Detection</h1>
            <p className="text-muted-foreground mt-1">
              Review and merge potential duplicate guest profiles
            </p>
          </div>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{duplicates.length}</div>
                <div className="text-sm text-muted-foreground">Potential Duplicates</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Analyzing guests for duplicates...</div>
        </div>
      ) : duplicates.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No duplicates found</h3>
          <p className="text-muted-foreground">
            Your guest database is clean - no potential duplicates detected
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {duplicates.map((dup, idx) => {
            const pairKey = `${dup.guest1.id}-${dup.guest2.id}`;
            const isMerging = mergingPair === pairKey;
            
            return (
              <Card key={pairKey} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getConfidenceColor(dup.confidence)}>
                      {dup.confidence}% Match
                    </Badge>
                    <Badge variant="outline">
                      {getMatchTypeLabel(dup.matchType)}
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Guest 1 */}
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Guest 1</div>
                      <div className="font-semibold text-lg">{dup.guest1.name}</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>{' '}
                        {dup.guest1.email || <span className="text-muted-foreground">-</span>}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>{' '}
                        {dup.guest1.phone || <span className="text-muted-foreground">-</span>}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Visits:</span>{' '}
                        {dup.guest1.actual_visit_count || 0}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Spend:</span>{' '}
                        £{((dup.guest1.total_spend_cents || 0) / 100).toFixed(2)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>{' '}
                        {new Date(dup.guest1.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMerge(dup.guest1, dup.guest2)}
                      disabled={isMerging}
                      className="w-full"
                    >
                      Keep This, Merge Other
                    </Button>
                  </div>

                  {/* Guest 2 */}
                  <div className="space-y-3 border-l pl-6">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Guest 2</div>
                      <div className="font-semibold text-lg">{dup.guest2.name}</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>{' '}
                        {dup.guest2.email || <span className="text-muted-foreground">-</span>}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>{' '}
                        {dup.guest2.phone || <span className="text-muted-foreground">-</span>}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Visits:</span>{' '}
                        {dup.guest2.actual_visit_count || 0}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Spend:</span>{' '}
                        £{((dup.guest2.total_spend_cents || 0) / 100).toFixed(2)}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created:</span>{' '}
                        {new Date(dup.guest2.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMerge(dup.guest2, dup.guest1)}
                      disabled={isMerging}
                      className="w-full"
                    >
                      Keep This, Merge Other
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
