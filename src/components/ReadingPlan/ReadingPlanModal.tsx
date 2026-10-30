import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle2, Circle, X, BookOpen, ChevronRight } from 'lucide-react';
import type { ReadingPlan, ReadingPlanDay } from '../../types/bible';

interface ReadingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadReading: (bookId: number, chapter: number) => void;
}

export const ReadingPlanModal: React.FC<ReadingPlanModalProps> = ({
  isOpen,
  onClose,
  onLoadReading
}) => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [days, setDays] = useState<ReadingPlanDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlans();
    }
  }, [isOpen]);

  const loadPlans = async () => {
    try {
      const allPlans = await window.api.getReadingPlans();
      setPlans(allPlans);
      if (allPlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(allPlans[0].id);
        loadDays(allPlans[0].id);
      } else if (selectedPlanId) {
        loadDays(selectedPlanId);
      }
    } catch (e) {
      console.error('Failed to load plans:', e);
    }
  };

  const loadDays = async (planId: string) => {
    setIsLoading(true);
    try {
      const planDays = await window.api.getReadingPlanDays(planId);
      setDays(planDays);
    } catch (e) {
      console.error('Failed to load days:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    loadDays(planId);
  };

  const handleToggleDay = async (dayNumber: number) => {
    try {
      await window.api.toggleReadingPlanDay(selectedPlanId, dayNumber);
      // Reload updated progress
      loadPlans();
    } catch (e) {
      console.error('Failed to toggle day:', e);
    }
  };

  if (!isOpen) return null;

  const currentPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-workstation-panel border border-workstation-border rounded-xl shadow-2xl flex flex-col h-[75vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="h-14 border-b border-workstation-border px-6 flex items-center justify-between bg-workstation-bg flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-workstation-accent" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t('plans.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-workstation-muted hover:text-white p-1 rounded hover:bg-workstation-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Plans Selector + Right Days Schedule */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Plans List */}
          <div className="w-64 border-r border-workstation-border bg-workstation-sidebar/60 p-3 space-y-2 overflow-y-auto">
            <span className="text-[10px] font-bold text-workstation-muted uppercase tracking-wider px-2">
              Available Plans
            </span>
            {plans.map((p) => {
              const isSelected = p.id === selectedPlanId;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelectPlan(p.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-workstation-active border-workstation-accent text-white shadow-sm'
                      : 'bg-workstation-panel hover:bg-workstation-hover border-workstation-border text-workstation-muted'
                  }`}
                >
                  <h4 className="text-xs font-semibold text-white">{p.title}</h4>
                  <p className="text-[11px] text-workstation-muted mt-1 line-clamp-2">
                    {p.description}
                  </p>
                  
                  {/* Progress Bar */}
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[10px] text-workstation-muted mb-1 font-mono">
                      <span>Day {p.current_day} of {p.duration_days}</span>
                      <span>{p.progress_percent}%</span>
                    </div>
                    <div className="w-full bg-workstation-bg h-1.5 rounded-full overflow-hidden border border-workstation-border/60">
                      <div
                        className="bg-workstation-accent h-full transition-all duration-300"
                        style={{ width: `${p.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Days Schedule */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-workstation-bg">
            <div className="flex items-center justify-between pb-2 border-b border-workstation-border mb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {currentPlan?.title}
                </h3>
                <span className="text-[11px] text-workstation-muted">
                  {currentPlan?.duration_days} Days Scheduled
                </span>
              </div>
            </div>

            {days.map((day) => (
              <div
                key={day.day_number}
                className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                  day.completed
                    ? 'bg-workstation-panel/40 border-emerald-900/40 text-workstation-muted'
                    : 'bg-workstation-panel border-workstation-border hover:border-workstation-accent/50 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleDay(day.day_number)}
                    className="text-workstation-muted hover:text-emerald-400 transition-colors"
                  >
                    {day.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div>
                    <span className="text-xs font-semibold block">
                      Day {day.day_number}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {day.readings.map((r, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-1.5 py-0.2 rounded bg-workstation-bg border border-workstation-border text-workstation-accent"
                        >
                          {r.book_name} {r.chapter}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Read Now Button */}
                {day.readings.length > 0 && (
                  <button
                    onClick={() => {
                      onLoadReading(day.readings[0].book_id, day.readings[0].chapter);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-workstation-bg hover:bg-workstation-accent hover:text-slate-950 border border-workstation-border text-workstation-accent rounded-md text-xs font-medium flex items-center gap-1 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
