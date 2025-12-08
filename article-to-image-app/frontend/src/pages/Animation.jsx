import React from "react";
import { useStore } from "../store/useStore";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const Animation = () => {
	const { t } = useTranslation();
	const { processTrace } = useStore();

	const steps = [
		{ key: "Input Processing", label: t("animation.steps.input") },
		{ key: "Semantic Analysis", label: t("animation.steps.semantic") },
		{ key: "Visual Planning", label: t("animation.steps.visual") },
		{ key: "Prompt Generation", label: t("animation.steps.prompt") },
		{ key: "Image Generation", label: t("animation.steps.image") },
		{ key: "CLIP Evaluation", label: t("animation.steps.evaluate") },
	];

	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto">
			<div className="space-y-8 w-full">
				{steps.map((step, index) => {
					const isCompleted = processTrace.some((t) => t.step === step.key);
					const isCurrent = !isCompleted && (index === 0 || processTrace.some((t) => t.step === steps[index - 1].key));

					return (
						<div key={step.key} className={`flex items-center space-x-4 p-4 rounded-lg transition-all ${isCurrent ? "bg-white shadow-lg scale-105" : "opacity-50"}`}>
							<div className="w-8 flex justify-center">{isCompleted ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : isCurrent ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin" /> : <div className="w-3 h-3 rounded-full bg-slate-300" />}</div>
							<div className="flex-1">
								<h3 className={`font-medium text-lg ${isCurrent ? "text-slate-900" : "text-slate-500"}`}>{step.label}</h3>
								{isCompleted && <p className="text-sm text-slate-400">{t("animation.status.completed")}</p>}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default Animation;
