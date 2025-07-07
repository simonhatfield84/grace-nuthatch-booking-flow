
-- Delete all existing bookings
DELETE FROM public.bookings;

-- Delete all existing tables  
DELETE FROM public.tables;

-- Delete all existing sections
DELETE FROM public.sections;

-- Reset the sequences to start from 1
ALTER SEQUENCE bookings_id_seq RESTART WITH 1;
ALTER SEQUENCE tables_id_seq RESTART WITH 1;  
ALTER SEQUENCE sections_id_seq RESTART WITH 1;
