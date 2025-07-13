-- Fix the malformed join group data
UPDATE join_groups 
SET min_party_size = 1, max_party_size = 7 
WHERE name = '1&2' AND min_party_size = 7 AND max_party_size = 4;