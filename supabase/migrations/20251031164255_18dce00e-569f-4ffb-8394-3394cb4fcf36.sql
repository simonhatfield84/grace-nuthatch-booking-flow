-- Map Square location L1D721GKC3TS1 to The Nuthatch venue
INSERT INTO square_location_map (square_location_id, grace_venue_id)
VALUES ('L1D721GKC3TS1', '6d5d5f19-13a5-4325-9933-430fc3c03b6b')
ON CONFLICT (square_location_id) DO UPDATE 
SET grace_venue_id = EXCLUDED.grace_venue_id;