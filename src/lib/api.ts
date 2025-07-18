const API_BASE_URL = '/api';

class APIClient {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Team operations
  async createTeam(presentationDay: number) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify({ presentation_day: presentationDay }),
    });
  }

  async getTeam(id: string) {
    return this.request(`/teams/${id}`);
  }

  async updateTeamPresentationDay(id: string, presentationDay: number) {
    return this.request(`/teams/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ presentation_day: presentationDay }),
    });
  }

  // Team member operations
  async createTeamMembers(teamId: string, members: Array<{ name: string; position: number }>) {
    return this.request(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ members }),
    });
  }

  async createTeamMember(teamId: string, name: string, position: number) {
    return this.request(`/teams/${teamId}/members`, {
      method: 'POST',
      body: JSON.stringify({ members: { name, position } }),
    });
  }

  async getTeamMembers(teamId: string) {
    return this.request(`/teams/${teamId}/members`);
  }

  async updateTeamMemberPosition(id: string, position: number) {
    return this.request(`/team-members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ position }),
    });
  }

  async deleteTeamMember(id: string) {
    return this.request(`/team-members/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUpdateMemberPositions(members: Array<{ id: string; position: number }>) {
    return this.request('/team-members/bulk-update', {
      method: 'PATCH',
      body: JSON.stringify({ members }),
    });
  }

  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new APIClient();
