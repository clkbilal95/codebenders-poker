-- Rooms tablosuna owner_id ekle
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS owner_id TEXT DEFAULT '';

-- Rooms tablosunu güncelle
UPDATE rooms SET owner_id = '' WHERE owner_id IS NULL;
