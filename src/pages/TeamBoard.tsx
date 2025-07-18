import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Plus, X, Save, Calendar } from 'lucide-react';
import type { Team, Presenter, DayOfWeek } from '../types';
import { supabase } from '../lib/supabase';
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
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select('*')
          .eq('id', teamId)
          .single();

        if (teamError) {
          if (teamError.code === 'PGRST116') {
            // Team not found
            navigate('/create');
            return;
          }
          throw teamError;
        }

        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
          .order('position');

        if (membersError) throw membersError;

        if (!members || members.length === 0) {
          navigate('/create');
          return;
        }

        setTeam({
          id: teamData.id,
          presentationDay: teamData.presentation_day,
          members: members.map(m => ({
            id: m.id,
            name: m.name,
            position: m.position
          }))
        });
      } catch (err) {
        console.error('Error loading team:', err);
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
      const { error } = await supabase
        .from('teams')
        .update({ presentation_day: day })
        .eq('id', team.id);

      if (error) throw error;

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

      const { error } = await supabase
        .from('team_members')
        .upsert([
          { 
            id: member1.id, 
            team_id: team.id, 
            name: member1.name,
            position: member2.position 
          },
          { 
            id: member2.id, 
            team_id: team.id,
            name: member2.name,
            position: member1.position 
          }
        ]);

      if (error) throw error;

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
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          name: newPresenterName.trim(),
          position: team.members.length
        })
        .select()
        .single();

      if (error) throw error;

      setTeam({
        ...team,
        members: [...team.members, {
          id: data.id,
          name: data.name,
          position: data.position
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
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const newMembers = team.members
        .filter(m => m.id !== id)
        .map((m, idx) => ({ ...m, position: idx }));

      // Update positions for remaining members
      await supabase
        .from('team_members')
        .upsert(
          newMembers.map(m => ({
            id: m.id,
            team_id: team.id,
            name: m.name,
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error || 'Team not found'}</div>
      </div>
    );
  }

  const currentWeek = getCurrentWeekNumber();
  const currentPresenter = getPresenterForWeek(team.members, currentWeek);
  const upcomingWeeks = Array.from({ length: 5 }, (_, i) => currentWeek + i + 1);

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Weekly Status Presenter</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <select
                  value={team.presentationDay}
                  onChange={(e) => handleDayChange(Number(e.target.value) as DayOfWeek)}
                  className="px-3 py-2 border rounded-md bg-white"
                >
                  {daysOfWeek.map(day => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                  isEditing 
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {isEditing ? 'Save List' : 'Edit List'}
              </button>
            </div>
          </div>
          
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Current Week
            </h2>
            <div className="flex items-center justify-between bg-white p-4 rounded-md shadow-sm">
              <div>
                <p className="text-sm text-gray-500">
                  {formatDayOfWeek(getWeekStartDate(currentWeek, team.presentationDay))}, {' '}
                  {formatDate(getWeekStartDate(currentWeek, team.presentationDay))}
                </p>
                <p className="text-xl font-bold text-blue-600">{currentPresenter.name}</p>
              </div>
              {swapMode ? (
                <button
                  onClick={() => {
                    setSwapMode(false);
                    setSelectedForSwap(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel Swap
                </button>
              ) : (
                <button
                  onClick={() => handleSwap(currentPresenter.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Swap Presenter
                </button>
              )}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Upcoming Presentations</h3>
            <div className="space-y-2">
              {upcomingWeeks.map(week => {
                const presenter = getPresenterForWeek(team.members, week);
                const date = getWeekStartDate(week, team.presentationDay);
                return (
                  <div key={week} className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatDayOfWeek(date)}, {formatDate(date)}
                      </p>
                      <p className="font-medium text-gray-800">{presenter.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">Presentation Order</h3>
              {isEditing && (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newPresenterName}
                    onChange={(e) => setNewPresenterName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="New presenter name"
                    className="px-3 py-2 border rounded-md"
                  />
                  <button
                    onClick={addPresenter}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
            {team.members.map((presenter, index) => (
              <div
                key={presenter.id}
                className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                  selectedForSwap === presenter.id
                    ? 'bg-blue-100'
                    : swapMode
                    ? 'bg-gray-50 hover:bg-blue-50 cursor-pointer'
                    : 'bg-gray-50'
                }`}
                onClick={() => swapMode && selectedForSwap !== presenter.id && handleSwap(presenter.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full">
                    {index + 1}
                  </span>
                  <span className="font-medium">{presenter.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {swapMode && selectedForSwap === presenter.id && (
                    <ArrowLeftRight className="w-5 h-5 text-blue-600" />
                  )}
                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePresenter(presenter.id);
                      }}
                      className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
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