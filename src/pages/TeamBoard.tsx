import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Plus, X, Save, Calendar } from 'lucide-react';
import type { Team, DayOfWeek } from "../types";
import { apiClient } from '../lib/api';
import {
  getCurrentWeekNumber,
  getPresenterForWeek,
  getWeekStartDate,
  formatDate,
  formatDayOfWeek,
} from '../utils';

const daysOfWeek: { value: DayOfWeek; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function TeamBoard() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [swapMode, setSwapMode] = useState(false);
  const [selectedForSwap, setSelectedForSwap] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newPresenterName, setNewPresenterName] = useState('');

  useEffect(() => {
    if (!teamId) {
      navigate('/create');
      return;
    }

    const loadTeam = async () => {
      try {
        const teamData = await apiClient.getTeam(teamId);
        const members = await apiClient.getTeamMembers(teamId);

        if (!members || members.length === 0) {
          navigate('/create');
          return;
        }

        setTeam({
          id: teamData.id,
          presentationDay: teamData.presentation_day,
          members: members.map(
            (m: { id: string; name: string; position: number }) => ({
              id: m.id,
              name: m.name,
              position: m.position,
            })
          ),
        });
      } catch (err) {
        console.error('Error loading team:', err);
        if (err instanceof Error && err.message.includes('404')) {
          navigate('/create');
          return;
        }
        setError('Failed to load team data');
      } finally {
        setIsLoading(false);
      }
    };

    loadTeam();
  }, [teamId, navigate]);

  const handleDayChange = async (day: DayOfWeek) => {
    if (!team) return;

    try {
      await apiClient.updateTeamPresentationDay(team.id, day);
      setTeam({ ...team, presentationDay: day });
    } catch (err) {
      console.error('Error updating presentation day:', err);
      alert('Failed to update presentation day');
    }
  };

  const handleSwap = async (presenterId: string) => {
    if (!team) return;

    if (!swapMode) {
      setSwapMode(true);
      setSelectedForSwap(presenterId);
      return;
    }

    if (selectedForSwap === null) return;

    try {
      const member1 = team.members.find(m => m.id === selectedForSwap);
      const member2 = team.members.find(m => m.id === presenterId);

      if (!member1 || !member2) return;

      await apiClient.bulkUpdateMemberPositions([
        { id: member1.id, position: member2.position },
        { id: member2.id, position: member1.position }
      ]);

      const newMembers = [...team.members];
      const index1 = team.members.findIndex(m => m.id === selectedForSwap);
      const index2 = team.members.findIndex(m => m.id === presenterId);
      [newMembers[index1], newMembers[index2]] = [newMembers[index2], newMembers[index1]];

      setTeam({ ...team, members: newMembers });
    } catch (err) {
      console.error('Error swapping members:', err);
      alert('Failed to swap team members');
    } finally {
      setSwapMode(false);
      setSelectedForSwap(null);
    }
  };

  const addPresenter = async () => {
    if (!team || !newPresenterName.trim()) return;

    try {
      const newMember = await apiClient.createTeamMember(team.id, newPresenterName.trim(), team.members.length);

      setTeam({
        ...team,
        members: [...team.members, {
          id: newMember.id,
          name: newMember.name,
          position: newMember.position
        }]
      });
      setNewPresenterName('');
    } catch (err) {
      console.error('Error adding team member:', err);
      alert('Failed to add team member');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newPresenterName.trim()) {
      e.preventDefault();
      addPresenter();
    }
  };

  const removePresenter = async (id: string) => {
    if (!team) return;

    if (team.members.length <= 2) {
      alert('Cannot remove presenter. Minimum 2 presenters required.');
      return;
    }

    try {
      await apiClient.deleteTeamMember(id);

      const newMembers = team.members
        .filter(m => m.id !== id)
        .map((m, idx) => ({ ...m, position: idx }));

      // Update positions for remaining members
      await apiClient.bulkUpdateMemberPositions(
        newMembers.map(m => ({
          id: m.id,
          position: m.position
        }))
      );

      setTeam({ ...team, members: newMembers });
    } catch (err) {
      console.error('Error removing team member:', err);
      alert('Failed to remove team member');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
        <div className="text-2xl font-bold text-black">Loading...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-yellow-100 flex items-center justify-center">
        <div className="text-2xl font-bold text-red-600">
          {error || "Team not found"}
        </div>
      </div>
    );
  }

  const currentWeek = getCurrentWeekNumber();
  const currentPresenter = getPresenterForWeek(team.members, currentWeek);
  const upcomingWeeks = Array.from({ length: 5 }, (_, i) => currentWeek + i + 1);

  return (
    <div className="min-h-screen bg-yellow-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="neo-card">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black text-black">
              Weekly Status Presenter
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-black" />
                <select
                  value={team.presentationDay}
                  onChange={(e) =>
                    handleDayChange(Number(e.target.value) as DayOfWeek)
                  }
                  className="neo-select"
                  aria-label="Select presentation day"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={
                  isEditing ? "neo-button-secondary" : "neo-button-primary"
                }
              >
                {isEditing ? (
                  <Save className="w-5 h-5 mr-2" />
                ) : (
                  <Plus className="w-5 h-5 mr-2" />
                )}
                {isEditing ? "Save List" : "Edit List"}
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-black mb-4">Current Week</h2>
            <div className="neo-current-presenter">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-black mb-1">
                    {formatDayOfWeek(
                      getWeekStartDate(currentWeek, team.presentationDay)
                    )}
                    ,{" "}
                    {formatDate(
                      getWeekStartDate(currentWeek, team.presentationDay)
                    )}
                  </p>
                  <p className="text-2xl font-black text-black">
                    {currentPresenter.name}
                  </p>
                </div>
                {swapMode ? (
                  <button
                    onClick={() => {
                      setSwapMode(false);
                      setSelectedForSwap(null);
                    }}
                    className="neo-button-danger"
                  >
                    Cancel Swap
                  </button>
                ) : (
                  <button
                    onClick={() => handleSwap(currentPresenter.id)}
                    className="neo-button-primary"
                  >
                    Swap Presenter
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-bold text-black mb-4">
              Upcoming Presentations
            </h3>
            <div className="space-y-3">
              {upcomingWeeks.map((week) => {
                const presenter = getPresenterForWeek(team.members, week);
                const date = getWeekStartDate(week, team.presentationDay);
                return (
                  <div key={week} className="neo-upcoming-card">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-black mb-1">
                          {formatDayOfWeek(date)}, {formatDate(date)}
                        </p>
                        <p className="text-lg font-bold text-black">
                          {presenter.name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-black">
                Presentation Order
              </h3>
              {isEditing && (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newPresenterName}
                    onChange={(e) => setNewPresenterName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="New presenter name"
                    className="neo-input"
                  />
                  <button onClick={addPresenter} className="neo-button-primary">
                    Add
                  </button>
                </div>
              )}
            </div>
            {team.members.map((presenter, index) => (
              <div
                key={presenter.id}
                className={
                  selectedForSwap === presenter.id
                    ? "neo-member-card-selected"
                    : swapMode
                    ? "neo-member-card-swap"
                    : "neo-member-card"
                }
                onClick={() =>
                  swapMode &&
                  selectedForSwap !== presenter.id &&
                  handleSwap(presenter.id)
                }
              >
                <div className="flex items-center gap-3">
                  <span className="neo-badge">{index + 1}</span>
                  <span className="font-bold text-black">{presenter.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {swapMode && selectedForSwap === presenter.id && (
                    <ArrowLeftRight className="w-6 h-6 text-black" />
                  )}
                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePresenter(presenter.id);
                      }}
                      className="neo-button-danger p-2"
                      aria-label={`Remove ${presenter.name}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}