import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Save } from 'lucide-react';
import type { DayOfWeek, Presenter } from '../types';
import { supabase } from '../lib/supabase';

const daysOfWeek: { value: DayOfWeek; label: string }[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export default function CreateTeam() {
  const navigate = useNavigate();
  const [presenters, setPresenters] = useState<Omit<Presenter, 'id'>[]>([
    { name: 'Alice Johnson', position: 0 },
    { name: 'Bob Smith', position: 1 },
  ]);
  const [presentationDay, setPresentationDay] = useState<DayOfWeek>(1);
  const [newPresenterName, setNewPresenterName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newPresenterName.trim()) {
      e.preventDefault();
      addPresenter();
    }
  };

  const addPresenter = () => {
    if (!newPresenterName.trim()) return;
    setPresenters([
      ...presenters,
      { name: newPresenterName.trim(), position: presenters.length }
    ]);
    setNewPresenterName('');
  };

  const removePresenter = (position: number) => {
    if (presenters.length <= 2) {
      alert('Cannot remove presenter. Minimum 2 presenters required.');
      return;
    }
    setPresenters(
      presenters
        .filter(p => p.position !== position)
        .map((p, idx) => ({ ...p, position: idx }))
    );
  };

  const createTeam = async () => {
    if (presenters.length < 2) {
      alert('At least 2 presenters are required.');
      return;
    }

    setIsCreating(true);
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert([{ presentation_day: presentationDay }])
        .select()
        .single();

      if (teamError) throw teamError;

      const { error: membersError } = await supabase
        .from('team_members')
        .insert(
          presenters.map(p => ({
            team_id: team.id,
            name: p.name,
            position: p.position
          }))
        );

      if (membersError) throw membersError;

      navigate(`/team/${team.id}`);
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Create New Team</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Presentation Day</h2>
            <select
              value={presentationDay}
              onChange={(e) => setPresentationDay(Number(e.target.value) as DayOfWeek)}
              className="w-full px-3 py-2 border rounded-md bg-white"
            >
              {daysOfWeek.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700">Team Members</h2>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newPresenterName}
                  onChange={(e) => setNewPresenterName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="New team member name"
                  className="px-3 py-2 border rounded-md"
                />
                <button
                  onClick={addPresenter}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {presenters.map((presenter, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-md bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full">
                    {index + 1}
                  </span>
                  <span className="font-medium">{presenter.name}</span>
                </div>
                <button
                  onClick={() => removePresenter(presenter.position)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={createTeam}
              disabled={isCreating || presenters.length < 2}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isCreating ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}