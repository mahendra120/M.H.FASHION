/*
# Add user profiles table (v1)

1. New Table `profiles`
   - id (uuid) — primary key, references auth.users(id) on delete cascade.
   - email text
   - name text
   - role text — 'customer' (default) | 'admin'
   - created_at timestamptz
2. Security
   - RLS enabled. Users can read their own profile. INSERT/UPDATE restricted to
     the owner. Admin updates use the service-role client (bypasses RLS) in API
     routes, so we intentionally do NOT publish a public update policy.
3. Notes
   - A trigger auto-creates a row on auth.users INSERT using defaults, so that
     new sign-ups immediately have a profile even if the app's best-effort
     upsert races.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','admin')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_read_profile" ON profiles;
CREATE POLICY "owner_read_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "owner_insert_profile" ON profiles;
CREATE POLICY "owner_insert_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_update_profile" ON profiles;
CREATE POLICY "owner_update_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
