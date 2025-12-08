import { create } from "zustand";

export const useStore = create((set) => ({
	step: "input", // input, settings, generating, result
	inputData: { type: "text", value: "", file: null },
	preferences: { style: "Cinematic" },
	generatedResult: null,
	isProcessing: false,
	processTrace: [],

	setStep: (step) => set({ step }),
	setInputData: (data) => set({ inputData: data }),
	setPreferences: (prefs) => set({ preferences: prefs }),
	setResult: (result) => set({ generatedResult: result }),
	setProcessing: (status) => set({ isProcessing: status }),
	addTraceStep: (step) => set((state) => ({ processTrace: [...state.processTrace, step] })),
	reset: () => set({ step: "input", generatedResult: null, processTrace: [], isProcessing: false }),
}));
