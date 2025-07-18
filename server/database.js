import sqlite3 from 'sqlite3';
import path from 'path';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create or open the database
const databasePath = process.env.DATABASE_PATH || path.join(__dirname, 'database.sqlite');
console.log(`Database path: ${databasePath}`);

const SqliteDatabase = sqlite3.verbose().Database;
const db = new SqliteDatabase(databasePath);

// Initialize the database schema
function initializeDatabase() {
  db.serialize(() => {
    // Enable foreign key constraints
    db.run("PRAGMA foreign_keys = ON");

    // Create teams table
    db.run(`
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        presentation_day INTEGER NOT NULL CHECK (presentation_day >= 0 AND presentation_day <= 6),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create team_members table
    db.run(`
      CREATE TABLE IF NOT EXISTS team_members (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    db.run(`
      CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members(team_id)
    `);
    
    db.run(`
      CREATE INDEX IF NOT EXISTS team_members_position_idx ON team_members(team_id, position)
    `);
  });
}

// Team operations
const teamOperations = {
  create: (presentationDay, callback) => {
    const id = nanoid();
    db.run('INSERT INTO teams (id, presentation_day) VALUES (?, ?)', [id, presentationDay], function(err) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, { id, presentation_day: presentationDay });
      }
    });
  },

  findById: (id, callback) => {
    db.get('SELECT * FROM teams WHERE id = ?', [id], callback);
  },

  updatePresentationDay: (id, presentationDay, callback) => {
    db.run('UPDATE teams SET presentation_day = ? WHERE id = ?', [presentationDay, id], callback);
  }
};

// Team member operations
const teamMemberOperations = {
  create: (teamId, name, position, callback) => {
    const id = nanoid();
    db.run('INSERT INTO team_members (id, team_id, name, position) VALUES (?, ?, ?, ?)', 
      [id, teamId, name, position], function(err) {
        if (err) {
          callback(err, null);
        } else {
          callback(null, { id, team_id: teamId, name, position });
        }
      });
  },

  findByTeamId: (teamId, callback) => {
    db.all('SELECT * FROM team_members WHERE team_id = ? ORDER BY position', [teamId], callback);
  },

  updatePosition: (id, position, callback) => {
    db.run('UPDATE team_members SET position = ? WHERE id = ?', [position, id], callback);
  },

  delete: (id, callback) => {
    db.run('DELETE FROM team_members WHERE id = ?', [id], callback);
  },

  bulkCreate: (members, callback) => {
    db.serialize(() => {
      const stmt = db.prepare('INSERT INTO team_members (id, team_id, name, position) VALUES (?, ?, ?, ?)');
      
      for (const member of members) {
        stmt.run(member.id, member.team_id, member.name, member.position);
      }
      
      stmt.finalize(callback);
    });
  },

  bulkUpdatePositions: (members, callback) => {
    db.serialize(() => {
      const stmt = db.prepare('UPDATE team_members SET position = ? WHERE id = ?');
      
      for (const member of members) {
        stmt.run(member.position, member.id);
      }
      
      stmt.finalize(callback);
    });
  }
};

// Initialize database on startup
initializeDatabase();

export { db, teamOperations, teamMemberOperations };
