-- team kolonunu rooms tablosuna ekle
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS team TEXT DEFAULT 'codebenders';
