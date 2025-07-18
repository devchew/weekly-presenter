import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Save } from 'lucide-react';
import type { DayOfWeek, Presenter } from '../types';
import { apiClient } from '../lib/api';

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
      const team = await apiClient.createTeam(presentationDay);
      
      await apiClient.createTeamMembers(team.id, presenters);

      navigate(`/team/${team.id}`);
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-yellow-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="neo-card">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-black text-black">Create New Team</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-black mb-4">
              Presentation Day
            </h2>
            <select
              value={presentationDay}
              onChange={(e) =>
                setPresentationDay(Number(e.target.value) as DayOfWeek)
              }
              className="neo-select w-full"
              aria-label="Select presentation day"
            >
              {daysOfWeek.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-black">Team Members</h2>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newPresenterName}
                  onChange={(e) => setNewPresenterName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="New team member name"
                  className="neo-input"
                />
                <button
                  onClick={addPresenter}
                  className="neo-button-primary"
                  aria-label="Add presenter"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {presenters.map((presenter, index) => (
              <div key={index} className="neo-member-card">
                <div className="flex items-center gap-3">
                  <span className="neo-badge">{index + 1}</span>
                  <span className="font-bold text-black">{presenter.name}</span>
                </div>
                <button
                  onClick={() => removePresenter(presenter.position)}
                  className="neo-button-danger p-2"
                  aria-label={`Remove ${presenter.name}`}
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
              className={
                isCreating || presenters.length < 2
                  ? "neo-button-disabled"
                  : "neo-button-secondary"
              }
            >
              <Save className="w-5 h-5 mr-2" />
              {isCreating ? "Creating..." : "Create Team"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}