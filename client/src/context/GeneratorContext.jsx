
import React, { createContext, useContext, useState, useEffect } from 'react';

const GeneratorContext = createContext();

export const useGenerator = () => useContext(GeneratorContext);

export const GeneratorProvider = ({ children }) => {
    // Form Inputs
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedSyllabus, setSelectedSyllabus] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [topics, setTopics] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [marksPerQuestion, setMarksPerQuestion] = useState(10);
    const [dueDate, setDueDate] = useState('');

    // Result
    const [generatedAssignment, setGeneratedAssignment] = useState(null);

    // Hydrate from localStorage on amount
    useEffect(() => {
        const stored = localStorage.getItem('generator_state');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSelectedCourse(parsed.selectedCourse || '');
                setSelectedSyllabus(parsed.selectedSyllabus || '');
                setTitle(parsed.title || '');
                setDescription(parsed.description || '');
                setTopics(parsed.topics || '');
                setNumQuestions(parsed.numQuestions || 5);
                setMarksPerQuestion(parsed.marksPerQuestion || 10);
                setDueDate(parsed.dueDate || '');
                // Note: We might not want to persist the HUGE generated object in LS, 
                // but for "context awareness" user likely wants it.
                // Storing large objects in LS can be risky (quota), but for text assignments it should be fine.
                setGeneratedAssignment(parsed.generatedAssignment || null);
            } catch (e) {
                console.error("Failed to parse generator state", e);
            }
        }
    }, []);

    // Persist to localStorage whenever state changes
    useEffect(() => {
        const state = {
            selectedCourse,
            selectedSyllabus,
            title,
            description,
            topics,
            numQuestions,
            marksPerQuestion,
            dueDate,
            generatedAssignment
        };
        localStorage.setItem('generator_state', JSON.stringify(state));
    }, [selectedCourse, selectedSyllabus, title, description, topics, numQuestions, marksPerQuestion, dueDate, generatedAssignment]);

    const resetGenerator = () => {
        setSelectedCourse('');
        setSelectedSyllabus('');
        setTitle('');
        setDescription('');
        setTopics('');
        setNumQuestions(5);
        setMarksPerQuestion(10);
        setDueDate('');
        setGeneratedAssignment(null);
        localStorage.removeItem('generator_state');
    };

    const value = {
        selectedCourse, setSelectedCourse,
        selectedSyllabus, setSelectedSyllabus,
        title, setTitle,
        description, setDescription,
        topics, setTopics,
        numQuestions, setNumQuestions,
        marksPerQuestion, setMarksPerQuestion,
        dueDate, setDueDate,
        generatedAssignment, setGeneratedAssignment,
        resetGenerator
    };

    return (
        <GeneratorContext.Provider value={value}>
            {children}
        </GeneratorContext.Provider>
    );
};
