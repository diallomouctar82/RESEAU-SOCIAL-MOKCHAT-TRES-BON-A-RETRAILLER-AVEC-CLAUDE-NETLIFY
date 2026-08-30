
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GOAL_TEMPLATES } from '../components/navigation/NavigationItems';

export type GoalTemplate = typeof GOAL_TEMPLATES[number];

const STORAGE_KEY = 'lmav_current_goal';

interface GoalContextType {
    goalTemplates: GoalTemplate[];
    currentGoal: GoalTemplate | null;
    setCurrentGoal: (goal: GoalTemplate | null) => void;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

const readStoredGoal = (): GoalTemplate | null => {
    try {
        const storedId = localStorage.getItem(STORAGE_KEY);
        if (storedId) {
            return GOAL_TEMPLATES.find(g => g.id === storedId) || null;
        }
    } catch {
        // Ignore read errors (private browsing, quota, etc.)
    }
    return null;
};

export const GoalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentGoal, setCurrentGoalState] = useState<GoalTemplate | null>(readStoredGoal);

    const setCurrentGoal = (goal: GoalTemplate | null) => {
        setCurrentGoalState(goal);
        try {
            if (goal) {
                localStorage.setItem(STORAGE_KEY, goal.id);
            } else {
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            // Ignore write errors
        }
    };

    return (
        <GoalContext.Provider value={{ goalTemplates: GOAL_TEMPLATES, currentGoal, setCurrentGoal }}>
            {children}
        </GoalContext.Provider>
    );
};

export const useGoal = () => {
    const context = useContext(GoalContext);
    if (context === undefined) {
        throw new Error('useGoal must be used within a GoalProvider');
    }
    return context;
};
