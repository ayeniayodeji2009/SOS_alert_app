CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('VICTIM', 'POLICE', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE police_posts (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    phone VARCHAR(20)
);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    post_id INTEGER REFERENCES police_posts(id),
    status TEXT DEFAULT 'PENDING', -- PENDING, RESPONDING, RESOLVED
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SEED DATA: Nigeria Police Key Divisions
INSERT INTO police_posts (name, location, phone) VALUES
('NPF Force HQ (Abuja)', ST_SetSRID(ST_MakePoint(7.4913, 9.0524), 4326), '+2348033012345'),
('Lagos State Command (Ikeja)', ST_SetSRID(ST_MakePoint(3.3422, 6.5920), 4326), '07055462708'),
('Area F Division (Ikeja)', ST_SetSRID(ST_MakePoint(3.3512, 6.6015), 4326), '08033011352'),
('Lion Building (Lagos Island)', ST_SetSRID(ST_MakePoint(3.3958, 6.4531), 4326), '08033011352'),
('Rivers State Command (PH)', ST_SetSRID(ST_MakePoint(7.0085, 4.7774), 4326), '08033011352'),
('Kano State Command', ST_SetSRID(ST_MakePoint(8.5355, 11.9964), 4326), '08033011352');























































-- -- Ensure PostGIS is enabled
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- -- Clear existing data (for testing)
-- TRUNCATE TABLE police_posts RESTART IDENTITY CASCADE;

-- -- Insert Police Command Centers with Coordinates (Lon, Lat)
-- -- Note: SRID 4326 is standard GPS coordinates
-- INSERT INTO police_posts (name, location, phone) VALUES
-- ('NPF Force Headquarters (Abuja)', ST_SetSRID(ST_MakePoint(7.4913, 9.0524), 4326), '+2348033012345'),
-- ('Lagos State Command (Ikeja)', ST_SetSRID(ST_MakePoint(3.3422, 6.5920), 4326), '07055462708'),
-- ('Area F Division (Ikeja)', ST_SetSRID(ST_MakePoint(3.3512, 6.6015), 4326), '08033011352'),
-- ('Lion Building (Lagos Island)', ST_SetSRID(ST_MakePoint(3.3958, 6.4531), 4326), '08033011352'),
-- ('Rivers State Command (Port Harcourt)', ST_SetSRID(ST_MakePoint(7.0085, 4.7774), 4326), '08033011352'),
-- ('Kano State Command (Dutsen Tanshi)', ST_SetSRID(ST_MakePoint(8.5355, 11.9964), 4326), '08033011352'),
-- ('Oyo State Command (Eleyele)', ST_SetSRID(ST_MakePoint(3.8753, 7.4019), 4326), '08033011352'),
-- ('FCT Command (Garki)', ST_SetSRID(ST_MakePoint(7.4893, 9.0320), 4326), '08033011352');

-- -- Example of how to find the nearest post to a victim at (3.39, 6.45)
-- -- SELECT name, ST_Distance(location, ST_SetSRID(ST_MakePoint(3.39, 6.45), 4326)) as distance
-- -- FROM police_posts ORDER BY distance LIMIT 1;