import pool from './db';
import { initialFamilies } from '../data/dummyData';
import bcrypt from 'bcrypt';

const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create families table
    await client.query(`
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        generation VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        family_id INTEGER REFERENCES families(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        gender CHAR(1),
        class VARCHAR(50),
        role VARCHAR(50),
        department VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        is_committee BOOLEAN DEFAULT FALSE,
        year VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'grand_pere_mere',
        otp VARCHAR(6),
        otp_expiry TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        portal VARCHAR(50),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create schedules table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        time TIME,
        location VARCHAR(255),
        portal VARCHAR(50),
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assignments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id SERIAL PRIMARY KEY,
        member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
        task VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE,
        assigned_by INTEGER REFERENCES users(id),
        portal VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Users
    const checkUsers = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(checkUsers.rows[0].count) === 0) {
      console.log('Seeding default admin user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await client.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3)',
        ['admin@r-cms.com', hashedPassword, 'Admin User']
      );
    }

    // Seed Families
    const checkFamilies = await client.query('SELECT COUNT(*) FROM families');
    if (parseInt(checkFamilies.rows[0].count) === 0) {
      console.log('Seeding database with initial data...');
      for (const family of initialFamilies) {
        const res = await client.query(
          'INSERT INTO families (name, generation) VALUES ($1, $2) RETURNING id',
          [family.name, family.generation]
        );
        const familyId = res.rows[0].id;

        const allMembers = [];
        if (family.pere) allMembers.push({ ...family.pere, role: 'Pere' });
        if (family.mere) allMembers.push({ ...family.mere, role: 'Mere' });
        if (family.members) family.members.forEach((m: any) => allMembers.push({ ...m, role: 'Member' }));

        for (const m of allMembers) {
          await client.query(
            'INSERT INTO members (family_id, name, email, phone, gender, class, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [familyId, m.name, m.email, m.phone, m.gender, m.class, m.role]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('Database initialized successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
  } finally {
    client.release();
  }
};

export default initDb;
