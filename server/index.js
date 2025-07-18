import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import { teamOperations, teamMemberOperations } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../dist")));
}

// Teams endpoints
app.post("/api/teams", (req, res) => {
  try {
    const { presentation_day } = req.body;

    if (
      typeof presentation_day !== "number" ||
      presentation_day < 0 ||
      presentation_day > 6
    ) {
      return res.status(400).json({ error: "Invalid presentation_day" });
    }

    teamOperations.create(presentation_day, (err, team) => {
      if (err) {
        console.error("Error creating team:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json(team);
    });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/teams/:id", (req, res) => {
  try {
    const { id } = req.params;

    teamOperations.findById(id, (err, team) => {
      if (err) {
        console.error("Error fetching team:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      res.json(team);
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch("/api/teams/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { presentation_day } = req.body;

    if (
      typeof presentation_day !== "number" ||
      presentation_day < 0 ||
      presentation_day > 6
    ) {
      return res.status(400).json({ error: "Invalid presentation_day" });
    }

    teamOperations.findById(id, (err, team) => {
      if (err) {
        console.error("Error fetching team:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      teamOperations.updatePresentationDay(id, presentation_day, (err) => {
        if (err) {
          console.error("Error updating team:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        res.json({ id, presentation_day });
      });
    });
  } catch (error) {
    console.error("Error updating team:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Team members endpoints
app.post("/api/teams/:teamId/members", (req, res) => {
  try {
    const { teamId } = req.params;
    const { members } = req.body;

    // Verify team exists
    teamOperations.findById(teamId, (err, team) => {
      if (err) {
        console.error("Error fetching team:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      if (Array.isArray(members)) {
        // Bulk create members
        const membersWithIds = members.map((member) => ({
          id: nanoid(),
          team_id: teamId,
          name: member.name,
          position: member.position,
        }));

        teamMemberOperations.bulkCreate(membersWithIds, (err) => {
          if (err) {
            console.error("Error creating team members:", err);
            return res.status(500).json({ error: "Internal server error" });
          }
          res.json(membersWithIds);
        });
      } else {
        // Single member create
        const { name, position } = members;
        teamMemberOperations.create(teamId, name, position, (err, member) => {
          if (err) {
            console.error("Error creating team member:", err);
            return res.status(500).json({ error: "Internal server error" });
          }
          res.json(member);
        });
      }
    });
  } catch (error) {
    console.error("Error creating team members:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/teams/:teamId/members", (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify team exists
    teamOperations.findById(teamId, (err, team) => {
      if (err) {
        console.error("Error fetching team:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      teamMemberOperations.findByTeamId(teamId, (err, members) => {
        if (err) {
          console.error("Error fetching team members:", err);
          return res.status(500).json({ error: "Internal server error" });
        }
        res.json(members);
      });
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Bulk update positions (for swapping) - MUST come before the :id route
app.patch("/api/team-members/bulk-update", (req, res) => {
  try {
    const { members } = req.body;

    if (!Array.isArray(members)) {
      return res.status(400).json({ error: "Members must be an array" });
    }

    // Validate each member object
    for (const member of members) {
      if (!member.id || typeof member.id !== "string") {
        return res.status(400).json({ error: "Invalid member ID" });
      }
      if (typeof member.position !== "number" || member.position < 0) {
        return res.status(400).json({ error: "Invalid position" });
      }
    }

    teamMemberOperations.bulkUpdatePositions(members, (err) => {
      if (err) {
        console.error("Error bulk updating team members:", err);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error("Error bulk updating team members:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.patch('/api/team-members/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { position } = req.body;
    
    if (typeof position !== 'number') {
      return res.status(400).json({ error: 'Invalid position' });
    }

    teamMemberOperations.updatePosition(id, position, (err) => {
      if (err) {
        console.error('Error updating team member:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json({ id, position });
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/team-members/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    teamMemberOperations.delete(id, (err) => {
      if (err) {
        console.error('Error deleting team member:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json({ success: true });
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve React app for any non-API routes (must be last)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
